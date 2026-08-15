"""
===============================================================================
BioInkAI Knowledge Engine - Material Information Adapter
===============================================================================

Purpose:
    Extracts the "Material Information" section from a Knowledge Base material
    and converts it into a standardized format used throughout BioInkAI.
===============================================================================
"""

from typing import Dict, Any


class MaterialInfoAdapter:
    """Extracts material information."""

    @staticmethod
    def extract(material: Dict[str, Any]) -> Dict[str, Any]:

        info = material.get("Material Information", {})

        return {
            "material_name": info.get("Material Name"),
            "scientific_name": info.get("Scientific Name"),
            "common_names": info.get("Common Names", []),
            "description": info.get("Description"),
            "source": info.get("Source"),
            "material_type": info.get("Material Type"),
            "polymer_class": info.get("Polymer Class"),
            "origin": info.get("Origin"),
            "grade": info.get("Grade"),
            "cas_number": info.get("CAS Number"),
            "chemical_formula": info.get("Chemical Formula"),
            "fda_status": info.get("FDA Status"),
            "printable": info.get("Printable"),
            "bioink_role": info.get("Bioink Role"),
            "commercial_availability": info.get("Commercial Availability"),
            "typical_suppliers": info.get("Typical Suppliers", [])
        }