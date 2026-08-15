from knowledge_engine.loader import loader
from knowledge_engine.profile_builder import ProfileBuilder
from prediction_engine.rule_engine import RuleEngine

# Load YAML
material = loader.load_material("alginate")

# Build Profile
profile = ProfileBuilder.build(material)

# Initialize Rule Engine
rule_engine = RuleEngine()

print("=" * 60)
print("TEST 1 - VALID CONCENTRATION")
print("=" * 60)

user_input = {
    "concentration": 3
}

result = rule_engine.evaluate(profile, user_input)

print(result)

print("\n" + "=" * 60)
print("TEST 2 - INVALID CONCENTRATION")
print("=" * 60)

user_input = {
    "concentration": 10
}

result = rule_engine.evaluate(profile, user_input)

print(result)