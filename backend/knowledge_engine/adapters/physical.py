"""
===============================================================================
BioInkAI Knowledge Engine - Physical Adapter
===============================================================================

Purpose:
    Extract the complete Physical Properties section from a biomaterial
    while preserving the scientific hierarchy.

Responsibilities:
    ✓ Read Physical Properties
    ✓ Preserve YAML hierarchy
    ✓ Return structured scientific data

Not Responsible For:
    ✗ Prediction
    ✗ Validation
    ✗ Parsing
===============================================================================
"""

from typing import Dict, Any


class PhysicalAdapter:
    """Extracts Physical Properties."""

    @staticmethod
    def extract(material: Dict[str, Any]) -> Dict[str, Any]:

        physical = material.get("Physical Properties", {})

        return {

            "general":
                physical.get("General", {}),

            "molecular_properties":
                physical.get("Molecular Properties", {}),

            "rheological_properties":
                physical.get("Rheological Properties", {}),

            "thermal_properties":
                physical.get("Thermal Properties", {}),

            "solubility":
                physical.get("Solubility", {}),

            "storage":
                physical.get("Storage", {}),

            "sterilization":
                physical.get("Sterilization", {}),

            "scientific_notes":
                physical.get("Scientific Notes", "")
        }


physical_adapter = PhysicalAdapter()