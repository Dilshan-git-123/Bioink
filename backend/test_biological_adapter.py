from knowledge_engine.loader import loader
from knowledge_engine.adapters.biological import BiologicalAdapter

material = loader.load_material("alginate")

biological = BiologicalAdapter.extract(material)

print("=" * 60)
print("BIOLOGICAL PROPERTIES")
print("=" * 60)

for section, values in biological.items():
    print()
    print(section.upper())
    if isinstance(values, dict):
        for key, value in values.items():
            print(f"  {key}: {value}")
    else:
        print(values)
