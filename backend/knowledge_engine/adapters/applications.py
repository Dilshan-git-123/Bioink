"""
===============================================================================
BioInkAI Knowledge Engine - Applications Adapter
===============================================================================

Purpose:
    Extract Tissue Engineering Applications from a biomaterial while
    preserving the scientific hierarchy.
===============================================================================
"""

from typing import Dict, Any


class ApplicationsAdapter:
    """Extract Tissue Engineering Applications."""

    @staticmethod
    def extract(material: Dict[str, Any]) -> Dict[str, Any]:

        applications = material.get("Tissue Engineering Applications", {})

        return {

            "supported_tissues":
                applications.get("Supported Tissues", {}),

            "specialized_applications":
                applications.get("Specialized Applications", {}),

            "scientific_notes":
                applications.get("Scientific Notes", "")
        }


applications_adapter = ApplicationsAdapter()
