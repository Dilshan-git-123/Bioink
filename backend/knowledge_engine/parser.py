"""
===============================================================================
BioInkAI Knowledge Engine - YAML Parser
===============================================================================

Purpose:
    Reads YAML knowledge base files and converts them into Python dictionaries.

Responsibilities:
    ✓ Check if a file exists
    ✓ Read YAML safely
    ✓ Return parsed data

Not Responsible For:
    ✗ Validation
    ✗ Caching
    ✗ Prediction
    ✗ Business Logic

===============================================================================
"""

from pathlib import Path
from typing import Any, Dict
import yaml


class YAMLParser:
    """Handles reading and parsing YAML files."""

    @staticmethod
    def file_exists(file_path: str | Path) -> bool:
        """
        Check whether the given file exists.

        Args:
            file_path: Path to the YAML file.

        Returns:
            True if the file exists, otherwise False.
        """
        return Path(file_path).is_file()

    @staticmethod
    def load_yaml(file_path: str | Path) -> Dict[str, Any]:
        """
        Load a YAML file safely.

        Args:
            file_path: Path to the YAML file.

        Returns:
            Parsed YAML as a Python dictionary.

        Raises:
            FileNotFoundError:
                If the YAML file does not exist.

            yaml.YAMLError:
                If the YAML format is invalid.
        """

        file_path = Path(file_path)

        if not file_path.is_file():
            raise FileNotFoundError(
                f"Knowledge base file not found: {file_path}"
            )

        with file_path.open("r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        return data or {}

    @staticmethod
    def parse(file_path: str | Path) -> Dict[str, Any]:
        """
        Parse a YAML file.

        This is the public function used by the rest of the
        Knowledge Engine.

        Args:
            file_path: YAML file path.

        Returns:
            Parsed dictionary.
        """
        return YAMLParser.load_yaml(file_path)