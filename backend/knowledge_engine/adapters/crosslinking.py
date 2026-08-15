"""
===============================================================================
BioInkAI Knowledge Engine - Crosslinking Adapter
===============================================================================

Purpose:
    Extract the complete Crosslinking Information section from a biomaterial
    while preserving the scientific hierarchy.

Responsibilities:
    ✓ Read Crosslinking Information
    ✓ Preserve YAML hierarchy
    ✓ Return structured scientific data

Not Responsible For:
    ✗ Prediction
    ✗ Validation
    ✗ Parsing
===============================================================================
"""

from typing import Dict, Any


class CrosslinkingAdapter:
    """Extracts Crosslinking Information."""

    @staticmethod
    def extract(material: Dict[str, Any]) -> Dict[str, Any]:
        """Extract the Crosslinking Information section from the material.

        Args:
            material: A dictionary representing the biomaterial data.

        Returns:
            A dictionary containing the crosslinking related subsections.
        """
        crosslinking = material.get("Crosslinking Information", {})

        return {
            "crosslinking_capability": crosslinking.get("Crosslinking Capability", {}),
            "primary_crosslinker": crosslinking.get("Primary Crosslinker", {}),
            "crosslinking_conditions": crosslinking.get("Crosslinking Conditions", {}),
            "gelation": crosslinking.get("Gelation", {}),
            "mechanical_effect": crosslinking.get("Mechanical Effect", {}),
            "scientific_notes": crosslinking.get("Scientific Notes", ""),
        }


crosslinking_adapter = CrosslinkingAdapter()
