def generate_suggestions(prediction):
    """
    Generate dynamic suggestions based on the prediction scores.
    """
    suggestions = []

    # Extract metrics from prediction dictionary
    cell_viability = prediction.get("cell_viability", 0)
    printability_score = prediction.get("printability_score", 0)
    mechanical_strength = prediction.get("mechanical_strength", 0)
    degradation_rate = prediction.get("degradation_rate", 0)
    crosslinking_efficiency = prediction.get("crosslinking_efficiency", 0)
    clogging_risk = prediction.get("clogging_risk", 0)

    # CELL VIABILITY
    if cell_viability >= 90:
        suggestions.append("Excellent cell viability predicted.")
        suggestions.append("Current formulation is suitable for cell encapsulation.")
    elif 75 <= cell_viability <= 89:
        suggestions.append("Cell viability is acceptable.")
        suggestions.append("Reducing mixing RPM may further improve viability.")
    elif cell_viability < 75:
        suggestions.append("Reduce preparation temperature.")
        suggestions.append("Reduce mixing RPM.")
        suggestions.append("Reduce shear stress during extrusion.")

    # PRINTABILITY
    if printability_score >= 80:
        suggestions.append("Excellent printability predicted.")
    elif 60 <= printability_score <= 79:
        suggestions.append("Increasing alginate concentration may improve printability.")
    elif printability_score < 60:
        suggestions.append("Increase structural polymer concentration.")
        suggestions.append("Increase bioink viscosity.")

    # MECHANICAL STRENGTH
    if mechanical_strength >= 80:
        suggestions.append("Mechanical stability is excellent.")
    elif 50 <= mechanical_strength <= 79:
        suggestions.append("Adding GelMA or collagen can improve stiffness.")
    elif mechanical_strength < 50:
        suggestions.append("Increase structural polymers.")
        suggestions.append("Increase crosslinking density.")

    # DEGRADATION
    if degradation_rate > 80:
        suggestions.append("Bioink may degrade rapidly.")
        suggestions.append("Increase crosslink density.")
    elif degradation_rate < 40:
        suggestions.append("Bioink degradation is slow.")

    # CROSSLINKING
    if crosslinking_efficiency >= 85:
        suggestions.append("Crosslinking efficiency is excellent.")
    else:
        suggestions.append("Consider optimizing the crosslinking strategy.")

    # CLOGGING
    if clogging_risk > 60:
        suggestions.append("Reduce polymer concentration.")
        suggestions.append("Increase nozzle diameter.")
    elif clogging_risk < 20:
        suggestions.append("Nozzle clogging risk is low.")

    # OVERALL
    if cell_viability >= 90 and printability_score >= 80 and mechanical_strength >= 70:
        suggestions.append("Overall formulation is highly suitable for extrusion bioprinting.")

    # Remove duplicates while preserving order
    seen = set()
    unique_suggestions = []
    for suggestion in suggestions:
        if suggestion not in seen:
            unique_suggestions.append(suggestion)
            seen.add(suggestion)

    return {
        "suggestions": unique_suggestions
    }
