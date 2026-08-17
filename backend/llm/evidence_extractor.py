"""
BioInkAI Evidence Extractor
Calls Gemini to extract experimental parameters from supplied literature text.

INTEGRITY CONTRACT:
- Only abstracts and full-text excerpts are sent to Gemini.
- Title-only records are marked as bibliographic; Gemini is not asked to extract values from them.
- Gemini output is validated through Pydantic before use.
- Invalid or unvalidatable items are discarded, not corrected.
"""

import json
import logging
from typing import Any, Dict, List, Optional

from llm.gemini_client import generate_text, is_available
from llm.evidence_models import ExtractedEvidenceItem, ExtractionResult
from llm.prompts import (
    EVIDENCE_EXTRACTION_SYSTEM,
    EVIDENCE_EXTRACTION_USER_TEMPLATE,
    TARGET_PARAMETERS,
)
from literature.models import LiteratureRecord

logger = logging.getLogger(__name__)


def _build_paper_block(records: List[LiteratureRecord]) -> str:
    """
    Build the scientific text block to send to Gemini.

    Priority per paper:
      1. Abstract (real text — may contain experimental values)
      2. Bibliographic metadata only (title, authors, journal — NO experimental values)

    Full text is not available in the current pipeline; abstract is the highest
    fidelity text available.
    """
    lines = []
    for i, rec in enumerate(records, start=1):
        source_id = f"PMID:{rec.pmid}" if rec.pmid else (f"DOI:{rec.doi}" if rec.doi else f"Paper{i}")
        lines.append(f"--- Paper {i} [{source_id}] ---")
        lines.append(f"Title: {rec.title or 'N/A'}")
        author_str = ", ".join((rec.authors or [])[:3])
        if rec.authors and len(rec.authors) > 3:
            author_str += " et al."
        lines.append(f"Authors: {author_str}")
        lines.append(f"Year: {rec.year or 'N/A'}")
        lines.append(f"Journal: {rec.journal or 'N/A'}")

        if rec.abstract and rec.abstract.strip():
            lines.append(f"Abstract: {rec.abstract.strip()}")
        else:
            lines.append("Abstract: [Not available — bibliographic reference only]")
        lines.append("")
    return "\n".join(lines)


def _validate_items(raw_items: List[Dict]) -> List[ExtractedEvidenceItem]:
    """
    Validate each Gemini-returned item through Pydantic.
    Discard any item that fails validation.
    """
    valid = []
    for item in raw_items:
        try:
            evidence = ExtractedEvidenceItem(**item)

            # Extra integrity rules beyond Pydantic
            if evidence.evidence_type == "experimental":
                if not evidence.evidence_text:
                    logger.warning(
                        "[BioInkAI LLM] Discarding experimental item with no evidence_text: %s",
                        evidence.parameter,
                    )
                    continue
                if evidence.value is None:
                    logger.warning(
                        "[BioInkAI LLM] Discarding experimental item with null value: %s",
                        evidence.parameter,
                    )
                    continue
                if not evidence.source_id:
                    logger.warning(
                        "[BioInkAI LLM] Discarding experimental item with no source_id: %s",
                        evidence.parameter,
                    )
                    continue

            valid.append(evidence)
        except Exception as exc:
            logger.warning("[BioInkAI LLM] Validation failed for item: %s — %s", item.get("parameter", "?"), exc)

    return valid


def _deduplicate(items: List[ExtractedEvidenceItem]) -> List[ExtractedEvidenceItem]:
    """Remove duplicate parameters, preferring higher-quality evidence."""
    priority = {"experimental": 0, "knowledge_base": 1, "bibliographic": 2, "not_available": 3}
    seen: Dict[str, ExtractedEvidenceItem] = {}
    for item in items:
        key = item.parameter.lower().strip()
        if key not in seen:
            seen[key] = item
        else:
            existing = seen[key]
            if priority.get(item.evidence_type, 99) < priority.get(existing.evidence_type, 99):
                seen[key] = item
    return list(seen.values())


def extract_evidence(
    tissue: str,
    materials: List[Dict[str, Any]],
    final_mixing: Dict[str, Any],
    top_records: List[LiteratureRecord],
) -> ExtractionResult:
    """
    Main entry point: extract experimental evidence using Gemini.

    Returns ExtractionResult with validated evidence items.
    Returns empty ExtractionResult (not an error) if Gemini is unavailable.
    """
    if not is_available():
        return ExtractionResult(
            evidence_items=[],
            papers_processed=0,
            extraction_warnings=["Gemini not configured — using KB-only evidence."],
        )

    if not top_records:
        return ExtractionResult(
            evidence_items=[],
            papers_processed=0,
            extraction_warnings=["No literature records available for extraction."],
        )

    materials_str = ", ".join(
        "{} ({} % w/v)".format(m.get('biomaterial', 'Unknown'), m.get('concentration', '?'))
        for m in materials
    )
    crosslinking = final_mixing.get("crosslinking", "None")
    n_papers = len(top_records)
    papers_block = _build_paper_block(top_records)
    parameter_list = "\n".join(f"  - {p}" for p in TARGET_PARAMETERS)

    user_prompt = EVIDENCE_EXTRACTION_USER_TEMPLATE.format(
        tissue=tissue,
        materials_str=materials_str,
        crosslinking=crosslinking,
        n_papers=n_papers,
        papers_block=papers_block,
        parameter_list=parameter_list,
    )

    full_prompt = EVIDENCE_EXTRACTION_SYSTEM + "\n\n" + user_prompt

    raw_text = generate_text(full_prompt)
    if raw_text is None:
        return ExtractionResult(
            evidence_items=[],
            papers_processed=n_papers,
            extraction_warnings=["Gemini call failed — using KB-only evidence."],
        )

    # Parse JSON response from Gemini
    try:
        # Strip potential markdown fences Gemini sometimes adds despite instructions
        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("\n", 1)[0]
        cleaned = cleaned.strip()

        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.warning("[BioInkAI LLM] Gemini returned invalid JSON: %s", exc)
        return ExtractionResult(
            evidence_items=[],
            papers_processed=n_papers,
            extraction_warnings=[f"Gemini returned invalid JSON — using KB-only evidence."],
        )

    raw_items = parsed.get("evidence_items", [])
    warnings = parsed.get("extraction_warnings", [])

    if not isinstance(raw_items, list):
        return ExtractionResult(
            evidence_items=[],
            papers_processed=n_papers,
            extraction_warnings=["Unexpected Gemini response structure — using KB-only evidence."],
        )

    validated = _validate_items(raw_items)
    deduped = _deduplicate(validated)

    logger.info(
        "[BioInkAI LLM] Extraction complete: %d/%d items validated from %d papers.",
        len(deduped), len(raw_items), n_papers,
    )

    return ExtractionResult(
        evidence_items=deduped,
        papers_processed=n_papers,
        extraction_warnings=warnings if isinstance(warnings, list) else [],
    )
