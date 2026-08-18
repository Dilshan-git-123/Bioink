"""
BioInkAI Evidence Extractor

Calls Gemini to extract scientific evidence from supplied literature.

Integrity principles:
- Gemini may only use information present in supplied literature.
- Experimental evidence must contain traceable source information.
- Active formulation materials are authoritative.
- Active crosslinker is authoritative.
- Evidence from unrelated materials/crosslinkers must not be treated as
  evidence for the active formulation.
- Invalid evidence is discarded rather than repaired or guessed.
"""

import json
import logging
import re
from typing import Any, Dict, List

from llm.gemini_client import generate_text, is_available
from llm.evidence_models import ExtractedEvidenceItem, ExtractionResult
from llm.prompts import (
    EVIDENCE_EXTRACTION_SYSTEM,
    EVIDENCE_EXTRACTION_USER_TEMPLATE,
    TARGET_PARAMETERS,
)
from literature.models import LiteratureRecord
from literature.full_text_service import hydrate_records_full_text

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# PAPER BLOCK
# ---------------------------------------------------------------------------

def _build_paper_block(records: List[LiteratureRecord]) -> str:
    """
    Build the literature block supplied to Gemini.

    Full text is preferred over abstract-only evidence.
    Bibliographic metadata is clearly separated from experimental text.
    """

    lines: List[str] = []

    for i, rec in enumerate(records, start=1):

        if rec.pmcid:
            source_id = f"PMCID:{rec.pmcid}"
            if rec.pmid:
                source_id += f" (PMID:{rec.pmid})"
        elif rec.pmid:
            source_id = f"PMID:{rec.pmid}"
        elif rec.doi:
            source_id = f"DOI:{rec.doi}"
        else:
            source_id = f"Paper{i}"

        lines.append(f"--- Paper {i} [{source_id}] ---")

        lines.append(f"Title: {rec.title or 'N/A'}")

        author_str = ", ".join((rec.authors or [])[:3])
        if rec.authors and len(rec.authors) > 3:
            author_str += " et al."

        lines.append(f"Authors: {author_str}")
        lines.append(f"Year: {rec.year or 'N/A'}")
        lines.append(f"Journal: {rec.journal or 'N/A'}")
        lines.append(f"Access Level: {rec.access_level}")

        if rec.abstract and rec.abstract.strip():
            lines.append(
                f"\nAbstract:\n{rec.abstract.strip()}"
            )
        else:
            lines.append(
                "\nAbstract: [Not available]"
            )

        if rec.sections:

            materials = (
                rec.sections.get("materials", "") or ""
            ).strip()

            methods = (
                rec.sections.get("methods", "") or ""
            ).strip()

            experimental = (
                rec.sections.get("experimental", "") or ""
            ).strip()

            results = (
                rec.sections.get("results", "") or ""
            ).strip()

            if materials and methods and materials == methods:

                lines.append(
                    f"\nMaterials and Methods Section:\n{materials}"
                )

            else:

                if materials:
                    lines.append(
                        f"\nMaterials Section:\n{materials}"
                    )

                if methods:
                    lines.append(
                        f"\nMethods Section:\n{methods}"
                    )

            if experimental:
                if (
                    experimental != methods
                    and experimental != materials
                ):
                    lines.append(
                        f"\nExperimental / Preparation Section:\n"
                        f"{experimental}"
                    )

            if results:
                lines.append(
                    f"\nResults Section:\n{results}"
                )

        lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# NORMALIZATION HELPERS
# ---------------------------------------------------------------------------

def _normalize_text(value: Any) -> str:
    """
    Normalize a string for comparison only.

    This does NOT modify the original evidence text/value.
    """

    if value is None:
        return ""

    return re.sub(
        r"[^a-z0-9]+",
        " ",
        str(value).lower(),
    ).strip()


def _material_names(materials: List[Dict[str, Any]]) -> List[str]:
    """
    Return normalized names of active formulation materials.
    """

    names: List[str] = []

    for material in materials:

        name = (
            material.get("biomaterial")
            or material.get("name")
            or material.get("material")
            or ""
        )

        normalized = _normalize_text(name)

        if normalized:
            names.append(normalized)

    return names


