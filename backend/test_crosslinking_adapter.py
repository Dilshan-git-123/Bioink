from knowledge_engine.loader import loader
from knowledge_engine.adapters.crosslinking import CrosslinkingAdapter

material = loader.load_material("alginate")

crosslinking = CrosslinkingAdapter.extract(material)

print("=" * 60)
print("CROSSLINKING INFORMATION")
print("=" * 60)

for section, values in crosslinking.items():
    print()

    print(section.upper())

    if isinstance(values, dict):
        for key, value in values.items():
            print(f"  {key}: {value}")
    else:
        print(values)
