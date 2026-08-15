"""
===============================================================================
BioInkAI Prediction Engine

Output Model
===============================================================================
"""

from typing import Dict, Any, List


class OutputModel:
    """
    Responsible for formatting BioInkAI prediction output.
    """

    def __init__(self):
        """
        Initialize Output Model.
        """
        pass

    def build_prediction(
        self,
        rule_results: Dict[str, Any],
        scores: Dict[str, Any],
        calculation_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Build complete prediction response.
        """
        prediction_metrics = {
            "printability_score": calculation_results.get("printability_score", scores.get("printability_score", 50.0)),
            "cell_viability": calculation_results.get("cell_viability", 95.0),
            "mechanical_strength": calculation_results.get("mechanical_strength", 0.0),
            "degradation_rate": calculation_results.get("degradation_rate", 0.0),
            "crosslinking_efficiency": calculation_results.get("crosslinking_efficiency", 60.0),
            "clogging_risk": calculation_results.get("clogging_risk", 0.0),
            "estimated_cost": calculation_results.get("estimated_cost", 0.0),
            "overall_recommendation": calculation_results.get("overall_recommendation", scores.get("overall_recommendation", "Acceptable")),
        }

        # If rule results or other calculations are available, construct warnings, recommendations, risks, explanations
        warnings = self.generate_warnings(calculation_results)
        recommendations = self.generate_recommendations(calculation_results)
        scientific_explanations = self.generate_scientific_explanations(calculation_results)
        risks = self.generate_risks(calculation_results)

        # Merge overall summary into prediction metrics or final object
        prediction_metrics["summary"] = self.generate_summary(scores)

        return {
            "success": True,
            "prediction": prediction_metrics,
            "scores": scores,
            "warnings": warnings,
            "recommendations": recommendations,
            "scientific_explanations": scientific_explanations,
            "risks": risks
        }

    def generate_warnings(
        self,
        calculation_results: Dict[str, Any]
    ) -> List[str]:
        """
        Generate formulation warnings.
        """
        warnings = []

        cell_viability = calculation_results.get("cell_viability", 95.0)
        printability = calculation_results.get("printability_score", calculation_results.get("printability", 50.0))
        total_conc = calculation_results.get("total_conc", 0.0)
        crosslinking_efficiency = calculation_results.get("crosslinking_efficiency", 60.0)

        # Concentration warnings
        if total_conc > 15.0:
            warnings.append("High total polymer concentration restricts nutrient diffusion.")

        materials = calculation_results.get("materials", [])
        for mat in materials:
            conc = mat.get("concentration", 0.0)
            bio = str(mat.get("biomaterial", "")).capitalize()
            if conc > 10.0:
                warnings.append(f"High concentration of {bio} may reduce cell viability.")

        # Temperature warnings
        max_temp = calculation_results.get("max_temp", 25.0)
        if max_temp > 40.0:
            warnings.append("Processing temperature exceeds physiological limit (40 °C).")
        elif max_temp < 10.0:
            warnings.append("Low temperature may cause cold shock to cells.")

        # Printability and viscosity warnings
        if printability < 40:
            warnings.append("Low printability score predicted.")
        if total_conc > 12.0:
            warnings.append("High formulation viscosity may increase extrusion pressure requirements.")

        # Cell viability warning
        if cell_viability < 70:
            warnings.append("Poor cell viability predicted.")

        # Crosslinking efficiency warning
        if crosslinking_efficiency < 70:
            warnings.append("Low crosslinking efficiency may cause formulation instability.")

        return warnings

    def generate_recommendations(
        self,
        calculation_results: Dict[str, Any]
    ) -> List[str]:
        """
        Generate scientific recommendations.
        """
        recommendations = []

        cell_viability = calculation_results.get("cell_viability", 95.0)
        printability = calculation_results.get("printability_score", calculation_results.get("printability", 50.0))
        clogging_risk = calculation_results.get("clogging_risk", 0.0)
        crosslinking_efficiency = calculation_results.get("crosslinking_efficiency", 60.0)

        materials = calculation_results.get("materials", [])
        final_mixing = calculation_results.get("final_mixing", calculation_results.get("finalMixing", {}))

        total_conc = calculation_results.get("total_conc", 0.0)
        max_temp = calculation_results.get("max_temp", 25.0)
        final_rpm = final_mixing.get("rpm", 100.0)

        alginate = 0.0
        gelma = 0.0
        for mat in materials:
            bio_key = str(mat.get("biomaterial", "")).lower().strip()
            if bio_key == "alginate":
                alginate = mat.get("concentration", 0.0)
            elif bio_key == "gelma":
                gelma = mat.get("concentration", 0.0)

        # Recommend reducing concentration if total conc is very high or clogging risk is high
        if total_conc > 15.0 or clogging_risk > 60:
            recommendations.append("Reduce concentration.")

        # Recommend lowering temperature if thermal limits are exceeded
        if max_temp > 40.0:
            recommendations.append("Lower temperature.")

        # Recommend increasing GelMA if printability is low
        if gelma > 0 and gelma < 5.0 and printability < 60:
            recommendations.append("Increase GelMA.")

        # Recommend decreasing RPM if shear stress is too high
        if final_rpm > 500.0 or cell_viability < 75:
            recommendations.append("Decrease RPM.")

        # Recommend modifying crosslinker if efficiency is low
        if crosslinking_efficiency < 75:
            recommendations.append("Modify crosslinker.")

        return recommendations

    def generate_risks(
        self,
        calculation_results: Dict[str, Any]
    ) -> List[str]:
        """
        Generate formulation risks.
        """
        if "risks" in calculation_results:
            return calculation_results["risks"]

        risks = []
        cell_viability = calculation_results.get("cell_viability", 95.0)
        printability = calculation_results.get("printability_score", calculation_results.get("printability", 50.0))
        clogging_risk = calculation_results.get("clogging_risk", 0.0)
        mechanical_strength = calculation_results.get("mechanical_strength", 100.0)
        crosslinking_efficiency = calculation_results.get("crosslinking_efficiency", 60.0)

        if clogging_risk > 50:
            risks.append("High clogging risk")
        if printability < 40:
            risks.append("Low printability")
        if cell_viability < 70:
            risks.append("Poor cell viability")
        if mechanical_strength < 40:
            risks.append("Mechanical instability")
        if crosslinking_efficiency < 70:
            risks.append("Crosslinking issues")

        return risks

    def generate_scientific_explanations(
        self,
        calculation_results: Dict[str, Any]
    ) -> List[str]:
        """
        Generate scientific explanations.
        """
        if "scientific_explanation" in calculation_results:
            return calculation_results["scientific_explanation"]
        if "scientific_explanations" in calculation_results:
            return calculation_results["scientific_explanations"]

        explanations = []
        cell_viability = calculation_results.get("cell_viability", 95.0)
        printability = calculation_results.get("printability_score", calculation_results.get("printability", 50.0))

        explanations.append(f"Predicted cell viability is {cell_viability}%.")
        explanations.append(f"Predicted printability score is {printability}%.")

        return explanations

    def generate_summary(
        self,
        scores: Dict[str, Any]
    ) -> str:
        """
        Generate overall prediction summary.
        """
        status = scores.get("overall_status", "PASS")
        score = scores.get("printability_score", 100)
        recommendation = scores.get("overall_recommendation", "Acceptable")

        return f"Formulation status is {status} (Printability Score: {score}, Recommendation: {recommendation})."