def _material_aliases(material_name: str) -> List[str]:
    """
    Common aliases used only for deterministic applicability checking.

    These aliases do not create scientific evidence.
    """

    normalized = _normalize_text(material_name)

    aliases = {
        "alginate": [
            "alginate",
            "sodium alginate",
        ],
        "gelatin": [
            "gelatin",
        ],
        "hyaluronic acid": [
            "hyaluronic acid",
            "hyaluronan",
            "ha",
        ],
        "pectin": [
            "pectin",
        ],
        "pluronic f127": [
            "pluronic f127",
            "poloxamer 407",
            "f127",
        ],
        "collagen": [
            "collagen",
        ],
        "chitosan": [
            "chitosan",
        ],
        "fibrin": [
            "fibrin",
        ],
        "peg": [
            "peg",
            "polyethylene glycol",
        ],
        "agarose": [
            "agarose",
        ],
        "silk fibroin": [
            "silk fibroin",
            "silk",
        ],
    }

    return aliases.get(normalized, [normalized])


def _is_material_parameter(parameter: str) -> bool:
    """
    Parameters that can directly refer to a formulation material.
    """

    normalized = _normalize_text(parameter)

    return any(
        token in normalized
        for token in [
            "concentration",
            "material",
        ]
    )


def _evidence_mentions_active_material(
    evidence: ExtractedEvidenceItem,
    active_materials: List[str],
) -> bool:
    """
    Determine whether evidence can reasonably belong to an active material.

    This is a filtering rule, not scientific inference.
    """

    if not active_materials:
        return True

    parameter = _normalize_text(evidence.parameter)
    evidence_text = _normalize_text(evidence.evidence_text)
    value_text = _normalize_text(evidence.value)

    searchable_text = (
        f"{parameter} {evidence_text} {value_text}"
    )

    # Parameter-specific direct material names.
    for material in active_materials:

        aliases = _material_aliases(material)

        for alias in aliases:

            alias_normalized = _normalize_text(alias)

            if alias_normalized and alias_normalized in searchable_text:
                return True

    # General process parameters such as nozzle diameter, printing speed,
    # temperature, RPM, etc. can legitimately apply to the formulation
    # without explicitly repeating the material name.
    general_parameters = [
        "preparation temperature",
        "mixing rpm",
        "mixing duration",
        "crosslinking duration",
        "crosslinking temperature",
        "ph value",
        "nozzle diameter",
        "extrusion pressure",
        "printing speed",
        "layer height",
        "uv wavelength",
        "uv exposure time",
        "sterilization method",
        "storage conditions",
        "cell concentration",
        "photoinitiator",
        "photoinitiator concentration",
    ]

    if any(
        token in parameter
        for token in general_parameters
    ):
        return True

    return False


# ---------------------------------------------------------------------------
# CROSSLINKER VALIDATION
# ---------------------------------------------------------------------------

def _crosslinker_family(value: str) -> str:
    """
    Classify a crosslinker into a broad deterministic family.

    This is ONLY used to prevent contradictory evidence from overriding
    the active formulation.
    """

    text = _normalize_text(value)

    if not text:
        return "unknown"

    calcium_terms = [
        "cacl2",
        "calcium chloride",
        "calcium ion",
        "calcium ions",
    ]

    if any(term in text for term in calcium_terms):
        return "calcium_ionic"

    if any(
        term in text
        for term in [
            "schiff",
            "aldehyde",
            "glutaraldehyde",
            "alg cho",
            "aldehyde crosslink",
        ]
    ):
        return "aldehyde_amine"

    if "genipin" in text:
        return "genipin"

    if any(
        term in text
        for term in [
            "photocrosslink",
            "photopolymer",
            "uv crosslink",
            "photoinitiator",
        ]
    ):
        return "photo"

    return "other"


