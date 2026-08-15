from knowledge_engine.material_adapter import material_adapter

profile = material_adapter.get_profile("alginate")

print("=" * 60)
print("MATERIAL INFORMATION")
print("=" * 60)
print(profile["material"])

print()

print("=" * 60)
print("PHYSICAL PROPERTIES")
print("=" * 60)
print(profile["physical"])