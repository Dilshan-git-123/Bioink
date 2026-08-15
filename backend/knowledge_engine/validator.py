"""
===============================================================================
BioInkAI Knowledge Engine - Validator
===============================================================================

Purpose:
    Validates Knowledge Base YAML files before they are used by BioInkAI.

Responsibilities:
    ✓ Check required sections
    ✓ Report missing sections

Not Responsible For:
    ✗ Reading YAML files
    ✗ Caching
    ✗ Prediction
===============================================================================
"""

from typing import Any, Dict, List


class KnowledgeValidator:
    """Validates BioInkAI Knowledge Base files."""

    REQUIRED_SECTIONS = [
        "Knowledge Base Metadata",
        "Material Information",
        "Physical Properties",
        "Chemical Properties",
        "Safety Information",
        "Preparation Parameters",
        "Printing Properties",
        "Crosslinking Information",
        "Biological Properties",
        "Mechanical Properties",
        "Tissue Engineering Applications",
        "Compatibility",
        "Advantages",
        "Limitations",
        "AI Prediction Parameters",
        "Optimization Guidelines",
        "Scientific References",
    ]

    @classmethod
    def validate(cls, data: Dict[str, Any]) -> tuple[bool, List[str]]:
        """
        Validate a parsed knowledge file.

        Returns:
            (is_valid, list_of_errors)
        """

        errors = []

        for section in cls.REQUIRED_SECTIONS:
            if section not in data:
                errors.append(f"Missing section: {section}")

        return len(errors) == 0, errors