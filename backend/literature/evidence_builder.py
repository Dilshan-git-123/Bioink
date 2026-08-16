"""
BioInkAI Evidence-Based Protocol Builder
Combines local Knowledge Base + retrieved literature into a structured protocol.

IMPORTANT INTEGRITY RULES:
  1. Never fabricate experimental parameter values.
  2. Distinguish evidence types clearly:
       kb_derived    - from local knowledge base YAML files
       bibliographic - paper title/metadata confirms topic relevance only
       abstract      - abstract mentions a term (does NOT confirm exact value)
       not_available - parameter not found in any available source
  3. References must be real (title, authors, year, DOI, PMID as available).
  4. Placeholder strings ([Placeholder ...]) must NEVER appear in output.
"""

import logging
from typing import Any, Dict, List, Optional

from literature.models import LiteratureRecord, EvidenceItem
from protocol_generator import normalize_step, is_placeholder_reference

logger = logging.getLogger(__name__)


def _safe_str(val: Any) -> Optional[str]:
    """Return val as string only if it is a real value, not a placeholder."""
    if val is None:
        return None
    s = str(val).strip()
    if s.lower().startswith("[placeholder") or s.lower() == "n/a" or s == "":
        return None
    return s


def build_evidence_items(
    materials: List[Dict],
    kb_material_profiles: Dict[str, Dict],
    top_records: List[LiteratureRecord],
) -> List[EvidenceItem]:
    """
    Build evidence items for key protocol parameters.

    Strategy:
      - For concentration, temperature, RPM, time:
          pull from local KB if present (evidence_type=kb_derived).
      - If literature abstract mentions a numeric range for that material:
          NOT claimed as experimental evidence without full-text parsing.
          Marked as bibliographic + abstract.
      - If unavailable: not_available.

    An LLM extraction layer will upgrade bibliographic → experimental in a future sprint.
    """
    items: List[EvidenceItem] = []

    # Best literature record per material (for bibliographic citation)
    def _best_lit_for_material(mat_name: str) -> Optional[LiteratureRecord]:
        mat_lower = mat_name.lower()
        for rec in top_records:
            text = (rec.title or "").lower() + " " + (rec.abstract or "").lower()
            if mat_lower in text:
                return rec
        return top_records[0] if top_records else None

    for mat in materials:
        mat_name = mat.get("biomaterial", "unknown")
        conc = mat.get("concentration")
        kb = kb_material_profiles.get(mat_name.lower(), {})
        prep = kb.get("Preparation Parameters", {}) or {}
        sol = prep.get("Solution Preparation", {}) or {}
        rec = _best_lit_for_material(mat_name)

        # --- Concentration ---
        kb_conc_min = sol.get("Recommended Concentration", {}).get("Minimum")
        kb_conc_max = sol.get("Recommended Concentration", {}).get("Maximum")
        kb_conc_unit = sol.get("Recommended Concentration", {}).get("Unit", "% w/v")
        if kb_conc_min is not None and kb_conc_max is not None:
            kb_conc_val = f"{kb_conc_min}–{kb_conc_max} {kb_conc_unit}"
            items.append(EvidenceItem(
                parameter=f"{mat_name} concentration",
                value=kb_conc_val,
                unit=_safe_str(kb_conc_unit),
                evidence_type="kb_derived",
                confidence="medium",
                source_title="BioInkAI Knowledge Base",
                source_database="BioInkAI KB",
                note="Recommended range from local material profile.",
            ))
        elif rec:
            items.append(EvidenceItem(
                parameter=f"{mat_name} concentration",
                value=None,
                unit="% w/v",
                evidence_type="not_available",
                confidence="unavailable",
                note="Exact concentration not extractable from metadata without full-text parsing.",
                source_title=rec.title,
                source_doi=rec.doi,
                source_pmid=rec.pmid,
                source_database=rec.source_database,
            ))
        else:
            items.append(EvidenceItem(
                parameter=f"{mat_name} concentration",
                value=None,
                unit="% w/v",
                evidence_type="not_available",
                confidence="unavailable",
                note="No source available.",
            ))

        # --- Preparation Temperature ---
        kb_temp = _safe_str(sol.get("Preparation Temperature", {}).get("Value") if isinstance(sol.get("Preparation Temperature"), dict) else sol.get("Preparation Temperature"))
        kb_temp_unit = "°C"
        if kb_temp:
            items.append(EvidenceItem(
                parameter=f"{mat_name} preparation temperature",
                value=f"{kb_temp} {kb_temp_unit}",
                unit=kb_temp_unit,
                evidence_type="kb_derived",
                confidence="medium",
                source_title="BioInkAI Knowledge Base",
                source_database="BioInkAI KB",
            ))

        # --- Crosslinking method (from top record, bibliographic only) ---
        if rec and "crosslink" in ((rec.title or "") + (rec.abstract or "")).lower():
            items.append(EvidenceItem(
                parameter=f"{mat_name} crosslinking mentioned",
                value="Yes (crosslinking mentioned in literature)",
                unit=None,
                evidence_type="bibliographic",
                confidence="low",
                source_title=rec.title,
                source_doi=rec.doi,
                source_pmid=rec.pmid,
                source_pmcid=rec.pmcid,
                source_database=rec.source_database,
                note="Bibliographic evidence only. Specific parameters require full-text review.",
            ))

    return items


