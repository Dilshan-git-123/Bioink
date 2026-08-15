"""
===============================================================================
BioInkAI Prediction Engine
===============================================================================

File:
    validator.py

Purpose:
    Validate user prediction input before scientific evaluation.

Responsibilities:
    ✓ Check required fields (tissue, materials, finalMixing)
    ✓ Check data types
    ✓ Validate every material entry
    ✓ Validate finalMixing parameters
    ✓ Collect validation errors
    ✓ Return validation result

Not Responsible For:
    ✗ Scientific calculations
    ✗ Prediction logic
    ✗ Loading knowledge profiles
    ✗ Score calculation

Author:
    BioInkAI Team

Version:
    2.0 — updated to validate the current multi-material Designer.jsx payload
===============================================================================
"""

from typing import Dict, Any, List


class PredictionValidator:
    """
    Validates user prediction requests (multi-material format).
    """

    # Required fields per material entry
    MATERIAL_REQUIRED_FIELDS = [
        "biomaterial",
        "concentration",
        "temperature",
        "rpm",
        "time",
        "method",
    ]

    # Required fields in finalMixing
    FINAL_MIXING_REQUIRED_FIELDS = [
        "temperature",
        "rpm",
        "time",
        "crosslinking",
    ]

    def __init__(self):
        pass

    def validate(self, user_input: Dict[str, Any]) -> List[str]:
        """
        Validate user prediction input in the current Designer payload format.

        Expects:
            {
                "tissue": str,
                "materials": [
                    {
                        "biomaterial": str,
                        "concentration": float,
                        "temperature": float,
                        "rpm": float,
                        "time": float,
                        "method": str
                    },
                    ...
                ],
                "finalMixing": {
                    "temperature": float,
                    "rpm": float,
                    "time": float,
                    "crosslinking": str
                }
            }

        Returns:
            Empty list if valid.
            List of error messages otherwise.
        """
        errors: List[str] = []

        # ── 1. Tissue ─────────────────────────────────────────────────────────
        tissue = user_input.get("tissue")
        if not tissue or not str(tissue).strip():
            errors.append("'tissue' is required and must be a non-empty string.")

        # ── 2. Materials list ─────────────────────────────────────────────────
        materials = user_input.get("materials")
        if materials is None:
            errors.append("'materials' is required.")
        elif not isinstance(materials, list):
            errors.append("'materials' must be a list.")
        elif len(materials) == 0:
            errors.append("'materials' must contain at least one entry.")
        else:
            for idx, mat in enumerate(materials):
                label = f"materials[{idx}]"
                if not isinstance(mat, dict):
                    errors.append(f"{label}: must be an object/dictionary.")
                    continue

                # Required fields present
                for field in self.MATERIAL_REQUIRED_FIELDS:
                    if field not in mat:
                        errors.append(f"{label}: missing required field '{field}'.")

                # biomaterial is a non-empty string
                bio = mat.get("biomaterial")
                if bio is not None and (not isinstance(bio, str) or not bio.strip()):
                    errors.append(f"{label}: 'biomaterial' must be a non-empty string.")

                # Numeric fields
                for num_field in ("concentration", "temperature", "rpm", "time"):
                    val = mat.get(num_field)
                    if val is not None and not isinstance(val, (int, float)):
                        errors.append(f"{label}: '{num_field}' must be a number.")

                # method is a non-empty string
                method = mat.get("method")
                if method is not None and (not isinstance(method, str) or not method.strip()):
                    errors.append(f"{label}: 'method' must be a non-empty string.")

        # ── 3. finalMixing ────────────────────────────────────────────────────
        final_mixing = user_input.get("finalMixing")
        if final_mixing is None:
            errors.append("'finalMixing' is required.")
        elif not isinstance(final_mixing, dict):
            errors.append("'finalMixing' must be an object/dictionary.")
        else:
            for field in self.FINAL_MIXING_REQUIRED_FIELDS:
                if field not in final_mixing:
                    errors.append(f"finalMixing: missing required field '{field}'.")

            # Numeric fields
            for num_field in ("temperature", "rpm", "time"):
                val = final_mixing.get(num_field)
                if val is not None and not isinstance(val, (int, float)):
                    errors.append(f"finalMixing: '{num_field}' must be a number.")

            # crosslinking is a non-empty string
            cl = final_mixing.get("crosslinking")
            if cl is not None and (not isinstance(cl, str) or not cl.strip()):
                errors.append("finalMixing: 'crosslinking' must be a non-empty string.")

        return errors