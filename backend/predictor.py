# predictor.py  --  Python 2 / 3 compatible
"""Predict bioink properties based on material composition and processing parameters.

Accepts a list of material dicts (each with biomaterial, concentration,
temperature, rpm, time, method) and an optional finalMixing dict.
Compares every parameter against the scientific ranges stored in
materials_db.py and penalises scores accordingly.
"""

from materials_db import MATERIALS_DB


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_float(val, default=0.0):
    """Safely cast *val* to float."""
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def _range_label(lo, hi, unit=""):
    """Human-readable range string, e.g. '20-37 C'."""
    if unit:
        return str(lo) + "-" + str(hi) + " " + unit
    return str(lo) + "-" + str(hi)


def _deviation_fraction(value, lo, hi):
    """Return how far *value* is outside [lo, hi] as a fraction of the range.

    Returns 0.0 when inside the range, positive otherwise.
    """
    span = hi - lo if hi != lo else 1.0
    if value < lo:
        return (lo - value) / span
    if value > hi:
        return (value - hi) / span
    return 0.0


# ---------------------------------------------------------------------------
# Per-material parameter validation against MATERIALS_DB
# ---------------------------------------------------------------------------

def _validate_material_params(mat, explanation, risks):
    """Compare one material's params to its MATERIALS_DB profile.

    Returns a dict of penalty contributions::

        {
            "cell_viability": float,
            "printability":   float,
            "mechanical":     float,
        }
    """
    penalties = {"cell_viability": 0.0, "printability": 0.0, "mechanical": 0.0}

    bio_key = str(mat.get("biomaterial", "")).lower().strip()
    profile = MATERIALS_DB.get(bio_key)
    if not profile:
        return penalties  # unknown material – skip range checks

    bio_name = profile.get("name", bio_key.capitalize())
    conc = _get_float(mat.get("concentration"))
    temp = _get_float(mat.get("temperature"), default=None)
    rpm  = _get_float(mat.get("rpm"), default=None)
    time = _get_float(mat.get("time"), default=None)
    method = str(mat.get("method", "")).strip()

    # --- Concentration ---
    conc_range = profile.get("recommended_concentration_range")
    if conc_range and conc > 0:
        lo, hi = conc_range
        dev = _deviation_fraction(conc, lo, hi)
        if dev > 0:
            label = _range_label(lo, hi, "% w/v")
            if conc > hi:
                pen_cv = min(15.0, dev * 12.0)
                pen_pr = min(10.0, dev * 8.0)
                penalties["cell_viability"] += pen_cv
                penalties["printability"] += pen_pr
                penalties["mechanical"] += min(5.0, dev * 4.0)
                explanation.append(
                    bio_name + " concentration (" + str(conc) +
                    "% w/v) exceeds the recommended range (" + label +
                    "). High concentration restricts nutrient diffusion "
                    "and increases extrusion shear stress, reducing cell "
                    "viability by ~" + str(round(pen_cv, 1)) +
                    "% and printability by ~" + str(round(pen_pr, 1)) + "%."
                )
                risks.append(
                    bio_name + " concentration above " + str(hi) +
                    "% w/v may impair cell viability and printability."
                )
            else:
                pen_pr = min(10.0, dev * 10.0)
                pen_mech = min(8.0, dev * 8.0)
                penalties["printability"] += pen_pr
                penalties["mechanical"] += pen_mech
                explanation.append(
                    bio_name + " concentration (" + str(conc) +
                    "% w/v) is below the recommended range (" + label +
                    "). Insufficient polymer may yield poor shape fidelity "
                    "and weak mechanical properties."
                )
                risks.append(
                    bio_name + " concentration below " + str(lo) +
                    "% w/v may compromise gel integrity."
                )
        else:
            explanation.append(
                bio_name + " concentration (" + str(conc) +
                "% w/v) is within the recommended range (" +
                _range_label(lo, hi, "% w/v") + ")."
            )

    # --- Preparation temperature ---
    temp_range = profile.get("preparation_temperature_range")
    if temp is not None and temp_range:
        lo, hi = temp_range
        dev = _deviation_fraction(temp, lo, hi)
        if dev > 0:
            label = _range_label(lo, hi, "°C")
            if temp > hi:
                pen_cv = min(20.0, dev * 15.0)
                penalties["cell_viability"] += pen_cv
                penalties["mechanical"] += min(5.0, dev * 4.0)
                explanation.append(
                    bio_name + " preparation temperature (" + str(temp) +
                    " °C) exceeds the recommended range (" + label +
                    "). Excessive heat can denature proteins and degrade "
                    "polymer chains, reducing cell viability by ~" +
                    str(round(pen_cv, 1)) + "%."
                )
                risks.append(
                    bio_name + " preparation temperature above " + str(hi) +
                    " °C risks thermal degradation."
                )
            else:
                pen_pr = min(8.0, dev * 8.0)
                penalties["printability"] += pen_pr
                explanation.append(
                    bio_name + " preparation temperature (" + str(temp) +
                    " °C) is below the recommended range (" + label +
                    "). Insufficient temperature may prevent complete "
                    "polymer dissolution, reducing printability by ~" +
                    str(round(pen_pr, 1)) + "%."
                )
                risks.append(
                    bio_name + " preparation temperature below " + str(lo) +
                    " °C may cause incomplete dissolution."
                )
        else:
            explanation.append(
                bio_name + " preparation temperature (" + str(temp) +
                " °C) is within the recommended range (" +
                _range_label(lo, hi, "°C") + ")."
            )

    # --- Mixing RPM ---
    rpm_range = profile.get("recommended_mixing_rpm")
    if rpm is not None and rpm_range:
        lo, hi = rpm_range
        dev = _deviation_fraction(rpm, lo, hi)
        if dev > 0:
            label = _range_label(lo, hi, "RPM")
            if rpm > hi:
                pen_cv = min(15.0, dev * 10.0)
                pen_pr = min(8.0, dev * 6.0)
                penalties["cell_viability"] += pen_cv
                penalties["printability"] += pen_pr
                explanation.append(
                    bio_name + " mixing RPM (" + str(rpm) +
                    ") exceeds the recommended range (" + label +
                    "). High shear stress damages encapsulated cells "
                    "(viability −" + str(round(pen_cv, 1)) +
                    "%) and may introduce air bubbles (printability −" +
                    str(round(pen_pr, 1)) + "%)."
                )
                risks.append(
                    bio_name + " mixing RPM above " + str(hi) +
                    " may cause excessive shear damage."
                )
            else:
                pen_pr = min(8.0, dev * 8.0)
                penalties["printability"] += pen_pr
                explanation.append(
                    bio_name + " mixing RPM (" + str(rpm) +
                    ") is below the recommended range (" + label +
                    "). Insufficient mixing speed may result in "
                    "non-homogeneous bioink distribution."
                )
                risks.append(
                    bio_name + " mixing RPM below " + str(lo) +
                    " may yield inhomogeneous mixing."
                )

    # --- Mixing time ---
    time_range = profile.get("recommended_mixing_time")
    if time is not None and time_range:
        lo, hi = time_range
        dev = _deviation_fraction(time, lo, hi)
        if dev > 0:
            label = _range_label(lo, hi, "min")
            if time > hi:
                pen_cv = min(10.0, dev * 8.0)
                pen_pr = min(8.0, dev * 6.0)
                penalties["cell_viability"] += pen_cv
                penalties["printability"] += pen_pr
                penalties["mechanical"] += min(5.0, dev * 4.0)
                explanation.append(
                    bio_name + " mixing time (" + str(time) +
                    " min) exceeds the recommended range (" + label +
                    "). Prolonged mixing degrades polymer chains and "
                    "limits oxygen diffusion to cells."
                )
                risks.append(
                    bio_name + " mixing time above " + str(hi) +
                    " min may degrade the bioink."
                )
            else:
                pen_pr = min(6.0, dev * 6.0)
                penalties["printability"] += pen_pr
                explanation.append(
                    bio_name + " mixing time (" + str(time) +
                    " min) is below the recommended range (" + label +
                    "). Insufficient mixing may yield poor homogeneity."
                )

    # --- Preparation method / crosslinking compatibility ---
    compatible = profile.get("compatible_crosslinking_methods", [])
    if method and compatible:
        method_lower = method.lower()
        is_compat = False
        for item in compatible:
            if any(token in method_lower for token in item.lower().split()):
                is_compat = True
                break
            if method_lower in item.lower():
                is_compat = True
                break
        if not is_compat:
            penalties["mechanical"] += 8.0
            penalties["printability"] += 5.0
            explanation.append(
                bio_name + " preparation method '" + method +
                "' is not among the recommended crosslinking methods (" +
                ", ".join(compatible) + "). Incompatible methods reduce "
                "crosslinking efficiency and mechanical integrity."
            )
            risks.append(
                bio_name + ": method '" + method +
                "' may be incompatible — consider " +
                ", ".join(compatible) + "."
            )
        else:
            explanation.append(
                bio_name + " preparation method '" + method +
                "' is compatible with recommended crosslinking approaches."
            )

    return penalties


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def predict_bioink(materials, final_mixing=None):
    """Return scores and explanations for a bioink formulation.

    Parameters
    ----------
    materials : list[dict]
        Each dict contains: biomaterial, concentration, temperature,
        rpm, time, method.
    final_mixing : dict or None
        Contains: temperature, rpm, time, crosslinking.
    """
    if final_mixing is None:
        final_mixing = {}

    risks = []
    explanation = []

    # ------------------------------------------------------------------
    # 1. Aggregate concentrations & collect per-material penalties
    # ------------------------------------------------------------------
    concentrations = {}
    total_penalty_cv = 0.0
    total_penalty_pr = 0.0
    total_penalty_mech = 0.0

    for mat in (materials or []):
        bio_key = str(mat.get("biomaterial", "")).lower().strip()
        conc = _get_float(mat.get("concentration"))
        if bio_key:
            concentrations[bio_key] = conc

        # Validate each material against its MATERIALS_DB profile
        pen = _validate_material_params(mat, explanation, risks)
        total_penalty_cv += pen["cell_viability"]
        total_penalty_pr += pen["printability"]
        total_penalty_mech += pen["mechanical"]

    alginate = concentrations.get("alginate", 0.0)
    gelatin  = concentrations.get("gelatin", 0.0)
    pectin   = concentrations.get("pectin", 0.0)
    pluronic = concentrations.get("pluronic", 0.0)
    collagen = concentrations.get("collagen", 0.0)
    gelma    = concentrations.get("gelma", 0.0)
    total_conc = alginate + gelatin + pectin + pluronic + collagen + gelma

    # ------------------------------------------------------------------
    # 2. Final-mixing / crosslinking parameters
    # ------------------------------------------------------------------
    final_mixing_temp = _get_float(final_mixing.get("temperature"), 25.0)
    final_rpm  = _get_float(final_mixing.get("rpm"), 100.0)
    final_time = _get_float(final_mixing.get("time"), 5.0)
    crosslinking_method = str(final_mixing.get("crosslinking", "")).strip()
    xm = crosslinking_method.lower()

    is_cacl2     = any(x in xm for x in ["cacl2", "calcium"])
    is_uv        = any(x in xm for x in ["uv", "light", "photo"])
    is_enzymatic = any(x in xm for x in ["enzymatic", "tg", "transglutaminase"])
    is_chemical  = any(x in xm for x in ["chemical", "glutaraldehyde", "genipin"])

    # Collect the highest per-material prep temperature for global checks
    mat_temps = [
        _get_float(m.get("temperature"), None)
        for m in (materials or [])
        if _get_float(m.get("temperature"), None) is not None
    ]
    max_prep_temp = max(mat_temps) if mat_temps else 25.0
    max_temp = max(max_prep_temp, final_mixing_temp)

    # =========================================================
    # Cell Viability (starts at 95%)
    # =========================================================
    cell_viability = 95.0

    # Global temperature effects
    if max_temp > 50.0:
        reduction = 60.0 + (max_temp - 50.0) * 2.0
        explanation.append(
            "Cell viability drastically reduced: temperature " + str(max_temp) +
            " °C causes cell lysis above 50 °C."
        )
        risks.append("Temperature exceeds 50 °C — will cause cell death.")
        cell_viability -= reduction
    elif max_temp > 40.0:
        reduction = (max_temp - 40.0) * 5.0
        explanation.append(
            "Cell viability reduced: temperature " + str(max_temp) +
            " °C exceeds the 40 °C physiological threshold."
        )
        risks.append("Processing temperature exceeds physiological limit.")
        cell_viability -= reduction
    elif max_temp < 10.0:
        cell_viability -= 5.0
        explanation.append(
            "Mild viability reduction due to cold shock at " + str(max_temp) + " °C."
        )
        risks.append("Low temperature may cause cold shock to cells.")

    # Global RPM effects (final mixing stage)
    if final_rpm > 1200.0:
        reduction = 30.0 + (final_rpm - 1200.0) * 0.05
        explanation.append(
            "Severe shear stress at " + str(final_rpm) +
            " RPM (final mixing) drastically reduces cell viability."
        )
        risks.append("Extreme final-mixing RPM causes high shear stress and cell damage.")
        cell_viability -= reduction
    elif final_rpm > 500.0:
        reduction = (final_rpm - 500.0) * 0.04
        explanation.append(
            "Elevated shear stress at " + str(final_rpm) +
            " RPM (final mixing) reduces cell viability."
        )
        risks.append("High final-mixing RPM may damage encapsulated cells.")
        cell_viability -= reduction

    # Global mixing time effects
    if final_time > 30.0:
        reduction = min(20.0, (final_time - 30.0) * 0.5)
        explanation.append(
            "Prolonged final mixing (" + str(final_time) +
            " min) limits oxygen diffusion and stresses cells."
        )
        risks.append("Excessive final mixing time can reduce cell viability.")
        cell_viability -= reduction

    # Total polymer concentration
    if total_conc > 15.0:
        reduction = min(15.0, (total_conc - 15.0) * 1.0)
        explanation.append(
            "High total polymer concentration (" + str(total_conc) +
            "%) restricts nutrient diffusion."
        )
        cell_viability -= reduction
        if total_conc > 20.0:
            risks.append("Excessive polymer concentration reduces cell viability.")

    # Crosslinking method cytotoxicity
    if is_chemical:
        cell_viability -= 15.0
        explanation.append("Chemical crosslinking agents are potentially cytotoxic.")
        risks.append("Chemical crosslinkers may be toxic to cells.")
    elif is_uv:
        cell_viability -= 8.0
        explanation.append("UV radiation during crosslinking can induce DNA damage.")
        risks.append("UV crosslinking may induce cell stress.")

    # Apply per-material validation penalties
    cell_viability -= total_penalty_cv

    cell_viability = max(min(int(round(cell_viability)), 100), 10)
    if cell_viability >= 85 and max_temp <= 37.0 and final_rpm <= 300.0:
        explanation.append(
            "Excellent cell viability expected under mild, physiological conditions."
        )

    # =========================================================
    # Printability
    # =========================================================
    printability = 50.0
    if total_conc == 0.0:
        printability = 10.0
        explanation.append("No gel-forming polymers detected — printability will be very low.")
    else:
        if 2.0 <= alginate <= 5.0:
            printability += 20.0
            explanation.append(
                "Alginate at " + str(alginate) +
                "% provides ideal shear-thinning for extrusion."
            )
        elif alginate > 5.0:
            printability += 10.0
            explanation.append(
                "High alginate (" + str(alginate) +
                "%) increases extrusion pressure requirements."
            )
        elif 0.0 < alginate < 2.0:
            printability += 5.0
            explanation.append(
                "Low alginate (" + str(alginate) +
                "%) yields soft gels with limited support."
            )

        if 5.0 <= gelma <= 15.0:
            printability += 15.0
            explanation.append(
                "GelMA at " + str(gelma) +
                "% adds photocrosslinkable stiffness for shape fidelity."
            )
        elif gelma > 15.0:
            printability += 5.0
            explanation.append(
                "Very high GelMA (" + str(gelma) + "%) may cause brittleness."
            )

        if 20.0 <= final_mixing_temp <= 30.0:
            printability += 10.0
            explanation.append(
                "Optimal final mixing temperature (" + str(final_mixing_temp) +
                " °C) promotes homogeneous gel."
            )
        elif final_mixing_temp > 35.0:
            printability -= 5.0
            explanation.append(
                "High final mixing temperature (" + str(final_mixing_temp) +
                " °C) risks premature gelation."
            )

        if final_rpm > 800.0:
            printability -= 5.0
            explanation.append(
                "High final mixing RPM (" + str(final_rpm) +
                ") may introduce air bubbles."
            )

        if final_time > 60.0:
            printability -= 10.0
            explanation.append(
                "Excessive final mixing time (" + str(final_time) +
                " min) degrades polymer chains."
            )
            risks.append(
                "Long final mixing time may degrade polymer structure and printability."
            )

    # Apply per-material validation penalties
    printability -= total_penalty_pr

    printability = max(min(int(round(printability)), 100), 0)

    # =========================================================
    # Mechanical Strength
    # =========================================================
    mechanical_strength = (alginate * 2 + gelma * 1.5 + collagen * 1.2) * 2
    mechanical_strength -= total_penalty_mech
    mechanical_strength = int(round(max(min(mechanical_strength, 100), 0)))

    # =========================================================
    # Degradation Rate (lower value = faster degradation)
    # =========================================================
    degradation_rate = int(round(max(min(100 - total_conc * 2, 100), 0)))

    # =========================================================
    # Crosslinking Efficiency
    # =========================================================
    if is_cacl2:
        crosslinking_efficiency = 85
    elif is_uv:
        crosslinking_efficiency = 70
    elif is_enzymatic:
        crosslinking_efficiency = 75
    elif is_chemical:
        crosslinking_efficiency = 90
    else:
        crosslinking_efficiency = 60

    # =========================================================
    # Clogging Risk
    # =========================================================
    clogging_risk = 0
    if final_rpm > 1000:
        clogging_risk += 20
    if final_mixing_temp < 15:
        clogging_risk += 15
    clogging_risk = min(clogging_risk, 100)

    # =========================================================
    # Estimated Cost (USD/ml)
    # =========================================================
    estimated_cost = round(
        alginate * 0.10 + gelatin * 0.12 + pectin * 0.08 +
        pluronic * 0.15 + collagen * 0.20 + gelma * 0.18, 2
    )

    # =========================================================
    # Overall Recommendation
    # =========================================================
    if cell_viability < 60 or printability < 40:
        overall = "Needs optimisation"
    elif cell_viability >= 85 and printability >= 80:
        overall = "Highly recommended"
    else:
        overall = "Acceptable"

    return {
        "printability_score": printability,
        "cell_viability": cell_viability,
        "mechanical_strength": mechanical_strength,
        "degradation_rate": degradation_rate,
        "crosslinking_efficiency": crosslinking_efficiency,
        "clogging_risk": clogging_risk,
        "estimated_cost": estimated_cost,
        "overall_recommendation": overall,
        "risks": risks,
        "scientific_explanation": explanation,
    }