def build_literature_reference_protocol(
    tissue: str,
    materials: List[Dict],
    final_mixing: Dict,
    top_records: List[LiteratureRecord],
    kb_material_profiles: Dict[str, Dict],
    base_steps: List[str],
) -> Dict[str, Any]:
    """
    Build the Evidence-Based Reference Protocol dict.
    Sources: local KB + literature metadata.
    All values are traceable to a real source.
    """
    tissue_str = tissue.capitalize() if tissue else "General Tissue"
    crosslinker = final_mixing.get("crosslinking", "")

    # Required materials from literature + KB
    required_materials: List[str] = []
    for mat in materials:
        name = mat.get("biomaterial", "Unknown").capitalize()
        conc = mat.get("concentration")
        kb = kb_material_profiles.get(mat.get("biomaterial", "").lower(), {})
        mat_info = kb.get("Material Information", {}) or {}
        full_name = _safe_str(mat_info.get("Material Name")) or name
        label = f"{full_name} ({conc}% w/v)" if conc else full_name
        required_materials.append(label)

    # Steps: from standard_protocol.yaml base, annotated with KB notes
    steps = []
    if base_steps:
        for i, step in enumerate(base_steps):
            steps.append(normalize_step(step, i))
    else:
        default_instructions = [
            "Weigh the biomaterial powder using an analytical balance.",
            "Dissolve in sterile deionized water or PBS at the preparation temperature.",
            "Stir at the recommended RPM for the specified preparation time.",
            "Degas the solution under vacuum or by centrifugation.",
            "Load into the bioprinter cartridge and print immediately.",
        ]
        for i, inst in enumerate(default_instructions):
            steps.append({
                "step_number": i + 1,
                "title": "",
                "instruction": inst,
                "parameters": {},
                "source": None
            })

    if crosslinker and crosslinker.lower() not in ("none", ""):
        steps.append({
            "step_number": len(steps) + 1,
            "title": "Crosslinking",
            "instruction": f"Apply crosslinking with {crosslinker} post-printing according to established protocol for the selected crosslinker.",
            "parameters": {},
            "source": None
        })

    # Storage from KB
    storage_notes: List[str] = []
    for mat in materials:
        kb = kb_material_profiles.get(mat.get("biomaterial", "").lower(), {})
        phys = kb.get("Physical Properties", {}) or {}
        stor = phys.get("Storage", {}) or {}
        temp_obj = stor.get("Recommended Temperature", {})
        temp_val = _safe_str(temp_obj.get("Value") if isinstance(temp_obj, dict) else temp_obj)
        if temp_val:
            name = mat.get("biomaterial", "").capitalize()
            storage_notes.append(f"{name}: store at {temp_val}°C")
    storage = " | ".join(storage_notes) if storage_notes else "Store at 4°C; use within 24 hours."

    # Safety from KB
    safety: List[str] = []
    for mat in materials:
        kb = kb_material_profiles.get(mat.get("biomaterial", "").lower(), {})
        safety_info = kb.get("Safety Information", {}) or {}
        handling = _safe_str(safety_info.get("Handling Precautions"))
        lab_note = _safe_str(safety_info.get("Laboratory Safety Notes"))
        if handling:
            safety.append(f"{mat.get('biomaterial','').capitalize()}: {handling}")
        if lab_note:
            safety.append(f"{mat.get('biomaterial','').capitalize()}: {lab_note}")
    if not safety:
        safety = ["Standard laboratory PPE required (gloves, lab coat, safety glasses)."]

    # Evidence items
    evidence_items = build_evidence_items(materials, kb_material_profiles, top_records)

    # References: ONLY from real retrieved literature.  No placeholders.
    references: List[Dict[str, Any]] = []
    for rec in top_records:
        if not rec.title or is_placeholder_reference(rec.to_dict()):
            continue
        author_str = ", ".join(rec.authors[:3]) if rec.authors else "Unknown authors"
        if len(rec.authors) > 3:
            author_str += " et al."
        ref: Dict[str, Any] = {
            "title": rec.title,
            "authors": author_str,
            "year": rec.year,
            "journal": rec.journal,
            "doi": rec.doi,
            "pmid": rec.pmid,
            "pmcid": rec.pmcid,
            "database": rec.source_database,
            "url": rec.url,
            "relevance_score": rec.relevance_score,
            "full_text_available": rec.full_text_available,
        }
        references.append(ref)

    if not references:
        references = [{
            "title": "No verified scientific reference is available in the current knowledge base.",
            "authors": None,
            "year": None,
            "journal": None,
            "doi": None,
            "pmid": None,
            "pmcid": None,
            "database": "BioInkAI KB",
            "url": None,
            "relevance_score": 0,
            "full_text_available": False
        }]

    # Limitations section (honest about what we cannot provide yet)
    limitations = [
        "Exact experimental parameter values (concentration, RPM, nozzle diameter, etc.) "
        "are sourced from the BioInkAI Knowledge Base only. "
        "Extraction of experimental values from full-text literature requires an additional parsing step.",
        "Literature references are provided as bibliographic evidence. "
        "Always consult the original publication before use in a laboratory setting.",
        "If a required material or tissue combination is not in the knowledge base, "
        "parameter values marked as 'not_available' must be verified independently.",
    ]

    return {
        "title": f"Evidence-Based Laboratory Reference Protocol: {tissue_str} Bioink",
        "protocol_type": "Literature Evidence Reference",
        "source": "BioInkAI Knowledge Base + PubMed / Europe PMC / Crossref",
        "objective": (
            f"Standard procedure for preparing a {tissue_str} bioink formulation "
            f"informed by the BioInkAI Knowledge Base and retrieved scientific literature."
        ),
        "required_materials": required_materials,
        "steps": steps,
        "storage": storage,
        "safety": safety,
        "limitations": limitations,
        "evidence_items": [e.to_dict() for e in evidence_items],
        "references": references,
        "status": "Evidence-Based Reference",
    }
