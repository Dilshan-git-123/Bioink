"""
BioInkAI Crossref Client
Uses the Crossref REST API to retrieve bibliographic metadata.
Crossref provides DOI-anchored metadata.  No experimental evidence is inferred.

No API key required.
Polite pool usage: include mailto in request.
"""

import time
import logging
import json
import urllib.parse
import urllib.request
import os
from typing import List, Optional

from literature.models import LiteratureRecord

logger = logging.getLogger(__name__)

CROSSREF_URL = "https://api.crossref.org/works"
_REQUEST_DELAY = 0.5


def _mailto_header() -> dict:
    email = os.getenv("NCBI_EMAIL", "bioink@example.com")
    return {"User-Agent": f"BioInkAI/2.0 (mailto:{email})"}


def _http_get(url: str, timeout: int = 12) -> Optional[dict]:
    req = urllib.request.Request(url, headers=_mailto_header())
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as exc:
        logger.warning("Crossref HTTP error: %s", exc)
        return None


def search_crossref(query: str, max_results: int = 8) -> List[LiteratureRecord]:
    """
    Search Crossref for relevant bioink/bioprinting literature.
    Returns bibliographic metadata only.
    Abstract included only if the publisher provides it through Crossref.
    Never fabricates missing fields.
    """
    records: List[LiteratureRecord] = []

    params = urllib.parse.urlencode({
        "query": query,
        "rows": max_results,
        "select": "DOI,title,author,published,container-title,abstract,URL,type",
        "sort": "relevance",
    })
    url = f"{CROSSREF_URL}?{params}"

    time.sleep(_REQUEST_DELAY)
    data = _http_get(url)
    if not data:
        logger.warning("Crossref returned nothing for query: %s", query)
        return records

    items = data.get("message", {}).get("items", [])
    for item in items:
        # Title
        title_list = item.get("title", [])
        if not title_list:
            continue
        title = title_list[0].strip().rstrip(".")

        # Authors
        authors = []
        for a in item.get("author", []):
            given = a.get("given", "")
            family = a.get("family", "")
            name = f"{given} {family}".strip() if family else given
            if name:
                authors.append(name)

        # Year
        year: Optional[int] = None
        pub = item.get("published", {})
        date_parts = pub.get("date-parts", [[]])
        if date_parts and date_parts[0]:
            try:
                year = int(date_parts[0][0])
            except (ValueError, IndexError):
                year = None

        # Journal
        container = item.get("container-title", [])
        journal = container[0] if container else None

        doi = item.get("DOI") or None
        abstract = item.get("abstract") or None
        # Strip JATS XML tags if present
        if abstract:
            import re
            abstract = re.sub(r"<[^>]+>", "", abstract).strip()
            if not abstract:
                abstract = None

        url_link = item.get("URL") or (f"https://doi.org/{doi}" if doi else None)

        records.append(LiteratureRecord(
            title=title,
            authors=authors,
            year=year,
            journal=journal,
            doi=doi,
            pmid=None,    # Crossref does not provide PMIDs
            pmcid=None,   # Crossref does not provide PMCIDs
            abstract=abstract,
            source_database="Crossref",
            full_text_available=False,  # Crossref links to publisher; open-access unknown
            url=url_link,
        ))

    logger.info("Crossref returned %d records for: %s", len(records), query)
    return records
