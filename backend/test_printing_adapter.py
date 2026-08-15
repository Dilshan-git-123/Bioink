from knowledge_engine.loader import loader
from knowledge_engine.adapters.printing import PrintingAdapter

material = loader.load_material("alginate")

printing = PrintingAdapter.extract(material)

print("=" * 60)
print("PRINTING PROPERTIES")
print("=" * 60)

for section, values in printing.items():
    print()

    print(section.upper())

    if isinstance(values, dict):
        for key, value in values.items():
            print(f"  {key}: {value}")
    else:
        print(values)
