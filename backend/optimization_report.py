"""
optimization_report.py
------------------------------------
BioInkAI - Intelligent Optimization Report
"""

from typing import List, Dict


def generate_optimization_report(materials: List[Dict], prediction: Dict):

    report = []

    # Store concentrations
    concentrations = {}

    for material in materials:

        name = material.get("biomaterial", "").lower()
        conc = material.get("concentration", 0)

        concentrations[name] = conc

    # ====================================================
    # ALGIMATE
    # ====================================================

    if "alginate" in concentrations:

        alginate = concentrations["alginate"]

        if alginate < 2:

            report.append({
                "issue": "Low Printability",

                "reason":
                "Alginate concentration is lower than the recommended range.",

                "recommendation":
                "Increase Alginate concentration to approximately 2.5%.",

                "expected_improvement": {
                    "printability": "+15%",
                    "shape_fidelity": "+10%"
                }
            })

        elif alginate > 4:

            report.append({
                "issue": "Very High Viscosity",

                "reason":
                "High Alginate concentration may make extrusion difficult.",

                "recommendation":
                "Reduce Alginate concentration to around 3%.",

                "expected_improvement": {
                    "extrusion": "+12%",
                    "clogging_risk": "-20%"
                }
            })

    # ====================================================
    # GELATIN
    # ====================================================

    if "gelatin" in concentrations:

        gelatin = concentrations["gelatin"]

        if gelatin > 3:

            report.append({
                "issue": "Reduced Printing Stability",

                "reason":
                "Higher Gelatin concentration may reduce printing consistency.",

                "recommendation":
                "Reduce Gelatin to approximately 2–3%.",

                "expected_improvement": {
                    "printability": "+8%",
                    "cell_viability": "+5%"
                }
            })

    # ====================================================
    # PECTIN
    # ====================================================

    if "pectin" in concentrations:

        pectin = concentrations["pectin"]

        if pectin > 2:

            report.append({
                "issue": "High Viscosity",

                "reason":
                "Higher Pectin concentration increases viscosity.",

                "recommendation":
                "Reduce Pectin to approximately 1%.",

                "expected_improvement": {
                    "extrusion": "+10%"
                }
            })

    # ====================================================
    # PLURONIC
    # ====================================================

    if "pluronic" in concentrations:

        pluronic = concentrations["pluronic"]

        if pluronic > 4:

            report.append({
                "issue": "Reduced Scaffold Stability",

                "reason":
                "High Pluronic concentration may reduce scaffold stability.",

                "recommendation":
                "Reduce Pluronic concentration to around 3%.",

                "expected_improvement": {
                    "stability": "+15%"
                }
            })

    # ====================================================
    # PERFECT FORMULATION
    # ====================================================

    if len(report) == 0:

        report.append({

            "issue": "Excellent Formulation",

            "reason":
            "No major optimization issues were detected.",

            "recommendation":
            "No optimization required.",

            "expected_improvement": {
                "overall_score": "Already Optimized"
            }

        })

    return report