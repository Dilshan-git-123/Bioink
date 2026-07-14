# validator.py
"""
Validation Engine for BioInkAI v2.0.

Validates user-supplied bioink parameters against the scientific knowledge base
stored in materials_db.py.  The validator does NOT generate predictions; it only
checks whether the inputs are within scientifically recommended ranges and returns
structured feedback.

Usage (standalone):
    from validator import validate_bioink
    result = validate_bioink(
        biomaterial="alginate",
        concentration=8.0,
        preparation_temperature=45.0,
        final_mixing_temperature=25.0,
        mixing_rpm=300,
        mixing_time=15,
        crosslinking_method="CaCl2"
    )

Usage from predictor.py:
    from validator import validate_bioink
    validation = validate_bioink(...)
    if not validation["valid"]:
        # handle errors
        pass
"""

from materials_db import MATERIALS_DB


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _to_float(value, default=None):
    """Safely convert a value to float; return *default* on failure."""
    if value is None:
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def _range_label(lo, hi, unit=""):
    """Return a human-readable range string, e.g. '20–37 C'."""
    if unit:
        return str(lo) + "-" + str(hi) + " " + unit
    return str(lo) + "-" + str(hi)


def _check_range(value, lo, hi):
    """Return 'low', 'ok', or 'high' depending on where *value* falls."""
    if value < lo:
        return "low"
    if value > hi:
        return "high"
    return "ok"


# ---------------------------------------------------------------------------
# Crosslinking compatibility check
# ---------------------------------------------------------------------------

def _normalize(text):
    """Normalize strings for comparison."""
    if not text:
        return ""

    return (
        str(text)
        .lower()
        .replace("₂", "2")
        .replace("₃", "3")
        .replace("₄", "4")
        .replace(" ", "")
        .strip()
    )


