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


def _is_crosslinker_applicable(extracted_value: str, active_crosslinker: str, evidence_text: str) -> bool:
    """Determine if extracted crosslinker evidence is compatible with the active formulation."""
    if not active_crosslinker or not active_crosslinker.strip():
        return True

    active_lower = active_crosslinker.lower().strip()
    ext_val_lower = str(extracted_value).lower()
    ev_text_lower = str(evidence_text).lower()

    if active_lower in ("cacl2", "calcium chloride"):
        incompatible_terms = [
            "schiff's base", "schiff base", "amine-aldehyde",
            "primary amine + aldehyde", "primary amine and aldehyde",
            "ha-nh2", "alg-cho", "aldehyde crosslinking",
            "glutaraldehyde", "genipin"
        ]
        
        for term in incompatible_terms:
            if term in ext_val_lower or term in ev_text_lower:
                return False

    return True


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

        is_crosslink_param = "crosslink" in key
        applicable = True
        if is_crosslink_param and crosslinker:
            applicable = _is_crosslinker_applicable(gem_item.value, crosslinker, gem_item.evidence_text)

        gem_dict = _gemini_item_to_dict(gem_item)
        if not applicable:
            gem_dict["applicability"]["same_crosslinker"] = False
            # Do NOT let it replace a CaCl2-related KB/evidence item
            gem_priority = 999

        if existing is None:
            # New parameter from Gemini
            merged[key] = gem_dict
        else:
            existing_priority = priority.get(existing.get("evidence_type", "not_available"), 99)
            if gem_priority < existing_priority:
                merged[key] = gem_dict

    return list(merged.values())


def _gemini_item_to_dict(item: ExtractedEvidenceItem) -> Dict:
    """Convert a validated Gemini evidence item to the standard dict format."""
    # Determine source location from extracted item or access context
    if item.source_location and item.source_location.strip():
        loc = item.source_location.strip()
        if "gemini" not in loc.lower():
            source_location = f"{loc} (Full-text / Gemini AI extraction)" if item.evidence_type == "experimental" else f"{loc} (Gemini AI extraction)"
        else:
            source_location = loc
    elif item.source_id:
        if item.evidence_type == "experimental":
            source_location = "Full-text / Gemini AI extraction"
        else:
            source_location = "Abstract / Gemini AI extraction"
    else:
        source_location = "Literature (Gemini Extracted)"

    doi = None
    pmid = None
    pmcid = None
    if item.source_id:
        sid = item.source_id.strip()
        if sid.startswith("DOI:"):
            doi = sid.replace("DOI:", "").strip()
        elif sid.startswith("PMID:"):
            pmid = sid.replace("PMID:", "").strip()
        elif sid.startswith("PMCID:"):
            pmcid_part = sid.replace("PMCID:", "").strip()
            if "(" in pmcid_part:
                pmcid = pmcid_part.split("(")[0].strip()
                if "PMID:" in pmcid_part:
                    pmid = pmcid_part.split("PMID:")[1].rstrip(")").strip()
            else:
                pmcid = pmcid_part
        elif sid.startswith("PMC"):
            pmcid = sid

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
            "doi": doi,
            "pmid": pmid,
            "pmcid": pmcid,
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
            
            # Do not use incompatible crosslinker evidence in the generated laboratory procedure.
            if crosslink_ev and not crosslink_ev.get("applicability", {}).get("same_crosslinker", True):
                crosslink_ev = None

            enriched_steps.append({
                "step_number": len(enriched_steps) + 1,
                "title": "Crosslinking",
                "instruction": f"Apply crosslinking with {crosslinker} post-printing. Refer to the evidence parameters for concentration and duration.",
                "parameters": [crosslink_ev] if crosslink_ev else [],
                "evidence": [crosslink_ev] if crosslink_ev else [],
                "source": None,
            })

    return enriched_steps
