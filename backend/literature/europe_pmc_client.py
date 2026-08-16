"""
BioInkAI Europe PMC Client
Uses the Europe PMC REST API to retrieve open-access literature metadata.
Prefers records with full-text availability.

No API key required for basic use.
Rate: polite 0.5 s delay between requests.
"""

import time
import logging
import json
import urllib.parse
import urllib.request
from typing import List, Optional

from literature.models import LiteratureRecord

logger = logging.getLogger(__name__)

EPMC_SEARCH_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
_REQUEST_DELAY = 0.5


def _http_get(url: str, timeout: int = 12) -> Optional[dict]:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as exc:
        logger.warning("Europe PMC HTTP error: %s", exc)
        return None


def search_europe_pmc(query: str, max_results: int = 8) -> List[LiteratureRecord]:
    """
    Search Europe PMC for relevant bioink/bioprinting literature.
    Returns bibliographic metadata only.  Abstract included when provided.
    Never fabricates missing fields.
    """
    records: List[LiteratureRecord] = []

    params = urllib.parse.urlencode({
        "query": query,
        "format": "json",
        "pageSize": max_results,
        "resultType": "core",      # includes abstract, full-text links
        "sort": "RELEVANCE",
    })
    url = f"{EPMC_SEARCH_URL}?{params}"

    time.sleep(_REQUEST_DELAY)
    data = _http_get(url)
    if not data:
        logger.warning("Europe PMC returned nothing for query: %s", query)
        return records

    results = data.get("resultList", {}).get("result", [])
    for item in results:
        title = item.get("title")
        if not title:
            continue
        # Strip trailing period or whitespace
        title = title.strip().rstrip(".")

        # Authors
        author_list = item.get("authorList", {}).get("author", [])
        authors = []
        for a in author_list:
            full_name = a.get("fullName") or a.get("lastName", "")
            if full_name:
                authors.append(full_name)

        # Year
        year: Optional[int] = None
        pub_year = item.get("pubYear")
        if pub_year:
            try:
                year = int(pub_year)
            except ValueError:
                year = None

        journal = item.get("journalTitle") or item.get("journal", {}).get("title") or None
        doi = item.get("doi") or None
        pmid = str(item.get("pmid")) if item.get("pmid") else None
        pmcid = item.get("pmcid") or None
        abstract = item.get("abstractText") or None

        # Full-text availability
        is_oa = item.get("isOpenAccess", "N")
        full_text_available = is_oa == "Y" and pmcid is not None

        # URL
        if pmcid:
            url_link = f"https://europepmc.org/article/pmc/{pmcid.replace('PMC', '')}"
        elif pmid:
            url_link = f"https://europepmc.org/article/med/{pmid}"
        elif doi:
            url_link = f"https://doi.org/{doi}"
        else:
            url_link = None

        records.append(LiteratureRecord(
            title=title,
            authors=authors,
            year=year,
            journal=journal,
            doi=doi,
            pmid=pmid,
            pmcid=pmcid,
            abstract=abstract,
            source_database="EuropePMC",
            full_text_available=full_text_available,
            url=url_link,
        ))

    logger.info("Europe PMC returned %d records for: %s", len(records), query)
    return records
