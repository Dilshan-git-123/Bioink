from knowledge_engine.loader import loader
from knowledge_engine.adapters.preparation import PreparationAdapter

material = loader.load_material("alginate")

preparation = PreparationAdapter.extract(material)

print("=" * 60)
print("PREPARATION PARAMETERS")
print("=" * 60)

for section, values in preparation.items():
    print()

    print(section.upper())

    if isinstance(values, dict):
        for key, value in values.items():
            print(f"  {key}: {value}")
    else:
        print(values)
