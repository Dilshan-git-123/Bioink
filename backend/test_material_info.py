from knowledge_engine.loader import loader
from knowledge_engine.adapters.material_info import MaterialInfoAdapter

material = loader.load_material("alginate")

info = MaterialInfoAdapter.extract(material)

print("=" * 60)
print("MATERIAL INFORMATION")
print("=" * 60)

for key, value in info.items():
    print(f"{key}:")
    print(value)
    print("-" * 40)