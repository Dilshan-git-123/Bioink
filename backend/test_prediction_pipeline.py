"""
===============================================================================
BioInkAI End-to-End Pipeline Test
===============================================================================
"""

SEPARATOR = "=" * 60


def main():

    print(SEPARATOR)
    print("BIOINKAI PIPELINE TEST")
    print(SEPARATOR)
    print()

    test_input = {
        "material": "alginate",
        "concentration": 3.0,
        "temperature": 25.0,
        "target_tissue": "cartilage"
    }

    # ------------------------------------------------------------------
    # 1. Validation
    # ------------------------------------------------------------------
    try:
        from prediction_engine.validator import PredictionValidator
        validator = PredictionValidator()
        errors = validator.validate(test_input)
        assert isinstance(errors, list), "Validator must return a list."
        assert len(errors) == 0, "Valid input should produce no errors."
        print("Validation                     PASS")
    except Exception as e:
        print("Validation                     FAIL")
        print("  Exception: " + str(e))

    # ------------------------------------------------------------------
    # 2. Knowledge Loader
    # ------------------------------------------------------------------
    raw_material = None
    try:
        from knowledge_engine.loader import loader
        raw_material = loader.load_material("alginate")
        assert raw_material is not None, "Loader must return material data."
        assert isinstance(raw_material, dict), "Material must be a dict."
        print("Knowledge Loader               PASS")
    except Exception as e:
        print("Knowledge Loader               FAIL")
        print("  Exception: " + str(e))

    # ------------------------------------------------------------------
    # 3. Profile Builder
    # ------------------------------------------------------------------
    profile = None
    try:
        from knowledge_engine.profile_builder import ProfileBuilder
        assert raw_material is not None, "Raw material required."
        profile = ProfileBuilder.build(raw_material)
        assert isinstance(profile, dict), "Profile must be a dict."
        for section in ["material", "physical", "chemical", "preparation",
                        "printing", "crosslinking", "biological", "mechanical"]:
            assert section in profile, "Profile missing section: " + section
        print("Profile Builder                PASS")
    except Exception as e:
        print("Profile Builder                FAIL")
        print("  Exception: " + str(e))

    # ------------------------------------------------------------------
    # 4. Rule Engine
    # ------------------------------------------------------------------
    rule_results = None
    try:
        from prediction_engine.rule_engine import RuleEngine
        assert profile is not None, "Profile required."
        rule_engine = RuleEngine()
        rule_results = rule_engine.evaluate(profile, test_input)
        assert isinstance(rule_results, dict), "Rule results must be a dict."
        assert "concentration" in rule_results, "Missing concentration rule."
        assert "status" in rule_results["concentration"], "Rule must have status."
        print("Rule Engine                    PASS")
    except Exception as e:
        print("Rule Engine                    FAIL")
        print("  Exception: " + str(e))

    # ------------------------------------------------------------------
    # 5. Scientific Calculator
    # ------------------------------------------------------------------
    calc_results = {}
    try:
        from prediction_engine.calculators import ScientificCalculator
        calculator = ScientificCalculator()

        cv = calculator.calculate_cell_viability(
            max_temp=25.0, final_rpm=100.0, final_time=5.0,
            total_conc=3.0, is_chemical=False, is_uv=False,
            total_penalty_cv=0.0
        )
        assert isinstance(cv, int), "Cell viability must be int."
        assert 10 <= cv <= 100, "Cell viability out of range."

        pr = calculator.calculate_printability(
            total_conc=3.0, alginate=3.0, gelma=0.0,
            final_mixing_temp=25.0, final_rpm=100.0, final_time=5.0,
            total_penalty_pr=0.0
        )
        assert isinstance(pr, int), "Printability must be int."
        assert 0 <= pr <= 100, "Printability out of range."

        ms = calculator.calculate_mechanical_strength(
            alginate=3.0, gelma=0.0, collagen=0.0,
            total_penalty_mech=0.0
        )
        assert isinstance(ms, int), "Mechanical strength must be int."

        ce = calculator.calculate_crosslinking_efficiency(
            is_cacl2=False, is_uv=False, is_enzymatic=False, is_chemical=False
        )
        assert isinstance(ce, int), "Crosslinking efficiency must be int."

        dr = calculator.calculate_degradation_rate(total_conc=3.0)
        assert isinstance(dr, int), "Degradation rate must be int."

        cr = calculator.calculate_clogging_risk(
            final_rpm=100.0, final_mixing_temp=25.0
        )
        assert isinstance(cr, int), "Clogging risk must be int."

        ec = calculator.calculate_estimated_cost(
            alginate=3.0, gelatin=0.0, pectin=0.0,
            pluronic=0.0, collagen=0.0, gelma=0.0
        )
        assert isinstance(ec, float), "Estimated cost must be float."

        calc_results = {
            "cell_viability": cv,
            "printability_score": pr,
            "mechanical_strength": ms,
            "crosslinking_efficiency": ce,
            "degradation_rate": dr,
            "clogging_risk": cr,
            "estimated_cost": ec
        }
        print("Scientific Calculator          PASS")
    except Exception as e:
        print("Scientific Calculator          FAIL")
        print("  Exception: " + str(e))

    # ------------------------------------------------------------------
    # 6. Scoring Engine
    # ------------------------------------------------------------------
    scores = None
    try:
        from prediction_engine.scoring import ScoringEngine
        assert rule_results is not None, "Rule results required."
        scoring_engine = ScoringEngine()
        scores = scoring_engine.calculate(rule_results)
        assert isinstance(scores, dict), "Scores must be a dict."
        assert "overall_score" in scores, "Missing overall_score."
        assert "quality" in scores, "Missing quality."
        assert "rule_scores" in scores, "Missing rule_scores."
        print("Scoring Engine                 PASS")
    except Exception as e:
        print("Scoring Engine                 FAIL")
        print("  Exception: " + str(e))

    # ------------------------------------------------------------------
    # 7. Output Model
    # ------------------------------------------------------------------
    prediction_output = None
    try:
        from prediction_engine.output_model import OutputModel
        assert scores is not None, "Scores required."
        assert rule_results is not None, "Rule results required."
        output_model = OutputModel()
        prediction_output = output_model.build_prediction(
            rule_results=rule_results,
            scores=scores,
            calculation_results=calc_results
        )
        assert isinstance(prediction_output, dict), "Output must be a dict."
        assert "success" in prediction_output, "Missing success."
        assert "prediction" in prediction_output, "Missing prediction."
        assert "scores" in prediction_output, "Missing scores."
        assert "warnings" in prediction_output, "Missing warnings."
        assert "recommendations" in prediction_output, "Missing recommendations."
        assert "scientific_explanations" in prediction_output, "Missing scientific_explanations."
        assert "risks" in prediction_output, "Missing risks."
        print("Output Model                   PASS")
    except Exception as e:
        print("Output Model                   FAIL")
        print("  Exception: " + str(e))

    # ------------------------------------------------------------------
    # 8. PredictionEngine (full pipeline)
    # ------------------------------------------------------------------
    final_prediction = None
    try:
        from prediction_engine.predictor import PredictionEngine
        engine = PredictionEngine()
        final_prediction = engine.predict(test_input)
        assert isinstance(final_prediction, dict), "Prediction must be a dict."
        print("Prediction Engine              PASS")
    except Exception as e:
        print("Prediction Engine              FAIL")
        print("  Exception: " + str(e))

    # ------------------------------------------------------------------
    # 9. Final Prediction Verification
    # ------------------------------------------------------------------
    try:
        assert final_prediction is not None, "Final prediction is None."
        assert final_prediction.get("success") is True, "success must be True."
        assert "prediction" in final_prediction, "Missing prediction."
        assert "scores" in final_prediction, "Missing scores."
        assert "warnings" in final_prediction, "Missing warnings."
        assert "recommendations" in final_prediction, "Missing recommendations."
        assert "scientific_explanations" in final_prediction, "Missing scientific_explanations."
        assert "risks" in final_prediction, "Missing risks."
        print("Final Prediction               PASS")
    except Exception as e:
        print("Final Prediction               FAIL")
        print("  Exception: " + str(e))

    print()
    print(SEPARATOR)


if __name__ == "__main__":
    main()
