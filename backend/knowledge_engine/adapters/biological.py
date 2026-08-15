"""
===============================================================================
BioInkAI Knowledge Engine - Biological Adapter
===============================================================================
"""

from typing import Dict, Any


class BiologicalAdapter:
    """Extract Biological Properties."""

    @staticmethod
    def extract(material: Dict[str, Any]) -> Dict[str, Any]:

        biological = material.get("Biological Properties", {})

        return {

            "biocompatibility":
                biological.get("Biocompatibility", {}),

            "cell_interaction":
                biological.get("Cell Interaction", {}),

            "biodegradation":
                biological.get("Biodegradation", {}),

            "immunological_response":
                biological.get("Immunological Response", {}),

            "bioactivity":
                biological.get("Bioactivity", {}),

            "scientific_notes":
                biological.get("Scientific Notes", "")
        }


biological_adapter = BiologicalAdapter()
