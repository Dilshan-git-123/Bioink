from knowledge_engine.loader import loader
from knowledge_engine.adapters.chemical import ChemicalAdapter

material = loader.load_material("alginate")

chemical = ChemicalAdapter.extract(material)

print("=" * 60)
print("CHEMICAL PROPERTIES")
print("=" * 60)

for section, values in chemical.items():
    print()

    print(section.upper())

    if isinstance(values, dict):
        for key, value in values.items():
            print(f"  {key}: {value}")
    else:
        print(values)
