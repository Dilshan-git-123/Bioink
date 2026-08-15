"""
===============================================================================
BioInkAI Knowledge Engine - Profile Builder
===============================================================================

Purpose:
    Assemble standardized BioInkAI material profiles from adapter outputs.

Responsibilities:
    ✓ Combine adapter outputs
    ✓ Produce one unified material profile

Not Responsible For:
    ✗ Prediction
    ✗ Validation
    ✗ Parsing
    ✗ Scientific calculations
===============================================================================
"""

from typing import Dict, Any

from knowledge_engine.adapters import (
    MaterialInfoAdapter,
    PhysicalAdapter,
    ChemicalAdapter,
    PreparationAdapter,
    PrintingAdapter,
    CrosslinkingAdapter,
    BiologicalAdapter,
    MechanicalAdapter,
)


class ProfileBuilder:
    """Builds a standardized material profile."""

    @staticmethod
    def build(material: Dict[str, Any]) -> Dict[str, Any]:

        profile = {

            "material":
                MaterialInfoAdapter.extract(material),

            "physical":
                PhysicalAdapter.extract(material),

            "chemical":
                ChemicalAdapter.extract(material),

            "preparation":
                PreparationAdapter.extract(material),

            "printing":
                PrintingAdapter.extract(material),

            "crosslinking":
                CrosslinkingAdapter.extract(material),

            "biological":
                BiologicalAdapter.extract(material),
            "mechanical":
                MechanicalAdapter.extract(material),
        }

        return profile
