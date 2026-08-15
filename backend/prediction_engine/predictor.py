"""
===============================================================================
BioInkAI Prediction Engine

Main Prediction Controller — v2.0 (multi-material)
===============================================================================

Changes from v1.0:
    - PredictionContextBuilder now handles multiple materials.
    - build_context() accepts the new Designer payload structure:
        { tissue, materials[], finalMixing{} }
    - _build_materials_map() replaces _extract_material_parameters()
      and maps ALL supplied biomaterials, not just the first one.
    - Total concentration = sum of all material concentrations.
    - Max temperature = max across all material temperatures + finalMixing temp.
    - Mixing parameters come exclusively from finalMixing{}.
    - Crosslinking is normalised from finalMixing.crosslinking.
    - PredictionEngine.predict() loads the profile of the PRIMARY material
      (first in list) for rule-engine evaluation, while all materials
      contribute to the scientific calculations.
===============================================================================
"""

from typing import Dict, Any, List


# ─── Known biomaterials (used for materials_map initialisation) ────────────────
_KNOWN_MATERIALS = [
    "alginate",
    "gelatin",
    "pectin",
    "pluronic",
    "collagen",
    "gelma",
]


class PredictionContextBuilder:
    """
    Helper class responsible for parsing, extracting, and preparing scientific
    parameters and contexts for PredictionEngine calculations.

    Supports the current multi-material Designer payload.
    """

    # ── Public API ─────────────────────────────────────────────────────────────

    @staticmethod
    def build_context(user_input: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build and extract the full prediction context from user input and profile.

        user_input must have:
            tissue      : str
            materials   : list of { biomaterial, concentration, temperature, rpm, time, method }
            finalMixing : { temperature, rpm, time, crosslinking }
        """
        materials_list: List[Dict[str, Any]] = user_input.get("materials", [])
        final_mixing_raw: Dict[str, Any] = user_input.get("finalMixing", {})

        # Crosslinking flags — derived from finalMixing.crosslinking
        crosslinking = PredictionContextBuilder._extract_crosslinking_parameters(final_mixing_raw)

        # Multi-material map: { "alginate": 3.0, "gelatin": 5.0, ... }
        materials_map = PredictionContextBuilder._build_materials_map(materials_list)

        # Final mixing parameters (RPM, time, temperature) from finalMixing{}
        mixing = PredictionContextBuilder._extract_mixing_parameters(final_mixing_raw)

        # Total polymer concentration across all materials
        total_conc = sum(
            float(m.get("concentration", 0.0)) for m in materials_list
        )

        # Max temperature: maximum across all material prep temperatures AND finalMixing temp
        mat_temps = [float(m.get("temperature", 0.0)) for m in materials_list]
        max_temp = max(mat_temps + [mixing["temperature"]])

        # Use primary material's preparation temperature for rule-engine evaluation
        primary_temp = float(materials_list[0].get("temperature", 25.0)) if materials_list else 25.0

        # Penalties calculated from primary material profile (concentration + temp)
        penalties = PredictionContextBuilder._calculate_penalty_inputs(
            total_conc, primary_temp, mixing, profile
        )

        return {
            # Primary material info (for rule engine / profile lookups)
            "material_name": materials_list[0].get("biomaterial", "") if materials_list else "",
            # Aggregated values for scientific calculations
            "concentration": total_conc,
            "temperature": primary_temp,
            "crosslinking": crosslinking,
            "materials_map": materials_map,
            "materials_list": materials_list,
            "mixing": mixing,
            "max_temp": max_temp,
            "penalties": penalties,
        }

    # ── Private helpers ────────────────────────────────────────────────────────

    @staticmethod
    def _extract_crosslinking_parameters(final_mixing: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract crosslinking boolean flags and normalised method string
        from finalMixing.crosslinking.

        Normalises:
            "CaCl₂" / "CaCl2" / "calcium chloride"  → is_cacl2 = True
            "UV" / "uv" / "photo" / "light"          → is_uv   = True
            "thermal"                                → is_thermal = True
            "enzymatic" / "tg" / "transglutaminase"  → is_enzymatic = True
            "chemical" / "glutaraldehyde" / "genipin" → is_chemical = True
        """
        raw = str(final_mixing.get("crosslinking", ""))
        # Unicode subscript normalisation (₂→2, ₃→3)
        method = (
            raw
            .replace("₂", "2")
            .replace("₃", "3")
            .replace("₄", "4")
            .lower()
            .strip()
        )
        return {
            "method": method,
            "is_cacl2": any(x in method for x in ["cacl2", "calcium"]),
            "is_uv": any(x in method for x in ["uv", "light", "photo"]),
            "is_thermal": "thermal" in method,
            "is_enzymatic": any(x in method for x in ["enzymatic", "tg", "transglutaminase"]),
            "is_chemical": any(x in method for x in ["chemical", "glutaraldehyde", "genipin"]),
        }

    @staticmethod
    def _build_materials_map(materials_list: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Build a concentration map from ALL supplied materials.

        Example input:
            [
                {"biomaterial": "alginate",  "concentration": 3},
                {"biomaterial": "gelatin",   "concentration": 5},
                {"biomaterial": "pectin",    "concentration": 1},
            ]

        Returns:
            {
                "alginate": 3.0,
                "gelatin":  5.0,
                "pectin":   1.0,
                "pluronic": 0.0,
                "collagen": 0.0,
                "gelma":    0.0,
            }

        Unknown biomaterials are still accumulated in an "_other" bucket
        so they contribute to total_conc but don't break the map.
        """
        mat_map: Dict[str, float] = {k: 0.0 for k in _KNOWN_MATERIALS}
        for mat in materials_list:
            bio = str(mat.get("biomaterial", "")).lower().strip()
            conc = float(mat.get("concentration", 0.0))
            if bio in mat_map:
                mat_map[bio] += conc
            # unknown materials just contribute to total_conc (summed externally)
        return mat_map

    @staticmethod
    def _extract_mixing_parameters(final_mixing: Dict[str, Any]) -> Dict[str, float]:
        """
        Extract mixing RPM, time, and temperature from finalMixing.

        Uses the ACTUAL values supplied — never falls back to 0 if the
        user has provided a value.
        """
        return {
            "rpm": float(final_mixing.get("rpm", 100.0)),
            "time": float(final_mixing.get("time", 5.0)),
            "temperature": float(final_mixing.get("temperature", 25.0)),
        }

    @staticmethod
    def _calculate_penalty_inputs(
        concentration: float,
        temperature: float,
        mixing: Dict[str, float],
        profile: Dict[str, Any],
    ) -> Dict[str, float]:
        """
        Calculate per-material parameter deviation penalties based on the
        primary material's knowledge-base profile.
        """
        total_penalty_cv = 0.0
        total_penalty_pr = 0.0
        total_penalty_mech = 0.0

        # Concentration penalty
        try:
            sol_prep = profile.get("preparation", {}).get("solution_preparation", {})
            conc_range = sol_prep.get("Recommended Concentration", {})
            if conc_range:
                lo = float(conc_range.get("Minimum", 0.0))
                hi = float(conc_range.get("Maximum", 0.0))
                if concentration > 0:
                    span = hi - lo if hi != lo else 1.0
                    if concentration < lo:
                        dev = (lo - concentration) / span
                        total_penalty_pr += min(10.0, dev * 10.0)
                        total_penalty_mech += min(8.0, dev * 8.0)
                    elif concentration > hi:
                        dev = (concentration - hi) / span
                        total_penalty_cv += min(15.0, dev * 12.0)
                        total_penalty_pr += min(10.0, dev * 8.0)
                        total_penalty_mech += min(5.0, dev * 4.0)
        except Exception:
            pass

        # Temperature penalty
        try:
            sol_prep = profile.get("preparation", {}).get("solution_preparation", {})
            temp_range_val = sol_prep.get("Preparation Temperature", {})
            if temp_range_val and "Value" in temp_range_val:
                val = str(temp_range_val["Value"])
                if "-" in val:
                    parts = val.split("-")
                    lo = float(parts[0])
                    hi = float(parts[1])
                elif "–" in val:
                    parts = val.split("–")
                    lo = float(parts[0])
                    hi = float(parts[1])
                else:
                    lo = float(val)
                    hi = float(val)
                span = hi - lo if hi != lo else 1.0
                if temperature < lo:
                    dev = (lo - temperature) / span
                    total_penalty_pr += min(8.0, dev * 8.0)
                elif temperature > hi:
                    dev = (temperature - hi) / span
                    total_penalty_cv += min(20.0, dev * 15.0)
                    total_penalty_mech += min(5.0, dev * 4.0)
        except Exception:
            pass

        # RPM penalty
        try:
            mixing_section = profile.get("preparation", {}).get("mixing", {})
            rpm_range = mixing_section.get("Mixing Speed", {})
            if rpm_range:
                lo = float(rpm_range.get("Minimum", 0.0))
                hi = float(rpm_range.get("Maximum", 0.0))
                span = hi - lo if hi != lo else 1.0
                rpm = mixing["rpm"]
                if rpm < lo:
                    dev = (lo - rpm) / span
                    total_penalty_pr += min(8.0, dev * 8.0)
                elif rpm > hi:
                    dev = (rpm - hi) / span
                    total_penalty_cv += min(15.0, dev * 10.0)
                    total_penalty_pr += min(8.0, dev * 6.0)
        except Exception:
            pass

        # Mixing time penalty
        try:
            mixing_section = profile.get("preparation", {}).get("mixing", {})
            time_range = mixing_section.get("Mixing Time", {})
            if time_range:
                lo = float(time_range.get("Minimum", 0.0))
                hi = float(time_range.get("Maximum", 0.0))
                span = hi - lo if hi != lo else 1.0
                mtime = mixing["time"]
                if mtime < lo:
                    dev = (lo - mtime) / span
                    total_penalty_pr += min(6.0, dev * 6.0)
                elif mtime > hi:
                    dev = (mtime - hi) / span
                    total_penalty_cv += min(10.0, dev * 8.0)
                    total_penalty_pr += min(8.0, dev * 6.0)
                    total_penalty_mech += min(5.0, dev * 4.0)
        except Exception:
            pass

        return {
            "total_penalty_cv": total_penalty_cv,
            "total_penalty_pr": total_penalty_pr,
            "total_penalty_mech": total_penalty_mech,
        }


class PredictionEngine:
    """
    Main orchestration engine for BioInkAI.

    Accepts the current multi-material Designer payload and runs:
        1. PredictionValidator
        2. Knowledge-base profile loading (primary material)
        3. PredictionContextBuilder
        4. RuleEngine
        5. ScientificCalculator
        6. ScoringEngine
        7. OutputModel
    """

    def __init__(
        self,
        validator=None,
        rule_engine=None,
        calculator=None,
        scoring_engine=None,
        output_model=None,
    ):
        from prediction_engine.validator import PredictionValidator
        from prediction_engine.rule_engine import RuleEngine
        from prediction_engine.calculators import ScientificCalculator
        from prediction_engine.scoring import ScoringEngine
        from prediction_engine.output_model import OutputModel
        from knowledge_engine.loader import loader

        self.validator = validator or PredictionValidator()
        self.loader = loader
        self.rule_engine = rule_engine or RuleEngine()
        self.calculator = calculator or ScientificCalculator()
        self.scoring_engine = scoring_engine or ScoringEngine()
        self.output_model = output_model or OutputModel()

    def predict(self, user_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute complete BioInkAI prediction pipeline for the current
        multi-material Designer payload.

        user_input structure:
        {
            "tissue": str,
            "materials": [
                {
                    "biomaterial": str,
                    "concentration": float,
                    "temperature": float,
                    "rpm": float,
                    "time": float,
                    "method": str,
                },
                ...
            ],
            "finalMixing": {
                "temperature": float,
                "rpm": float,
                "time": float,
                "crosslinking": str,
            }
        }
        """
        # ── STEP 1: Validate user input ───────────────────────────────────────
        errors = self.validator.validate(user_input)
        if errors:
            return {"success": False, "errors": errors}

        materials_list: List[Dict[str, Any]] = user_input["materials"]
        final_mixing_raw: Dict[str, Any] = user_input["finalMixing"]

        # ── STEP 2: Load primary material profile ─────────────────────────────
        # The primary material is the first in the list; it drives the
        # rule-engine evaluation (concentration ranges, temperature ranges, etc.)
        primary_material_name: str = str(materials_list[0].get("biomaterial", "")).lower().strip()

        try:
            raw_material = self.loader.load_material(primary_material_name)
        except Exception:
            raise FileNotFoundError(
                f"Material profile not found for '{primary_material_name}'. "
                "Check that it exists in the knowledge base."
            )

        # ── STEP 3: Build standardised material profile ───────────────────────
        from knowledge_engine.profile_builder import ProfileBuilder
        profile = ProfileBuilder.build(raw_material)

        # ── STEP 4: Prepare prediction context ────────────────────────────────
        ctx = PredictionContextBuilder.build_context(user_input, profile)

        # Normalised user_input dict for RuleEngine (uses legacy key names for
        # backward compat with existing rule evaluation methods)
        rule_input = {
            # Primary material concentration (total polymer conc)
            "concentration": ctx["concentration"],
            # Primary material prep temperature
            "temperature": ctx["temperature"],
            # Final mixing parameters
            "mixing_rpm": ctx["mixing"]["rpm"],
            "mixing_time": ctx["mixing"]["time"],
            "final_mixing_temperature": ctx["mixing"]["temperature"],
            # Crosslinking from finalMixing (already normalised)
            "crosslinking": ctx["crosslinking"]["method"],
        }

        # ── STEP 5: Execute Rule Engine ───────────────────────────────────────
        rule_results = self.rule_engine.evaluate(profile, rule_input)

        # ── STEP 6: Execute Scientific Calculator ─────────────────────────────
        cell_viability = self.calculator.calculate_cell_viability(
            max_temp=ctx["max_temp"],
            final_rpm=ctx["mixing"]["rpm"],
            final_time=ctx["mixing"]["time"],
            total_conc=ctx["concentration"],
            is_chemical=ctx["crosslinking"]["is_chemical"],
            is_uv=ctx["crosslinking"]["is_uv"],
            total_penalty_cv=ctx["penalties"]["total_penalty_cv"],
        )

        printability_score = self.calculator.calculate_printability(
            total_conc=ctx["concentration"],
            alginate=ctx["materials_map"]["alginate"],
            gelma=ctx["materials_map"]["gelma"],
            final_mixing_temp=ctx["mixing"]["temperature"],
            final_rpm=ctx["mixing"]["rpm"],
            final_time=ctx["mixing"]["time"],
            total_penalty_pr=ctx["penalties"]["total_penalty_pr"],
        )

        mechanical_strength = self.calculator.calculate_mechanical_strength(
            alginate=ctx["materials_map"]["alginate"],
            gelma=ctx["materials_map"]["gelma"],
            collagen=ctx["materials_map"]["collagen"],
            total_penalty_mech=ctx["penalties"]["total_penalty_mech"],
            gelatin=ctx["materials_map"]["gelatin"],
            pectin=ctx["materials_map"]["pectin"],
        )

        crosslinking_efficiency = self.calculator.calculate_crosslinking_efficiency(
            is_cacl2=ctx["crosslinking"]["is_cacl2"],
            is_uv=ctx["crosslinking"]["is_uv"],
            is_enzymatic=ctx["crosslinking"]["is_enzymatic"],
            is_chemical=ctx["crosslinking"]["is_chemical"],
        )

        degradation_rate = self.calculator.calculate_degradation_rate(
            total_conc=ctx["concentration"],
        )

        clogging_risk = self.calculator.calculate_clogging_risk(
            final_rpm=ctx["mixing"]["rpm"],
            final_mixing_temp=ctx["mixing"]["temperature"],
        )

        estimated_cost = self.calculator.calculate_estimated_cost(
            alginate=ctx["materials_map"]["alginate"],
            gelatin=ctx["materials_map"]["gelatin"],
            pectin=ctx["materials_map"]["pectin"],
            pluronic=ctx["materials_map"]["pluronic"],
            collagen=ctx["materials_map"]["collagen"],
            gelma=ctx["materials_map"]["gelma"],
        )

        calculation_results = {
            "cell_viability": cell_viability,
            "printability_score": printability_score,
            "mechanical_strength": mechanical_strength,
            "crosslinking_efficiency": crosslinking_efficiency,
            "degradation_rate": degradation_rate,
            "clogging_risk": clogging_risk,
            "estimated_cost": estimated_cost,
            "total_conc": ctx["concentration"],
            "max_temp": ctx["max_temp"],
            # Full materials list preserved for OutputModel warnings/recommendations
            "materials": ctx["materials_list"],
            "final_mixing": {
                "rpm": ctx["mixing"]["rpm"],
                "time": ctx["mixing"]["time"],
                "temperature": ctx["mixing"]["temperature"],
                "crosslinking": ctx["crosslinking"]["method"],
            },
        }

        # ── STEP 7: Execute Scoring Engine ────────────────────────────────────
        scores = self.scoring_engine.calculate(rule_results)

        if cell_viability < 60 or printability_score < 40:
            scores["overall_recommendation"] = "Needs optimisation"
        elif cell_viability >= 85 and printability_score >= 80:
            scores["overall_recommendation"] = "Highly recommended"
        else:
            scores["overall_recommendation"] = "Acceptable"

        # ── STEP 8: Execute Output Model ──────────────────────────────────────
        prediction = self.output_model.build_prediction(
            rule_results=rule_results,
            scores=scores,
            calculation_results=calculation_results,
        )

        # ── STEP 9: Return final prediction ───────────────────────────────────
        return prediction