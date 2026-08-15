"""
===============================================================================
BioInkAI Knowledge Engine - Material Adapter
===============================================================================

Purpose:
    Converts Knowledge Base material YAML files into the profile format
    expected by the Prediction Engine.

Responsibilities:
    ✓ Load material from Knowledge Engine
    ✓ Extract required scientific parameters
    ✓ Return a predictor-compatible profile

Not Responsible For:
    ✗ Prediction
    ✗ Validation
    ✗ Parsing
===============================================================================
"""

import re
from typing import Dict, Any, Tuple

from knowledge_engine.loader import loader
from knowledge_engine.adapters import (
    MaterialInfoAdapter,
    PhysicalAdapter,
)
from knowledge_engine.profile_builder import ProfileBuilder


class MaterialAdapter:
    """Converts Knowledge Base materials into Predictor profiles."""

    @staticmethod
    def _extract_range(value: str):
        """
        Extract numerical ranges from strings.

        Example:
            "2-8% w/v" -> (2.0, 8.0)
            "20-37°C" -> (20.0, 37.0)
        """

        if not value:
            return None

        numbers = re.findall(r"\d+(?:\.\d+)?", str(value))

        if len(numbers) >= 2:
            return (float(numbers[0]), float(numbers[1]))

        return None

    @classmethod
    def get_profile(cls, material_name: str) -> Dict[str, Any]:
        """
        Return a Predictor-compatible material profile.
        """

        material = loader.load_material(material_name)

        return ProfileBuilder.build(material)


# Singleton
material_adapter = MaterialAdapter()