def _crosslinker_evidence_matches(
    evidence: ExtractedEvidenceItem,
    active_crosslinker: str,
) -> bool:
    """
    Return True only when crosslinker evidence is compatible with the
    active formulation crosslinker.

    A contradictory crosslinker is not deleted from the literature by this
    helper; it is marked as non-applicable and excluded from operational use.
    """

    if not active_crosslinker:
        return True

    parameter = _normalize_text(evidence.parameter)

    if "crosslink" not in parameter:
        return True

    active_family = _crosslinker_family(active_crosslinker)

    evidence_text = (
        f"{evidence.value or ''} "
        f"{evidence.evidence_text or ''}"
    )

    evidence_family = _crosslinker_family(evidence_text)

    if evidence_family == "unknown":
        return True

    if active_family == evidence_family:
        return True

    return False


# ---------------------------------------------------------------------------
# GEMINI ITEM VALIDATION
# ---------------------------------------------------------------------------

def _validate_items(
    raw_items: List[Dict[str, Any]],
    materials: List[Dict[str, Any]],
    active_crosslinker: str,
) -> List[ExtractedEvidenceItem]:

    valid: List[ExtractedEvidenceItem] = []

    active_materials = _material_names(materials)

    for raw_item in raw_items:

        if not isinstance(raw_item, dict):
            logger.warning(
                "[BioInkAI LLM] Discarding non-object evidence item."
            )
            continue

        try:

            evidence = ExtractedEvidenceItem(**raw_item)

            # --------------------------------------------------------------
            # Experimental integrity
            # --------------------------------------------------------------

            if evidence.evidence_type == "experimental":

                if not evidence.value:
                    logger.warning(
                        "[BioInkAI LLM] Discarding experimental item "
                        "with null/empty value: %s",
                        evidence.parameter,
                    )
                    continue

                if not evidence.unit and any(
                    char.isdigit()
                    for char in evidence.value
                ):
                    logger.info(
                        "[BioInkAI LLM] Experimental value has no unit: %s",
                        evidence.parameter,
                    )

                if not evidence.evidence_text:
                    logger.warning(
                        "[BioInkAI LLM] Discarding experimental item "
                        "without evidence_text: %s",
                        evidence.parameter,
                    )
                    continue

                if not evidence.source_id:
                    logger.warning(
                        "[BioInkAI LLM] Discarding experimental item "
                        "without source_id: %s",
                        evidence.parameter,
                    )
                    continue

                if not evidence.source_location:
                    logger.warning(
                        "[BioInkAI LLM] Discarding experimental item "
                        "without source_location: %s",
                        evidence.parameter,
                    )
                    continue

            # --------------------------------------------------------------
            # Material applicability
            # --------------------------------------------------------------

            if not _evidence_mentions_active_material(
                evidence,
                active_materials,
            ):

                logger.info(
                    "[BioInkAI LLM] Discarding evidence for "
                    "inactive material: %s",
                    evidence.parameter,
                )

                continue

            # --------------------------------------------------------------
            # Crosslinker applicability
            # --------------------------------------------------------------

            if not _crosslinker_evidence_matches(
                evidence,
                active_crosslinker,
            ):

                logger.info(
                    "[BioInkAI LLM] Discarding incompatible "
                    "crosslinker evidence: %s = %s",
                    evidence.parameter,
                    evidence.value,
                )

                continue

            valid.append(evidence)

        except Exception as exc:

            logger.warning(
                "[BioInkAI LLM] Validation failed for item: "
                "%s — %s",
                raw_item.get("parameter", "?"),
                exc,
            )

    return valid


# ---------------------------------------------------------------------------
# DEDUPLICATION
# ---------------------------------------------------------------------------

def _deduplicate(
    items: List[ExtractedEvidenceItem],
) -> List[ExtractedEvidenceItem]:
    """
    Remove exact duplicate evidence records.

    IMPORTANT:
    Different papers reporting the same parameter are NOT duplicates.

    Therefore the source_id is part of the deduplication key.
    """

    seen = set()
    result: List[ExtractedEvidenceItem] = []

    for item in items:

        key = (
            item.parameter.lower().strip(),
            (item.source_id or "").lower().strip(),
            (item.value or "").lower().strip(),
            (item.unit or "").lower().strip(),
        )

        if key in seen:
            continue

        seen.add(key)
        result.append(item)

    return result


# ---------------------------------------------------------------------------
# MAIN EXTRACTION FUNCTION
# ---------------------------------------------------------------------------

