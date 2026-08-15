from knowledge_engine.loader import loader

material = loader.load_material("alginate")

print("Material Name:")
print(material["Material Information"]["Material Name"])

print()

print("Successfully loaded through Knowledge Engine.")