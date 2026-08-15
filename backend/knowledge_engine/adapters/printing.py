"""
===============================================================================
BioInkAI Knowledge Engine - Printing Adapter
===============================================================================

Purpose:
    Extract the complete Printing Properties section from a biomaterial
    while preserving the scientific hierarchy.

Responsibilities:
    ✓ Read Printing Properties
    ✓ Preserve YAML hierarchy
    ✓ Return structured scientific data

Not Responsible For:
    ✗ Prediction
    ✗ Validation
    ✗ Parsing
===============================================================================
"""

from typing import Dict, Any


class PrintingAdapter:
    """Extracts Printing Properties."""

    @staticmethod
    def extract(material: Dict[str, Any]) -> Dict[str, Any]:

        printing = material.get("Printing Properties", {})

        return {

            "extrusion":
                printing.get("Extrusion", {}),

            "printability":
                printing.get("Printability", {}),

            "post_printing":
                printing.get("Post Printing", {}),

            "printing_compatibility":
                printing.get("Printing Compatibility", {}),

            "scientific_notes":
                printing.get("Scientific Notes", "")
        }


printing_adapter = PrintingAdapter()
