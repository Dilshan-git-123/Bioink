"""
BioInkAI Literature Models
Data models for literature records, evidence, and search results.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class LiteratureRecord:
    """A single literature record retrieved from any external source."""
    title: str
    authors: List[str]
    year: Optional[int]
    journal: Optional[str]
    doi: Optional[str]
    pmid: Optional[str]
    pmcid: Optional[str]
    abstract: Optional[str]
    source_database: str           # "PubMed" | "EuropePMC" | "Crossref"
    full_text_available: bool
    url: Optional[str]
    relevance_score: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "authors": self.authors,
            "year": self.year,
            "journal": self.journal,
            "doi": self.doi,
            "pmid": self.pmid,
            "pmcid": self.pmcid,
            "abstract": self.abstract,
            "source_database": self.source_database,
            "full_text_available": self.full_text_available,
            "url": self.url,
            "relevance_score": self.relevance_score,
        }


@dataclass
class EvidenceItem:
    """
    A single evidence entry linking a parameter value to its literature source.
    IMPORTANT: Only populated when the value was actually found in a source.
    Never fabricate values.
    """
    parameter: str
    value: Optional[str]           # None if not available
    unit: Optional[str]
    evidence_type: str             # "bibliographic" | "abstract" | "kb_derived" | "not_available"
    confidence: str                # "high" | "medium" | "low" | "unavailable"
    source_title: Optional[str] = None
    source_doi: Optional[str] = None
    source_pmid: Optional[str] = None
    source_pmcid: Optional[str] = None
    source_database: Optional[str] = None
    note: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "parameter": self.parameter,
            "value": self.value,
            "unit": self.unit,
            "evidence_type": self.evidence_type,
            "confidence": self.confidence,
            "source": {
                "title": self.source_title,
                "doi": self.source_doi,
                "pmid": self.source_pmid,
                "pmcid": self.source_pmcid,
                "database": self.source_database,
            },
            "note": self.note,
        }


@dataclass
class SearchQuery:
    """Encapsulates the generated search queries for a formulation."""
    tissue: str
    materials: List[str]
    crosslinker: Optional[str]
    queries: List[str] = field(default_factory=list)

    def primary_query(self) -> str:
        return self.queries[0] if self.queries else ""
