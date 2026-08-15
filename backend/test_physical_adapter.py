from knowledge_engine.loader import loader
from knowledge_engine.adapters.physical import PhysicalAdapter

material = loader.load_material("alginate")

physical = PhysicalAdapter.extract(material)

print("=" * 60)
print("PHYSICAL PROPERTIES")
print("=" * 60)

for section, values in physical.items():
    print()
    print(section.upper())

    if isinstance(values, dict):
        for key, value in values.items():
            print(f"  {key}: {value}")
    else:
        print(values)