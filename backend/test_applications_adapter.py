from knowledge_engine.loader import loader
from knowledge_engine.adapters.applications import ApplicationsAdapter

material = loader.load_material("alginate")

applications = ApplicationsAdapter.extract(material)

print("=" * 60)
print("TISSUE ENGINEERING APPLICATIONS")
print("=" * 60)

for section, values in applications.items():
    print()

    print(section.upper())

    if isinstance(values, dict):
        for key, value in values.items():
            print(f"  {key}: {value}")
    else:
        print(values)