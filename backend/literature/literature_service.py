"""
BioInkAI Literature Service
Orchestrates multi-source literature retrieval with:
  - query generation from formulation
  - concurrent-safe sequential calls to PubMed, Europe PMC, Crossref
  - deduplication by DOI / PMID
  - relevance ranking
  - in-memory cache keyed on normalized query

Error isolation: if one source fails, the others continue.
"""

import hashlib
import logging
import time
from typing import Any, Dict, List, Optional, Tuple

from literature.models import LiteratureRecord, SearchQuery
from literature.pubmed_client import search_pubmed
from literature.europe_pmc_client import search_europe_pmc
from literature.crossref_client import search_crossref
from literature.literature_ranker import rank_records

logger = logging.getLogger(__name__)

# ── Simple in-memory cache ───────────────────────────────────────────────────
_CACHE: Dict[str, Dict[str, Any]] = {}
_CACHE_TTL_SECONDS = 3600   # 1 hour


def _cache_key(queries: List[str]) -> str:
    combined = "|".join(sorted(queries))
    return hashlib.md5(combined.encode()).hexdigest()


def _cache_get(key: str) -> Optional[List[LiteratureRecord]]:
    entry = _CACHE.get(key)
    if entry and (time.time() - entry["ts"]) < _CACHE_TTL_SECONDS:
        logger.info("Literature cache HIT for key %s", key)
        return entry["records"]
    return None


def _cache_set(key: str, records: List[LiteratureRecord]) -> None:
    _CACHE[key] = {"records": records, "ts": time.time()}


# ── Query generation ─────────────────────────────────────────────────────────

def _normalize(s: str) -> str:
    return s.strip().lower()


def build_queries(tissue: str, materials: List[str], crosslinker: str) -> SearchQuery:
    """
    Construct a small set of high-quality search queries.
    Queries are specific to the user's formulation; no generic filler.
    """
    t = tissue.strip() if tissue else ""
    mats = [m.strip() for m in materials if m.strip()]
    cross = crosslinker.strip() if crosslinker else ""

    mat_str = " ".join(mats)
    queries: List[str] = []

    if mats and t:
        queries.append(f"{mat_str} bioink {t} 3D bioprinting")
        queries.append(f"{mat_str} hydrogel {t}")

    if mats and cross:
        queries.append(f"{mat_str} {cross} bioink crosslinking")

    if mats:
        queries.append(f"{mat_str} bioink extrusion printing")
        queries.append(f"{mat_str} bioprinting protocol")

    if t:
        queries.append(f"bioink {t} tissue engineering")

    # De-duplicate while preserving order
    seen = set()
    unique: List[str] = []
    for q in queries:
        if q not in seen:
            seen.add(q)
            unique.append(q)

    return SearchQuery(
        tissue=t,
        materials=mats,
        crosslinker=cross,
        queries=unique[:5],   # cap at 5 queries
    )


# ── Deduplication ────────────────────────────────────────────────────────────

def _dedup(records: List[LiteratureRecord]) -> List[LiteratureRecord]:
    """Remove duplicate records, preferring records with more metadata."""
    seen_doi: set = set()
    seen_pmid: set = set()
    seen_title: set = set()
    out: List[LiteratureRecord] = []

    for rec in records:
        if rec.doi and rec.doi in seen_doi:
            continue
        if rec.pmid and rec.pmid in seen_pmid:
            continue
        norm_title = _normalize(rec.title) if rec.title else ""
        if norm_title and norm_title in seen_title:
            continue

        if rec.doi:
            seen_doi.add(rec.doi)
        if rec.pmid:
            seen_pmid.add(rec.pmid)
        if norm_title:
            seen_title.add(norm_title)
        out.append(rec)

    return out


# ── Main retrieval function ───────────────────────────────────────────────────

def retrieve_literature(
    tissue: str,
    materials: List[str],
    crosslinker: str,
    max_per_source: int = 8,
) -> Tuple[List[LiteratureRecord], SearchQuery]:
    """
    Retrieve literature from PubMed, Europe PMC, and Crossref.
    Returns (ranked_records, search_query).

    Error isolation: each source is tried independently.
    Falls back gracefully if any or all sources fail.
    """
    search_query = build_queries(tissue, materials, crosslinker)

    # Use only the primary query for cache key (to avoid over-splitting)
    cache_key = _cache_key(search_query.queries)
    cached = _cache_get(cache_key)
    if cached is not None:
        ranked = rank_records(cached, materials, tissue, crosslinker)
        return ranked, search_query

    all_records: List[LiteratureRecord] = []
    primary_query = search_query.primary_query()

    # PubMed
    try:
        pubmed_recs = search_pubmed(primary_query, max_results=max_per_source)
        all_records.extend(pubmed_recs)
        logger.info("PubMed: %d records", len(pubmed_recs))
    except Exception as exc:
        logger.warning("PubMed retrieval failed: %s", exc)

    # Europe PMC (use second query variant if available)
    epmc_query = search_query.queries[1] if len(search_query.queries) > 1 else primary_query
    try:
        epmc_recs = search_europe_pmc(epmc_query, max_results=max_per_source)
        all_records.extend(epmc_recs)
        logger.info("EuropePMC: %d records", len(epmc_recs))
    except Exception as exc:
        logger.warning("Europe PMC retrieval failed: %s", exc)

    # Crossref
    crossref_query = search_query.queries[2] if len(search_query.queries) > 2 else primary_query
    try:
        crossref_recs = search_crossref(crossref_query, max_results=max_per_source)
        all_records.extend(crossref_recs)
        logger.info("Crossref: %d records", len(crossref_recs))
    except Exception as exc:
        logger.warning("Crossref retrieval failed: %s", exc)

    # Dedup + rank
    unique_records = _dedup(all_records)
    ranked = rank_records(unique_records, materials, tissue, crosslinker)

    _cache_set(cache_key, ranked)
    return ranked, search_query
