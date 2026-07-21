"""
AI Optimization Engine
BioInkAI v2.0
"""

def optimize_bioink(materials, final_mixing):

    suggestions = []

    predicted = {
        "cell_viability": 95,
        "printability": 80,
        "mechanical_strength": 5
    }

    # -----------------------------
    # Material Analysis
    # -----------------------------

    for mat in materials:

        name = mat["biomaterial"].lower()

        conc = float(mat["concentration"])

        temp = float(mat["temperature"])

        rpm = float(mat["rpm"])

        time = float(mat["time"])

        # ---------------- Alginate ----------------

        if name == "alginate":

            if conc > 4:

                suggestions.append({
                    "parameter": "Alginate Concentration",
                    "current": f"{conc}%",
                    "recommended": "3–4%",
                    "reason":
                    "High alginate concentration increases viscosity and shear stress, reducing cell viability."
                })

                predicted["cell_viability"] += 5
                predicted["printability"] += 8

            elif conc < 2:

                suggestions.append({
                    "parameter": "Alginate Concentration",
                    "current": f"{conc}%",
                    "recommended": "3%",
                    "reason":
                    "Low alginate concentration produces poor structural integrity."
                })

        # ---------------- Temperature ----------------

        if temp > 37:

            suggestions.append({

                "parameter": "Preparation Temperature",

                "current": f"{temp} °C",

                "recommended": "25–37 °C",

                "reason":
                "High temperatures reduce cell survival and denature sensitive biomolecules."

            })

            predicted["cell_viability"] += 10

        elif temp < 20:

            suggestions.append({

                "parameter": "Preparation Temperature",

                "current": f"{temp} °C",

                "recommended": "25 °C",

                "reason":
                "Low temperature may prevent complete dissolution."

            })

        # ---------------- RPM ----------------

        if rpm > 400:

            suggestions.append({

                "parameter": "Mixing RPM",

                "current": str(rpm),

                "recommended": "150–300 RPM",

                "reason":
                "Very high RPM generates excessive shear stress."

            })

            predicted["cell_viability"] += 8

        # ---------------- Mixing Time ----------------

        if time > 30:

            suggestions.append({

                "parameter": "Mixing Time",

                "current": f"{time} min",

                "recommended": "10–20 min",

                "reason":
                "Prolonged mixing may damage cells."

            })

            predicted["cell_viability"] += 5

    # -----------------------------
    # Final Mixing
    # -----------------------------

    mix_temp = float(final_mixing["temperature"])

    if mix_temp > 37:

        suggestions.append({

            "parameter": "Final Mixing Temperature",

            "current": f"{mix_temp} °C",

            "recommended": "25–37 °C",

            "reason":
            "High final mixing temperature affects bioink stability."

        })

        predicted["cell_viability"] += 5

    # -----------------------------
    # Score Limit
    # -----------------------------

    predicted["cell_viability"] = min(predicted["cell_viability"],100)

    predicted["printability"] = min(predicted["printability"],100)

    predicted["mechanical_strength"] = min(predicted["mechanical_strength"],10)

    # -----------------------------

    return {

        "optimization_suggestions": suggestions,

        "predicted_improvement": predicted

    }