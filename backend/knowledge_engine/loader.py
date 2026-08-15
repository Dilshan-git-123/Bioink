"""
===============================================================================
BioInkAI Knowledge Engine - Loader
===============================================================================

Purpose:
    Central entry point for loading knowledge base objects.

Responsibilities:
    ✓ Load materials
    ✓ Use cache
    ✓ Parse YAML
    ✓ Validate YAML

Not Responsible For:
    ✗ Prediction
    ✗ Optimization
    ✗ Business Logic
===============================================================================
"""

from pathlib import Path
from typing import Any, Dict

from knowledge_engine.cache import cache
from knowledge_engine.parser import YAMLParser
from knowledge_engine.validator import KnowledgeValidator


class KnowledgeLoader:
    """Loads BioInkAI Knowledge Base objects."""

    def __init__(self):
        self.base_path = (
            Path(__file__).resolve().parent.parent.parent
            / "knowledge_base"
        )

    def _parse_yaml_file(self, folder: str, file_name: str) -> Dict[str, Any]:
        """
        Locates and parses a YAML file from a given folder in the Knowledge Base.
        """
        normalized_name = file_name.strip().lower()
        file_path = self.base_path / folder / f"{normalized_name}.yaml"

        if not YAMLParser.file_exists(file_path):
            raise FileNotFoundError(f"Knowledge Base file not found: {file_path}")

        return YAMLParser.parse(file_path)

    def load_material(self, material_name: str) -> Dict[str, Any]:
        """
        Load a material from the Knowledge Base.

        Workflow:
            Cache
                ↓
            Parser
                ↓
            Validator
                ↓
            Cache
                ↓
            Return
        """

        cache_key = f"material:{material_name.strip().lower()}"

        # -----------------------------
        # Step 1 : Cache
        # -----------------------------
        if cache.exists(cache_key):
            return cache.get(cache_key)

        # -----------------------------
        # Step 2 & 3 : Locate & Parse
        # -----------------------------
        material = self._parse_yaml_file("materials", material_name)

        # -----------------------------
        # Step 4 : Validate
        # -----------------------------
        valid, errors = KnowledgeValidator.validate(material)

        if not valid:
            raise ValueError(
                f"Validation failed for '{material_name}':\n"
                + "\n".join(errors)
            )

        # -----------------------------
        # Step 5 : Store in cache
        # -----------------------------
        cache.set(cache_key, material)

        return material

    def get_tissue(self, tissue_name: str) -> Dict[str, Any] | None:
        """
        Load a tissue from the Knowledge Base.

        Workflow:
            Cache Check
                ↓
            Locate & Parse
                ↓
            Map Keys (for FastAPI Route compatibility)
                ↓
            Cache Store
                ↓
            Return
        """
        cache_key = f"tissue:{tissue_name.strip().lower()}"

        # Step 1: Check cache
        if cache.exists(cache_key):
            return cache.get(cache_key)

        # Step 2: Locate & Parse YAML
        try:
            tissue_data = self._parse_yaml_file("tissues", tissue_name)
        except FileNotFoundError:
            return None

        # Step 3: Map keys to match schema expected by FastAPI /main.py endpoint
        mapped_data = dict(tissue_data)
        if "Preferred Biomaterials" in tissue_data:
            mapped_data["recommended_materials"] = tissue_data["Preferred Biomaterials"]
        if "Recommended Temperature" in tissue_data:
            mapped_data["recommended_temperature"] = tissue_data["Recommended Temperature"]
        if "Preferred Crosslinkers" in tissue_data:
            mapped_data["recommended_crosslinking"] = tissue_data["Preferred Crosslinkers"]

        # Step 4: Store in cache
        cache.set(cache_key, mapped_data)

        return mapped_data


# Singleton
loader = KnowledgeLoader()