"""
BioInkAI PubMed Client
Uses NCBI E-utilities (ESearch + ESummary) to retrieve literature metadata.
Respects NCBI rate limits: 3 req/sec without API key, 10 req/sec with key.

Environment variables:
  NCBI_TOOL_NAME  - tool name reported to NCBI (default: BioInkAI)
  NCBI_EMAIL      - contact email reported to NCBI (required by NCBI policy)
  NCBI_API_KEY    - optional, increases rate limit to 10 req/sec
"""

import os
import time
import logging
import urllib.parse
import urllib.request
import json
import xml.etree.ElementTree as ET
from typing import List, Optional

from literature.models import LiteratureRecord

logger = logging.getLogger(__name__)

ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
ESUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"

# Polite delay between requests (seconds)
_REQUEST_DELAY = 0.4   # stays safely under 3 req/sec without API key


def _build_params(extra: dict) -> str:
    tool = os.getenv("NCBI_TOOL_NAME", "BioInkAI")
    email = os.getenv("NCBI_EMAIL", "bioink@example.com")
    api_key = os.getenv("NCBI_API_KEY", "")
    params = {
        "tool": tool,
        "email": email,
        "retmode": "json",
        **extra,
    }
    if api_key:
        params["api_key"] = api_key
    return urllib.parse.urlencode(params)


def _http_get(url: str, params: str, timeout: int = 10) -> Optional[dict]:
    full_url = f"{url}?{params}"
    try:
        with urllib.request.urlopen(full_url, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as exc:
        logger.warning("PubMed HTTP error: %s", exc)
        return None


def search_pubmed(query: str, max_results: int = 8) -> List[LiteratureRecord]:
    """
    Search PubMed via ESearch then fetch metadata via ESummary.
    Returns a list of LiteratureRecord objects (bibliographic metadata only).
    NEVER fabricates values — if a field is absent in the API response it is None.
    """
    records: List[LiteratureRecord] = []

    # ── ESearch ──────────────────────────────────────────────────────────────
    search_params = _build_params({
        "db": "pubmed",
        "term": query,
        "retmax": max_results,
        "usehistory": "y",
        "sort": "relevance",
    })
    time.sleep(_REQUEST_DELAY)
    search_result = _http_get(ESEARCH_URL, search_params)
    if not search_result:
        logger.warning("PubMed ESearch returned nothing for query: %s", query)
        return records

    esearch = search_result.get("esearchresult", {})
    pmids: List[str] = esearch.get("idlist", [])
    if not pmids:
        logger.info("PubMed: no results for query: %s", query)
        return records

    # ── ESummary ─────────────────────────────────────────────────────────────
    summary_params = _build_params({
        "db": "pubmed",
        "id": ",".join(pmids),
    })
    time.sleep(_REQUEST_DELAY)
    summary_result = _http_get(ESUMMARY_URL, summary_params)
    if not summary_result:
        logger.warning("PubMed ESummary returned nothing for PMIDs: %s", pmids)
        return records

    result_map = summary_result.get("result", {})
    for pmid in pmids:
        if pmid == "uids":
            continue
        article = result_map.get(pmid)
        if not article:
            continue

        # --- Extract fields safely (never invent values) ---
        title = article.get("title") or None
        if title:
            # Strip trailing period added by PubMed
            title = title.rstrip(".")

        # Authors: list of {"name": "Doe J", ...}
        authors_raw = article.get("authors", [])
        authors = [a.get("name", "") for a in authors_raw if a.get("name")]

        pub_date = article.get("pubdate", "")
        year: Optional[int] = None
        if pub_date:
            try:
                year = int(pub_date.split(" ")[0])
            except (ValueError, IndexError):
                year = None

        journal = article.get("source") or None

        # DOI from articleids list
        doi: Optional[str] = None
        pmcid: Optional[str] = None
        article_url: Optional[str] = None
        for aid in article.get("articleids", []):
            id_type = aid.get("idtype", "")
            id_val = aid.get("value", "")
            if id_type == "doi" and id_val:
                doi = id_val
            elif id_type == "pmc" and id_val:
                pmcid = id_val

        if pmcid:
            article_url = f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmcid}/"
            full_text_available = True
        else:
            article_url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
            full_text_available = False

        if not title:
            continue   # Skip records with no title

        records.append(LiteratureRecord(
            title=title,
            authors=authors,
            year=year,
            journal=journal,
            doi=doi,
            pmid=pmid,
            pmcid=pmcid,
            abstract=None,   # ESummary does not include abstract; use EFetch for that (future)
            source_database="PubMed",
            full_text_available=full_text_available,
            url=article_url,
        ))

    logger.info("PubMed returned %d records for: %s", len(records), query)
    return records
