"""
BioInkAI Literature Ranker
Scores retrieved literature records against the user's formulation.

Scoring is deterministic and explainable:
  +30  exact biomaterial name match in title/abstract
  +25  material combination match (both materials appear)
  +20  tissue match in title/abstract
  +10  crosslinker match in title/abstract
  +10  "bioink" or "bioprinting" or "3D printing" keyword match
  +5   full-text available (PMC/open-access)
  +3   abstract available
  -5   year before 2010 (older literature, lower weight)
  +2   per matching author keyword (minor tiebreaker)

No score is guessed or fabricated.  Missing fields simply contribute 0.
"""

import re
from typing import List

from literature.models import LiteratureRecord

# Keywords always searched
_BIOINK_TERMS = {"bioink", "bioprinting", "3d print", "3d bioprint", "extrusion print", "biofabrication"}


def _text(record: LiteratureRecord) -> str:
    """Aggregate searchable text from a record (title + abstract)."""
    parts = [record.title or ""]
    if record.abstract:
        parts.append(record.abstract)
    return " ".join(parts).lower()


def rank_records(
    records: List[LiteratureRecord],
    materials: List[str],
    tissue: str,
    crosslinker: str,
) -> List[LiteratureRecord]:
    """
    Score and sort records by relevance to the user's formulation.
    Returns the same list with updated relevance_score, sorted descending.
    """
    mat_lower = [m.lower().strip() for m in materials if m]
    tissue_lower = tissue.lower().strip() if tissue else ""
    cross_lower = crosslinker.lower().strip() if crosslinker else ""
    # Common crosslinker aliases
    cross_aliases = _crosslinker_aliases(cross_lower)

    for rec in records:
        score = 0
        text = _text(rec)

        # Material match (+30 per material found)
        mat_matches = 0
        for mat in mat_lower:
            if mat and mat in text:
                score += 30
                mat_matches += 1

        # Combination bonus (+25 if ALL materials appear together)
        if len(mat_lower) > 1 and mat_matches == len(mat_lower):
            score += 25

        # Tissue match (+20)
        if tissue_lower and tissue_lower in text:
            score += 20

        # Crosslinker match (+10)
        for alias in cross_aliases:
            if alias and alias in text:
                score += 10
                break

        # Bioink / printing keyword (+10)
        for term in _BIOINK_TERMS:
            if term in text:
                score += 10
                break

        # Full-text available (+5)
        if rec.full_text_available:
            score += 5

        # Abstract available (+3)
        if rec.abstract:
            score += 3

        # Recency penalty: before 2010 = -5
        if rec.year and rec.year < 2010:
            score -= 5

        rec.relevance_score = score

    # Sort descending by relevance, then by year descending as tiebreaker
    records.sort(
        key=lambda r: (r.relevance_score, r.year or 0),
        reverse=True,
    )
    return records


def _crosslinker_aliases(crosslinker: str) -> List[str]:
    """Return common name variants for a crosslinker string."""
    aliases_map = {
        "cacl2": ["cacl2", "calcium chloride", "caci₂", "cacl₂"],
        "calcium chloride": ["cacl2", "calcium chloride"],
        "genipin": ["genipin"],
        "glutaraldehyde": ["glutaraldehyde"],
        "uv": ["uv", "photo", "photocrosslinking", "photopolymerization"],
        "gelma": ["gelma", "gelatin methacryloyl", "gelatin methacrylate"],
    }
    for key, variants in aliases_map.items():
        if key in crosslinker or crosslinker in key:
            return variants
    return [crosslinker] if crosslinker else []
