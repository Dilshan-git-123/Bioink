"""
===============================================================================
BioInkAI Knowledge Engine - Mechanical Adapter
===============================================================================

Purpose:
    Extract the complete Mechanical Properties section from a biomaterial.
===============================================================================
"""

from typing import Dict, Any


class MechanicalAdapter:
    """Extract Mechanical Properties."""

    @staticmethod
    def extract(material: Dict[str, Any]) -> Dict[str, Any]:
        """Extract the Mechanical Properties hierarchy from a material dict.

        Args:
            material: The full biomaterial dictionary loaded from YAML.

        Returns:
            A dictionary containing the nested Mechanical Properties sections,
            preserving the original hierarchy without flattening.
        """
        mechanical = material.get("Mechanical Properties", {})
        return {
            "elastic_properties": mechanical.get("Elastic Properties", {}),
            "strength": mechanical.get("Strength", {}),
            "rheology": mechanical.get("Rheology", {}),
            "stability": mechanical.get("Stability", {}),
            "scientific_notes": mechanical.get("Scientific Notes", ""),
        }


mechanical_adapter = MechanicalAdapter()