def extract_evidence(
    tissue: str,
    materials: List[Dict[str, Any]],
    final_mixing: Dict[str, Any],
    top_records: List[LiteratureRecord],
) -> ExtractionResult:

    """
    Main Gemini evidence extraction entry point.
    """

    if not is_available():

        return ExtractionResult(
            evidence_items=[],
            papers_processed=0,
            extraction_warnings=[
                "Gemini not configured — using KB-only evidence."
            ],
        )

    if not top_records:

        return ExtractionResult(
            evidence_items=[],
            papers_processed=0,
            extraction_warnings=[
                "No literature records available for extraction."
            ],
        )

    # --------------------------------------------------------------
    # Hydrate full text
    # --------------------------------------------------------------

    try:

        top_records = hydrate_records_full_text(
            top_records,
            max_full_text=5,
        )

    except Exception as exc:

        logger.warning(
            "[BioInkAI LLM] Full-text hydration failed: %s",
            exc,
        )

    # --------------------------------------------------------------
    # Formulation context
    # --------------------------------------------------------------

    materials_str = ", ".join(
        "{} ({} % w/v)".format(
            m.get("biomaterial")
            or m.get("name")
            or "Unknown",
            m.get("concentration", "?"),
        )
        for m in materials
    )

    active_crosslinker = (
        final_mixing.get("crosslinking")
        or final_mixing.get("crosslinker")
        or ""
    )

    n_papers = len(top_records)

    papers_block = _build_paper_block(top_records)

    parameter_list = "\n".join(
        f"  - {parameter}"
        for parameter in TARGET_PARAMETERS
    )

    # --------------------------------------------------------------
    # Gemini prompt
    # --------------------------------------------------------------

    user_prompt = EVIDENCE_EXTRACTION_USER_TEMPLATE.format(
        tissue=tissue,
        materials_str=materials_str,
        crosslinking=active_crosslinker or "None",
        n_papers=n_papers,
        papers_block=papers_block,
        parameter_list=parameter_list,
    )

    full_prompt = (
        EVIDENCE_EXTRACTION_SYSTEM
        + "\n\n"
        + user_prompt
    )

    # --------------------------------------------------------------
    # Gemini call
    # --------------------------------------------------------------

    raw_text = generate_text(full_prompt)

    if raw_text is None:

        return ExtractionResult(
            evidence_items=[],
            papers_processed=n_papers,
            extraction_warnings=[
                "Gemini call failed — using KB-only evidence."
            ],
        )

    # --------------------------------------------------------------
    # Parse JSON
    # --------------------------------------------------------------

    try:

        cleaned = raw_text.strip()

        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1]

        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("\n", 1)[0]

        cleaned = cleaned.strip()

        parsed = json.loads(cleaned)

    except json.JSONDecodeError as exc:

        logger.warning(
            "[BioInkAI LLM] Gemini returned invalid JSON: %s",
            exc,
        )

        return ExtractionResult(
            evidence_items=[],
            papers_processed=n_papers,
            extraction_warnings=[
                "Gemini returned invalid JSON — using KB-only evidence."
            ],
        )

    # --------------------------------------------------------------
    # Validate response structure
    # --------------------------------------------------------------

    raw_items = parsed.get("evidence_items", [])

    warnings = parsed.get(
        "extraction_warnings",
        [],
    )

    if not isinstance(raw_items, list):

        return ExtractionResult(
            evidence_items=[],
            papers_processed=n_papers,
            extraction_warnings=[
                "Unexpected Gemini response structure — "
                "using KB-only evidence."
            ],
        )

    # --------------------------------------------------------------
    # Validate and filter
    # --------------------------------------------------------------

    validated = _validate_items(
        raw_items,
        materials,
        active_crosslinker,
    )

    deduped = _deduplicate(validated)

    logger.info(
        "[BioInkAI LLM] Extraction complete: "
        "%d/%d raw items accepted from %d papers.",
        len(deduped),
        len(raw_items),
        n_papers,
    )

    return ExtractionResult(
        evidence_items=deduped,
        papers_processed=n_papers,
        extraction_warnings=(
            warnings if isinstance(warnings, list) else []
        ),
    )
