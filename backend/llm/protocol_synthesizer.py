"""
BioInkAI Protocol Synthesizer
Merges KB evidence + Gemini-extracted evidence into structured protocol steps.

Evidence priority:
  experimental > knowledge_base > bibliographic > not_available

Fabrication rule: never invent values.
If evidence is not_available, the step must say so explicitly.
"""

import logging
from typing import Any, Dict, List, Optional

from llm.evidence_models import ExtractedEvidenceItem, ExtractionResult
from literature.models import LiteratureRecord

logger = logging.getLogger(__name__)


def _format_source_citation(item: ExtractedEvidenceItem) -> str:
    """Build a short citation string from extracted evidence."""
    if item.source_id:
        return f"[{item.source_id}]"
    return "[BioInkAI KB]"


def merge_evidence_with_kb(
    gemini_result: ExtractionResult,
    kb_evidence_items: List[Dict],
    active_materials: Optional[List[str]] = None,
    crosslinker: Optional[str] = None,
) -> List[Dict]:
    """
    Merge Gemini-extracted evidence with Knowledge Base evidence.

    Priority: experimental > knowledge_base > bibliographic > not_available
    KB items remain for parameters not addressed by Gemini.

    Bug 7: Gemini evidence for materials NOT in the active formulation is
    excluded to prevent gelatin/other parameters appearing in alginate-only output.
    """
    priority = {"experimental": 0, "knowledge_base": 1, "bibliographic": 2, "not_available": 3}

    # Normalise active material names for filtering
    active_set = {m.lower().strip() for m in (active_materials or [])}

    # Start with KB evidence
    merged: Dict[str, Dict] = {}
    for kb_item in kb_evidence_items:
        key = str(kb_item.get("parameter", "")).lower().strip()
        merged[key] = kb_item

    # Override/upgrade with Gemini evidence when it has higher priority
    for gem_item in gemini_result.evidence_items:
        key = gem_item.parameter.lower().strip()

        # Bug 7: reject Gemini items that are clearly for non-formulation materials
        if active_set:
            param_lower = key.replace("_", " ")
            # If the parameter name starts with a material name not in our formulation, skip it
            is_foreign = any(
                param_lower.startswith(mat) and mat not in active_set
                for mat in ("gelatin", "collagen", "fibrin", "hyaluronic", "chitosan",
                            "matrigel", "silk", "pcl", "pla", "gelma", "gelnfu")
            )
            if is_foreign:
                logger.debug(
                    "[BioInkAI] Skipping Gemini item '%s' — not in active formulation",
                    gem_item.parameter,
                )
                continue

        existing = merged.get(key)
        gem_priority = priority.get(gem_item.evidence_type, 99)

        if existing is None:
            # New parameter from Gemini
            merged[key] = _gemini_item_to_dict(gem_item)
        else:
            existing_priority = priority.get(existing.get("evidence_type", "not_available"), 99)
            if gem_priority < existing_priority:
                merged[key] = _gemini_item_to_dict(gem_item)

    return list(merged.values())


def _gemini_item_to_dict(item: ExtractedEvidenceItem) -> Dict:
    """Convert a validated Gemini evidence item to the standard dict format."""
    # Determine source location from access context
    source_location = "Literature (Gemini Extracted)"
    if item.source_id:
        if item.evidence_type == "experimental":
            source_location = "Full-text / Gemini AI extraction"
        else:
            source_location = "Abstract / Gemini AI extraction"

    return {
        "parameter": item.parameter,
        "value": item.value,
        "unit": item.unit,
        "evidence_type": item.evidence_type,
        "confidence": item.confidence,
        "evidence_text": item.evidence_text,
        "source_location": source_location,
        # Applicability defaults to True for Gemini items (Gemini is given formulation context)
        # The crosslinker field will be marked False if the value extracted
        # clearly refers to a different crosslinker (validated by caller).
        "applicability": {
            "same_material": True,
            "same_crosslinker": True,
            "same_tissue": True,
            "same_application": True,
        },
        "source": {
            "title": None,
            "doi": item.source_id.replace("DOI:", "") if item.source_id and item.source_id.startswith("DOI:") else None,
            "pmid": item.source_id.replace("PMID:", "") if item.source_id and item.source_id.startswith("PMID:") else None,
            "pmcid": None,
            "database": "Literature (Gemini Extracted)",
        },
        "note": item.evidence_text,
    }


def synthesize_steps_with_evidence(
    base_steps: List[Dict],
    merged_evidence: List[Dict],
    materials: List[Dict],
    final_mixing: Dict,
    crosslinker: str,
) -> List[Dict]:
    """
    Annotate base protocol steps with evidence parameters.
    Steps come from the KB standard_protocol; evidence enriches them.

    Returns steps in the standardized format:
    {step_number, title, instruction, parameters: [], evidence: []}
    """
    # Build a quick lookup: parameter keyword -> evidence item
    ev_lookup: Dict[str, Dict] = {}
    for ev in merged_evidence:
        param_key = ev.get("parameter", "").lower()
        ev_lookup[param_key] = ev

    enriched_steps = []
    for step in base_steps:
        step_number = step.get("step_number", len(enriched_steps) + 1)
        title = step.get("title", "")
        instruction = step.get("instruction", str(step))

        # Find relevant evidence for this step based on keyword matching
        relevant_evidence = []
        step_text_lower = (title + " " + instruction).lower()

        for ev in merged_evidence:
            param = ev.get("parameter", "").lower()
            val = ev.get("value")
            # Match evidence to step if parameter keyword appears in step text
            keywords = param.replace("_", " ").split()
            if any(kw in step_text_lower for kw in keywords):
                relevant_evidence.append(ev)

        enriched_steps.append({
            "step_number": step_number,
            "title": title,
            "instruction": instruction,
            "parameters": relevant_evidence,
            "evidence": relevant_evidence,
            "source": step.get("source"),
        })

    # Add crosslinking step if not already present
    if crosslinker and crosslinker.lower() not in ("none", ""):
        has_crosslink = any("crosslink" in s.get("title", "").lower() or "crosslink" in s.get("instruction", "").lower() for s in enriched_steps)
        if not has_crosslink:
            crosslink_ev = ev_lookup.get("crosslinker_agent") or ev_lookup.get("crosslinker_concentration")
            enriched_steps.append({
                "step_number": len(enriched_steps) + 1,
                "title": "Crosslinking",
                "instruction": f"Apply crosslinking with {crosslinker} post-printing. Refer to the evidence parameters for concentration and duration.",
                "parameters": [crosslink_ev] if crosslink_ev else [],
                "evidence": [crosslink_ev] if crosslink_ev else [],
                "source": None,
            })

    return enriched_steps
