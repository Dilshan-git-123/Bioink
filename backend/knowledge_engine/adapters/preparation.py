"""
===============================================================================
BioInkAI Knowledge Engine - Preparation Adapter
===============================================================================

Purpose:
    Extract the complete Preparation Parameters section from a biomaterial
    while preserving the scientific hierarchy.

Responsibilities:
    ✓ Read Preparation Parameters
    ✓ Preserve YAML hierarchy
    ✓ Return structured scientific data

Not Responsible For:
    ✗ Prediction
    ✗ Validation
    ✗ Parsing
===============================================================================
"""

from typing import Dict, Any


class PreparationAdapter:
    """Extracts Preparation Parameters."""

    @staticmethod
    def extract(material: Dict[str, Any]) -> Dict[str, Any]:

        preparation = material.get("Preparation Parameters", {})

        return {

            "solution_preparation":
                preparation.get("Solution Preparation", {}),

            "mixing":
                preparation.get("Mixing", {}),

            "filtration":
                preparation.get("Filtration", {}),

            "degassing":
                preparation.get("Degassing", {}),

            "storage_before_printing":
                preparation.get("Storage Before Printing", {}),

            "scientific_notes":
                preparation.get("Scientific Notes", "")
        }


preparation_adapter = PreparationAdapter()