def _crosslinking_compatible(method, compatible_list):
    """Return True if the selected crosslinking method is compatible."""

    if not method:
        return None

    method = _normalize(method)

    for item in compatible_list:
        if _normalize(item) == method:
            return True

        # Allow partial matches like "UV" -> "UV (365 nm)"
        if method in _normalize(item):
            return True

    return False


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def validate_bioink(
    biomaterial,
    concentration=None,
    preparation_temperature=None,
    final_mixing_temperature=None,
    mixing_rpm=None,
    mixing_time=None,
    crosslinking_method=None,
):
    """Validate a set of bioink parameters against the materials knowledge base.

    Parameters
    ----------
    biomaterial : str
        Name of the biomaterial (e.g. "alginate", "gelma").
    concentration : float or None
        Polymer concentration in % w/v.
    preparation_temperature : float or None
        Temperature used during preparation (deg C).
    final_mixing_temperature : float or None
        Temperature at the time of final mixing (deg C).
    mixing_rpm : float or None
        Rotational speed during mixing.
    mixing_time : float or None
        Duration of mixing in minutes.
    crosslinking_method : str or None
        Crosslinking method selected by the user.

    Returns
    -------
    dict
        {
            "valid"    : bool,           # False if any errors are present
            "errors"   : list[str],      # hard violations (out-of-range)
            "warnings" : list[str],      # soft cautions (near limits)
            "info"     : list[str],      # informational notes
        }
    """
    errors = []
    warnings = []
    info = []

    # ------------------------------------------------------------------
    # 1. Biomaterial lookup
    # ------------------------------------------------------------------
    bio_key = str(biomaterial).lower().strip() if biomaterial else ""
    profile = MATERIALS_DB.get(bio_key)

    if not bio_key:
        errors.append("No biomaterial was selected. Please choose a biomaterial.")
        return {"valid": False, "errors": errors, "warnings": warnings, "info": info}

    if profile is None:
        # Unknown material – we can still validate numeric ranges generically
        warnings.append(
            "Biomaterial '" + str(biomaterial) + "' is not in the knowledge base. "
            "Parameter ranges could not be validated against scientific references."
        )
        profile = {}

    bio_name = profile.get("name", str(biomaterial).capitalize())

    # ------------------------------------------------------------------
    # 2. Concentration
    # ------------------------------------------------------------------
    conc = _to_float(concentration)
    conc_range = profile.get("recommended_concentration_range")

    if conc is not None and conc_range:
        lo, hi = conc_range
        status = _check_range(conc, lo, hi)
        label = _range_label(lo, hi, "% w/v")
        if status == "high":
            errors.append(
                "Concentration (" + str(conc) + "% w/v) exceeds the recommended range for "
                + bio_name + " (" + label + "). High concentration increases viscosity and "
                "may impair cell viability and printability."
            )
        elif status == "low":
            warnings.append(
                "Concentration (" + str(conc) + "% w/v) is below the recommended range for "
                + bio_name + " (" + label + "). Low concentration may yield insufficient "
                "mechanical strength and poor shape fidelity."
            )
        else:
            info.append(
                "Concentration (" + str(conc) + "% w/v) is within the recommended range for "
                + bio_name + " (" + label + ")."
            )
    elif conc is None:
        warnings.append("Concentration was not provided. Range validation skipped.")

    # ------------------------------------------------------------------
    # 3. Preparation temperature
    # ------------------------------------------------------------------
    prep_temp = _to_float(preparation_temperature)
    prep_temp_range = profile.get("preparation_temperature_range")

    if prep_temp is not None and prep_temp_range:
        lo, hi = prep_temp_range
        status = _check_range(prep_temp, lo, hi)
        label = _range_label(lo, hi, "deg C")
        if status == "high":
            errors.append(
                "Preparation temperature (" + str(prep_temp) + " deg C) exceeds the recommended "
                "range for " + bio_name + " (" + label + "). Excessive heat may denature "
                "proteins and degrade polymer chains."
            )
        elif status == "low":
            errors.append(
                "Preparation temperature (" + str(prep_temp) + " deg C) is below the recommended "
                "range for " + bio_name + " (" + label + "). Insufficient heat may prevent "
                "complete polymer dissolution."
            )
        else:
            info.append(
                "Preparation temperature (" + str(prep_temp) + " deg C) is within the "
                "recommended range for " + bio_name + " (" + label + ")."
            )
    elif prep_temp is None:
        warnings.append("Preparation temperature was not provided. Range validation skipped.")

    # ------------------------------------------------------------------
    # 4. Final mixing temperature
    # ------------------------------------------------------------------
    mix_temp = _to_float(final_mixing_temperature)
    mix_temp_range = profile.get("final_mixing_temperature_range")

    if mix_temp is not None and mix_temp_range:
        lo, hi = mix_temp_range
        status = _check_range(mix_temp, lo, hi)
        label = _range_label(lo, hi, "deg C")
        if status == "high":
            errors.append(
                "Final mixing temperature (" + str(mix_temp) + " deg C) exceeds the recommended "
                "range for " + bio_name + " (" + label + "). This may cause premature gelation "
                "or thermal cell damage."
            )
        elif status == "low":
            warnings.append(
                "Final mixing temperature (" + str(mix_temp) + " deg C) is below the recommended "
                "range for " + bio_name + " (" + label + "). Low temperature may cause "
                "inhomogeneous mixing or incomplete hydration."
            )
        else:
            info.append(
                "Final mixing temperature (" + str(mix_temp) + " deg C) is within the "
                "recommended range for " + bio_name + " (" + label + ")."
            )
    elif mix_temp is None:
        warnings.append("Final mixing temperature was not provided. Range validation skipped.")

    # ------------------------------------------------------------------
    # 5. Mixing RPM
    # ------------------------------------------------------------------
    rpm = _to_float(mixing_rpm)
    rpm_range = profile.get("recommended_mixing_rpm")

    if rpm is not None and rpm_range:
        lo, hi = rpm_range
        status = _check_range(rpm, lo, hi)
        label = _range_label(lo, hi, "RPM")
        if status == "high":
            errors.append(
                "Mixing RPM (" + str(rpm) + ") exceeds the recommended range for "
                + bio_name + " (" + label + "). High shear stress at excessive RPM can "
                "damage encapsulated cells and degrade polymer chains."
            )
        elif status == "low":
            warnings.append(
                "Mixing RPM (" + str(rpm) + ") is below the recommended range for "
                + bio_name + " (" + label + "). Insufficient mixing speed may result in "
                "non-homogeneous bioink distribution."
            )
        else:
            info.append(
                "Mixing RPM (" + str(rpm) + ") is within the recommended range for "
                + bio_name + " (" + label + ")."
            )
    elif rpm is None:
        warnings.append("Mixing RPM was not provided. Range validation skipped.")

    # ------------------------------------------------------------------
    # 6. Mixing time
    # ------------------------------------------------------------------
    mtime = _to_float(mixing_time)
    mtime_range = profile.get("recommended_mixing_time")

    if mtime is not None and mtime_range:
        lo, hi = mtime_range
        status = _check_range(mtime, lo, hi)
        label = _range_label(lo, hi, "min")
        if status == "high":
            warnings.append(
                "Mixing time (" + str(mtime) + " min) exceeds the recommended range for "
                + bio_name + " (" + label + "). Prolonged mixing can degrade polymer chains, "
                "reduce printability, and limit oxygen availability to cells."
            )
        elif status == "low":
            warnings.append(
                "Mixing time (" + str(mtime) + " min) is below the recommended range for "
                + bio_name + " (" + label + "). Insufficient mixing may produce a "
                "non-homogeneous bioink with poor print quality."
            )
        else:
            info.append(
                "Mixing time (" + str(mtime) + " min) is within the recommended range for "
                + bio_name + " (" + label + ")."
            )
    elif mtime is None:
        warnings.append("Mixing time was not provided. Range validation skipped.")

    # ------------------------------------------------------------------
    # 7. Crosslinking method
    # ------------------------------------------------------------------
    compatible_methods = profile.get("compatible_crosslinking_methods", [])

    if crosslinking_method:
        is_compatible = _crosslinking_compatible(crosslinking_method, compatible_methods)
        if is_compatible is False:
            errors.append(
                "Crosslinking method '" + str(crosslinking_method) + "' is not compatible "
                "with " + bio_name + ". Recommended methods: " +
                ", ".join(compatible_methods) + "."
            )
        elif is_compatible:
            info.append(
                "Crosslinking method '" + str(crosslinking_method) + "' is compatible "
                "with " + bio_name + "."
            )
    elif compatible_methods:
        warnings.append(
            "No crosslinking method was selected. " + bio_name + " is typically crosslinked "
            "using: " + ", ".join(compatible_methods) + "."
        )

    # ------------------------------------------------------------------
    # 8. General concentration safety warning
    # ------------------------------------------------------------------
    if conc is not None and conc > 10.0:
        warnings.append(
            "High concentration (" + str(conc) + "% w/v) may significantly reduce cell "
            "viability due to restricted nutrient diffusion and increased shear forces "
            "during extrusion."
        )

    # ------------------------------------------------------------------
    # Result
    # ------------------------------------------------------------------
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "info": info,
    }


# ---------------------------------------------------------------------------
# Batch validator: validate multiple materials at once
# ---------------------------------------------------------------------------

def validate_batch(materials_list):
    """Validate a list of material parameter dicts.

    Each dict in *materials_list* should contain the same keys accepted by
    ``validate_bioink()`` (with ``biomaterial`` being the identifier key).

    Returns a list of per-material validation result dicts, each extended with
    a ``biomaterial`` field for identification.
    """
    results = []
    for entry in materials_list:
        if not isinstance(entry, dict):
            continue
        bio = entry.get("biomaterial") or entry.get("name") or ""
        result = validate_bioink(
            biomaterial=bio,
            concentration=entry.get("concentration"),
            preparation_temperature=entry.get("preparation_temperature"),
            final_mixing_temperature=entry.get("final_mixing_temperature"),
            mixing_rpm=entry.get("mixing_rpm"),
            mixing_time=entry.get("mixing_time"),
            crosslinking_method=entry.get("crosslinking_method"),
        )
        result["biomaterial"] = bio
        results.append(result)
    return results
