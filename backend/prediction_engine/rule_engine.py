"""
===============================================================================
BioInkAI Prediction Engine

Rule Engine v2.0
===============================================================================
"""

from typing import Dict, Any


class RuleEngine:
    """
    Applies scientific rules to a material profile.
    """

    def __init__(self):
        """
        Initialize Rule Engine.
        """
        pass

    def evaluate(
        self,
        profile: Dict[str, Any],
        user_input: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate scientific rules.

        Returns:
            Dictionary containing rule evaluation results.
        """
        results = {}

        results["concentration"] = self.evaluate_concentration(profile, user_input)
        results["temperature"] = self.evaluate_temperature(profile, user_input)
        results["mixing_speed"] = self.evaluate_mixing_speed(profile, user_input)
        results["mixing_time"] = self.evaluate_mixing_time(profile, user_input)
        results["crosslinking"] = self.evaluate_crosslinking(profile, user_input)
        results["material_profile"] = self.evaluate_material_profile(profile)

        return results

    def evaluate_concentration(
        self,
        profile: Dict[str, Any],
        user_input: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate concentration rule.
        """
        concentration = user_input.get("concentration")
        if concentration is None:
            return {
                "status": "PASS",
                "score": 100,
                "message": "Concentration is not provided."
            }

        try:
            recommended = profile["preparation"]["solution_preparation"]["Recommended Concentration"]
            minimum = recommended["Minimum"]
            maximum = recommended["Maximum"]
        except Exception:
            # Fallback to materials_db
            try:
                from materials_db import MATERIALS_DB
                mat_name = profile.get("material", {}).get("material_info", {}).get("Material Name", "").lower().strip()
                db_profile = MATERIALS_DB.get(mat_name, {})
                conc_range = db_profile.get("recommended_concentration_range", [1.0, 6.0])
                minimum, maximum = conc_range[0], conc_range[1]
            except Exception:
                minimum, maximum = 1.0, 6.0

        if minimum <= concentration <= maximum:
            return {
                "status": "PASS",
                "score": 100,
                "message": "Concentration is within the recommended range."
            }
        else:
            return {
                "status": "FAIL",
                "score": 20,
                "message": "Concentration is outside the recommended range."
            }

    def evaluate_temperature(
        self,
        profile: Dict[str, Any],
        user_input: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate preparation temperature rule.
        """
        temperature = user_input.get("temperature")
        if temperature is None:
            return {
                "status": "PASS",
                "score": 100,
                "message": "Preparation temperature is not provided."
            }

        try:
            sol_prep = profile.get("preparation", {}).get("solution_preparation", {})
            temp_val = sol_prep.get("Preparation Temperature", {})
            if "Minimum" in temp_val and "Maximum" in temp_val:
                minimum = float(temp_val["Minimum"])
                maximum = float(temp_val["Maximum"])
            elif "Value" in temp_val:
                val = str(temp_val["Value"])
                if "-" in val:
                    parts = val.split("-")
                    minimum = float(parts[0])
                    maximum = float(parts[1])
                elif "–" in val:
                    parts = val.split("–")
                    minimum = float(parts[0])
                    maximum = float(parts[1])
                else:
                    minimum = float(val)
                    maximum = float(val)
            else:
                raise ValueError()
        except Exception:
            try:
                from materials_db import MATERIALS_DB
                mat_name = profile.get("material", {}).get("material_info", {}).get("Material Name", "").lower().strip()
                db_profile = MATERIALS_DB.get(mat_name, {})
                temp_range = db_profile.get("preparation_temperature_range", [20.0, 37.0])
                minimum, maximum = temp_range[0], temp_range[1]
            except Exception:
                minimum, maximum = 20.0, 37.0

        if minimum <= temperature <= maximum:
            return {
                "status": "PASS",
                "score": 100,
                "message": "Preparation temperature is within the recommended range."
            }
        elif temperature > maximum:
            return {
                "status": "WARNING",
                "score": 75,
                "message": "Temperature exceeds the recommended preparation range."
            }
        else:
            return {
                "status": "FAIL",
                "score": 20,
                "message": "Temperature is below the recommended preparation range."
            }

    def evaluate_mixing_speed(
        self,
        profile: Dict[str, Any],
        user_input: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate mixing speed rule.
        """
        rpm = user_input.get("mixing_rpm", user_input.get("rpm"))
        if rpm is None:
            return {
                "status": "PASS",
                "score": 100,
                "message": "Mixing speed is not provided."
            }

        try:
            mixing = profile.get("preparation", {}).get("mixing", {})
            speed = mixing.get("Mixing Speed", {})
            if "Minimum" in speed and "Maximum" in speed:
                minimum = float(speed["Minimum"])
                maximum = float(speed["Maximum"])
            elif "Value" in speed:
                val = str(speed["Value"])
                if "-" in val:
                    parts = val.split("-")
                    minimum = float(parts[0])
                    maximum = float(parts[1])
                else:
                    minimum = float(val)
                    maximum = float(val)
            else:
                raise ValueError()
        except Exception:
            try:
                from materials_db import MATERIALS_DB
                mat_name = profile.get("material", {}).get("material_info", {}).get("Material Name", "").lower().strip()
                db_profile = MATERIALS_DB.get(mat_name, {})
                rpm_range = db_profile.get("recommended_mixing_rpm", [100, 400])
                minimum, maximum = rpm_range[0], rpm_range[1]
            except Exception:
                minimum, maximum = 100, 400

        if minimum <= rpm <= maximum:
            return {
                "status": "PASS",
                "score": 100,
                "message": "Mixing speed is within the recommended range."
            }
        elif rpm > maximum:
            return {
                "status": "WARNING",
                "score": 75,
                "message": "Mixing speed exceeds the recommended range."
            }
        else:
            return {
                "status": "FAIL",
                "score": 20,
                "message": "Mixing speed is below the recommended range."
            }

    def evaluate_mixing_time(
        self,
        profile: Dict[str, Any],
        user_input: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate mixing time rule.
        """
        mtime = user_input.get("mixing_time", user_input.get("time"))
        if mtime is None:
            return {
                "status": "PASS",
                "score": 100,
                "message": "Mixing time is not provided."
            }

        try:
            mixing = profile.get("preparation", {}).get("mixing", {})
            time_val = mixing.get("Mixing Time", {})
            if "Minimum" in time_val and "Maximum" in time_val:
                minimum = float(time_val["Minimum"])
                maximum = float(time_val["Maximum"])
            elif "Value" in time_val:
                val = str(time_val["Value"])
                if "-" in val:
                    parts = val.split("-")
                    minimum = float(parts[0])
                    maximum = float(parts[1])
                else:
                    minimum = float(val)
                    maximum = float(val)
            else:
                raise ValueError()
        except Exception:
            try:
                from materials_db import MATERIALS_DB
                mat_name = profile.get("material", {}).get("material_info", {}).get("Material Name", "").lower().strip()
                db_profile = MATERIALS_DB.get(mat_name, {})
                time_range = db_profile.get("recommended_mixing_time", [5, 20])
                minimum, maximum = time_range[0], time_range[1]
            except Exception:
                minimum, maximum = 5, 20

        if minimum <= mtime <= maximum:
            return {
                "status": "PASS",
                "score": 100,
                "message": "Mixing time is within the recommended range."
            }
        elif mtime > maximum:
            return {
                "status": "WARNING",
                "score": 75,
                "message": "Mixing time exceeds the recommended range."
            }
        else:
            return {
                "status": "FAIL",
                "score": 20,
                "message": "Mixing time is below the recommended range."
            }

    def evaluate_crosslinking(
        self,
        profile: Dict[str, Any],
        user_input: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate crosslinking compatibility rule.
        """
        selected = user_input.get("crosslinking_method", user_input.get("crosslinking"))
        if selected is None:
            return {
                "status": "PASS",
                "score": 100,
                "message": "Crosslinking method is not provided."
            }

        selected_str = str(selected).lower().strip()

        compatibles = []
        try:
            from materials_db import MATERIALS_DB
            mat_name = profile.get("material", {}).get("material_info", {}).get("Material Name", "").lower().strip()
            db_profile = MATERIALS_DB.get(mat_name, {})
            compatibles = [x.lower().strip() for x in db_profile.get("compatible_crosslinking_methods", [])]
        except Exception:
            pass

        try:
            rec_cross = profile.get("printing", {}).get("post_printing", {}).get("Recommended Crosslinker", {}).get("Value", "")
            if rec_cross:
                compatibles.append(rec_cross.lower().strip())
        except Exception:
            pass

        try:
            prim_cross = profile.get("crosslinking", {}).get("primary_crosslinker", {}).get("Name", {}).get("Value", "")
            if prim_cross:
                compatibles.append(prim_cross.lower().strip())
        except Exception:
            pass

        def normalize(text):
            return str(text).lower().replace("₂", "2").replace("₃", "3").replace("₄", "4").replace(" ", "").strip()

        selected_norm = normalize(selected_str)
        is_compatible = False
        for c in compatibles:
            c_norm = normalize(c)
            if selected_norm == c_norm or selected_norm in c_norm or c_norm in selected_norm:
                is_compatible = True
                break

        if is_compatible:
            return {
                "status": "PASS",
                "score": 100,
                "message": "Selected crosslinker is compatible."
            }
        else:
            return {
                "status": "FAIL",
                "score": 20,
                "message": "Selected crosslinker is not compatible."
            }

    def evaluate_material_profile(
        self,
        profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Verify the material profile contains all required scientific sections.
        """
        required = [
            "physical",
            "chemical",
            "preparation",
            "printing",
            "crosslinking",
            "biological",
            "mechanical",
        ]
        missing = []
        for section in required:
            if not profile.get(section):
                missing.append(section.capitalize())

        if missing:
            return {
                "status": "FAIL",
                "score": 20,
                "message": f"Material profile is incomplete. Missing: {', '.join(missing)}."
            }
        else:
            return {
                "status": "PASS",
                "score": 100,
                "message": "Material profile contains all required scientific sections."
            }