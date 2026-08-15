from prediction_engine.scoring import ScoringEngine

engine = ScoringEngine()

print("=" * 60)
print("TEST 1")
print("=" * 60)

rules = {
    "concentration": {
        "status": "PASS"
    }
}

print(engine.calculate(rules))

print("\n" + "=" * 60)
print("TEST 2")
print("=" * 60)

rules = {
    "concentration": {
        "status": "FAIL"
    }
}

print(engine.calculate(rules))