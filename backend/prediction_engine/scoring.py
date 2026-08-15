"""
===============================================================================
BioInkAI Prediction Engine

Scoring Engine
===============================================================================
"""

from typing import Dict, Any


class ScoringEngine:
    """
    Calculates prediction scores based on weighted scientific rules.
    """

    def __init__(self):
        """
        Initialize Scoring Engine.
        """
        pass

    def calculate(self, rule_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate final scores and classify quality.
        """
        overall_score = self.calculate_overall_score(rule_results)
        quality = self.classify_quality(overall_score)

        return {
            "overall_score": overall_score,
            "quality": quality,
            "rule_scores": rule_results,
            # Backward compatibility:
            "printability_score": overall_score,
            "overall_status": "PASS" if overall_score >= 80 else "FAIL"
        }

    def calculate_overall_score(self, rule_results: Dict[str, Any]) -> int:
        """
        Calculate overall weighted score.
        """
        def get_rule_score(key: str) -> float:
            rule = rule_results.get(key, {})
            if "score" in rule:
                return float(rule["score"])
            
            # Fallback for old rule engines that only returned status
            status = rule.get("status", "PASS")
            if status == "FAIL":
                return 20.0
            elif status == "WARNING":
                return 75.0
            return 100.0

        conc_score = get_rule_score("concentration")
        temp_score = get_rule_score("temperature")
        speed_score = get_rule_score("mixing_speed")
        time_score = get_rule_score("mixing_time")
        cross_score = get_rule_score("crosslinking")
        prof_score = get_rule_score("material_profile")

        weighted_score = (
            conc_score * 0.25 +
            temp_score * 0.20 +
            speed_score * 0.15 +
            time_score * 0.10 +
            cross_score * 0.20 +
            prof_score * 0.10
        )
        return int(round(weighted_score))

    def classify_quality(self, score: int) -> str:
        """
        Classify formulation quality based on score.
        """
        if score >= 90:
            return "EXCELLENT"
        elif score >= 80:
            return "VERY GOOD"
        elif score >= 70:
            return "GOOD"
        elif score >= 60:
            return "ACCEPTABLE"
        elif score >= 40:
            return "POOR"
        else:
            return "UNSUITABLE"