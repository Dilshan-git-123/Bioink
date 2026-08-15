"""
===============================================================================
BioInkAI Prediction Engine

Scientific Calculator
===============================================================================
"""

from typing import Dict, Any


class ScientificCalculator:
    """
    Performs all numerical scientific calculations used by BioInkAI.
    """

    def __init__(self):
        pass

    def calculate_cell_viability(
        self,
        max_temp: float,
        final_rpm: float,
        final_time: float,
        total_conc: float,
        is_chemical: bool,
        is_uv: bool,
        total_penalty_cv: float
    ) -> int:
        """
        Calculate predicted cell viability.
        """
        cell_viability = 95.0

        # Global temperature effects
        if max_temp > 50.0:
            reduction = 60.0 + (max_temp - 50.0) * 2.0
            cell_viability -= reduction
        elif max_temp > 40.0:
            reduction = (max_temp - 40.0) * 5.0
            cell_viability -= reduction
        elif max_temp < 10.0:
            cell_viability -= 5.0

        # Global RPM effects (final mixing stage)
        if final_rpm > 1200.0:
            reduction = 30.0 + (final_rpm - 1200.0) * 0.05
            cell_viability -= reduction
        elif final_rpm > 500.0:
            reduction = (final_rpm - 500.0) * 0.04
            cell_viability -= reduction

        # Global mixing time effects
        if final_time > 30.0:
            reduction = min(20.0, (final_time - 30.0) * 0.5)
            cell_viability -= reduction

        # Total polymer concentration
        if total_conc > 15.0:
            reduction = min(15.0, (total_conc - 15.0) * 1.0)
            cell_viability -= reduction

        # Crosslinking method cytotoxicity
        if is_chemical:
            cell_viability -= 15.0
        elif is_uv:
            cell_viability -= 8.0

        # Apply per-material validation penalties
        cell_viability -= total_penalty_cv

        return max(min(int(round(cell_viability)), 100), 10)

    def calculate_printability(
        self,
        total_conc: float,
        alginate: float,
        gelma: float,
        final_mixing_temp: float,
        final_rpm: float,
        final_time: float,
        total_penalty_pr: float
    ) -> int:
        """
        Calculate printability score.
        """
        printability = 50.0
        if total_conc == 0.0:
            printability = 10.0
        else:
            if 2.0 <= alginate <= 5.0:
                printability += 20.0
            elif alginate > 5.0:
                printability += 10.0
            elif 0.0 < alginate < 2.0:
                printability += 5.0

            if 5.0 <= gelma <= 15.0:
                printability += 15.0
            elif gelma > 15.0:
                printability += 5.0

            if 20.0 <= final_mixing_temp <= 30.0:
                printability += 10.0
            elif final_mixing_temp > 35.0:
                printability -= 5.0

            if final_rpm > 800.0:
                printability -= 5.0

            if final_time > 60.0:
                printability -= 10.0

        # Apply per-material validation penalties
        printability -= total_penalty_pr

        return max(min(int(round(printability)), 100), 0)

    def calculate_mechanical_strength(
        self,
        alginate: float,
        gelma: float,
        collagen: float,
        total_penalty_mech: float,
        gelatin: float = 0.0,
        pectin: float = 0.0,
    ) -> int:
        """
        Calculate predicted mechanical strength.

        Contribution factors (per % w/v):
            alginate : 2.0  — strong ionic network
            gelma    : 1.5  — covalent photo-crosslinked network
            collagen : 1.2  — fibrous protein scaffold
            gelatin  : 0.8  — physical gelation (moderate contribution)
            pectin   : 0.5  — weak ionic network
        Multiplied by 2 to bring the scale to 0-100 for typical concentrations.
        """
        mechanical_strength = (
            alginate * 2.0
            + gelma * 1.5
            + collagen * 1.2
            + gelatin * 0.8
            + pectin * 0.5
        ) * 2
        mechanical_strength -= total_penalty_mech
        return int(round(max(min(mechanical_strength, 100), 0)))

    def calculate_crosslinking_efficiency(
        self,
        is_cacl2: bool,
        is_uv: bool,
        is_enzymatic: bool,
        is_chemical: bool
    ) -> int:
        """
        Calculate crosslinking efficiency.
        """
        if is_cacl2:
            return 85
        elif is_uv:
            return 70
        elif is_enzymatic:
            return 75
        elif is_chemical:
            return 90
        else:
            return 60

    def calculate_degradation_rate(
        self,
        total_conc: float
    ) -> int:
        """
        Calculate degradation rate.
        """
        return int(round(max(min(100 - total_conc * 2, 100), 0)))

    def calculate_clogging_risk(
        self,
        final_rpm: float,
        final_mixing_temp: float
    ) -> int:
        """
        Calculate nozzle clogging risk.
        """
        clogging_risk = 0
        if final_rpm > 1000:
            clogging_risk += 20
        if final_mixing_temp < 15:
            clogging_risk += 15
        return min(clogging_risk, 100)

    def calculate_estimated_cost(
        self,
        alginate: float,
        gelatin: float,
        pectin: float,
        pluronic: float,
        collagen: float,
        gelma: float
    ) -> float:
        """
        Calculate estimated formulation cost.
        """
        return round(
            alginate * 0.10 + gelatin * 0.12 + pectin * 0.08 +
            pluronic * 0.15 + collagen * 0.20 + gelma * 0.18, 2
        )
