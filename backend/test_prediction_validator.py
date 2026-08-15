from prediction_engine.validator import PredictionValidator

validator = PredictionValidator()

print("=" * 60)
print("TEST 1 - VALID INPUT")
print("=" * 60)

valid_input = {
    "material": "alginate",
    "concentration": 3,
    "temperature": 25,
    "target_tissue": "cartilage"
}

print(validator.validate(valid_input))


print("\n" + "=" * 60)
print("TEST 2 - MISSING FIELDS")
print("=" * 60)

invalid_input = {
    "material": "",
    "temperature": 25
}

print(validator.validate(invalid_input))


print("\n" + "=" * 60)
print("TEST 3 - INVALID DATA TYPES")
print("=" * 60)

invalid_types = {
    "material": "alginate",
    "concentration": "three",
    "temperature": "hot",
    "target_tissue": "cartilage"
}

print(validator.validate(invalid_types))