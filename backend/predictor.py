def predict_bioink(materials):

    alginate = materials.get("alginate", 0)
    gelatin = materials.get("gelatin", 0)
    pectin = materials.get("pectin", 0)
    pluronic = materials.get("pluronic", 0)

    # Printability Score
    printability = 50

    if 2 <= alginate <= 5:
        printability += 20

    if 3 <= gelatin <= 10:
        printability += 15

    if pectin > 1:
        printability += 5

    if pluronic > 5:
        printability += 10

    printability = min(printability, 100)

    # Cell Viability
    cell_viability = 95

    if alginate > 5:
        cell_viability -= 10

    if gelatin > 10:
        cell_viability -= 5

    cell_viability = max(cell_viability, 50)

    # Mechanical Strength
    strength = "Moderate"

    if alginate >= 4:
        strength = "High"

    if gelatin >= 10:
        strength = "Very High"

    # Degradation
    degradation = "Medium"

    if gelatin > alginate:
        degradation = "Fast"

    if alginate > gelatin:
        degradation = "Slow"

    # Crosslinking Efficiency
    crosslinking = "Moderate"

    if alginate >= 2:
        crosslinking = "High"

    if alginate >= 4:
        crosslinking = "Excellent"

    # Nozzle Clogging Risk
    clogging_risk = "Low"

    if gelatin > 10 or alginate > 5:
        clogging_risk = "Moderate"

    if gelatin > 15:
        clogging_risk = "High"

    # Cost Estimation
    cost = 10

    cost += alginate * 1.5
    cost += gelatin * 1.2
    cost += pectin * 0.8
    cost += pluronic * 2

    # Risk Assessment
    risks = []

    if alginate > 5:
        risks.append("Possible nozzle clogging")

    if gelatin > 12:
        risks.append(
            "High viscosity may reduce cell viability"
        )

    if len(risks) == 0:
        risks.append("Low experimental risk")

    # Scientific Explanation
    explanation = []

    if alginate:
        explanation.append(
            f"Alginate ({alginate}%) improves structural integrity."
        )

    if gelatin:
        explanation.append(
            f"Gelatin ({gelatin}%) improves cell adhesion."
        )

    if pectin:
        explanation.append(
            f"Pectin ({pectin}%) contributes to viscosity."
        )

    overall = "Recommended"

    if printability < 60:
        overall = "Needs Optimization"

    return {
        "printability_score": printability,
        "cell_viability": cell_viability,
        "mechanical_strength": strength,
        "degradation_rate": degradation,
        "crosslinking_efficiency": crosslinking,
        "clogging_risk": clogging_risk,
        "estimated_cost": round(cost, 2),
        "overall_recommendation": overall,
        "risks": risks,
        "scientific_explanation": explanation
    }