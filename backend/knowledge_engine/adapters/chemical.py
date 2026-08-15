"""
===============================================================================
BioInkAI Knowledge Engine - Chemical Adapter
===============================================================================

Purpose:
    Extract the complete Chemical Properties section from a biomaterial
    while preserving the scientific hierarchy.

Responsibilities:
    ✓ Read Chemical Properties
    ✓ Preserve YAML hierarchy
    ✓ Return structured scientific data

Not Responsible For:
    ✗ Prediction
    ✗ Validation
    ✗ Parsing
===============================================================================
"""

from typing import Dict, Any


class ChemicalAdapter:
    """Extracts Chemical Properties."""

    @staticmethod
    def extract(material: Dict[str, Any]) -> Dict[str, Any]:

        chemical = material.get("Chemical Properties", {})

        return {

            "general":
                chemical.get("General", {}),

            "functional_groups":
                chemical.get("Functional Groups", {}),

            "acid_base_properties":
                chemical.get("Acid Base Properties", {}),

            "hydration":
                chemical.get("Hydration", {}),

            "stability":
                chemical.get("Stability", {}),

            "crosslinking_behavior":
                chemical.get("Crosslinking Behavior", {}),

            "scientific_notes":
                chemical.get("Scientific Notes", "")
        }


chemical_adapter = ChemicalAdapter()
