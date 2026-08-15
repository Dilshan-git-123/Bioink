from knowledge_engine.loader import loader
from knowledge_engine.adapters.mechanical import MechanicalAdapter

material = loader.load_material("alginate")

mechanical = MechanicalAdapter.extract(material)

print("=" * 60)
print("MECHANICAL PROPERTIES")
print("=" * 60)

for section, values in mechanical.items():
    print()

    print(section.upper())

    if isinstance(values, dict):
        for key, value in values.items():
            print(f"  {key}: {value}")
    else:
        print(values)