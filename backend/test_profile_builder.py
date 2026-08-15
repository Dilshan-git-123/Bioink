from knowledge_engine.loader import loader
from knowledge_engine.profile_builder import ProfileBuilder

material = loader.load_material("alginate")

profile = ProfileBuilder.build(material)

print("=" * 60)
print("PROFILE SECTIONS")
print("=" * 60)

for section in profile.keys():
    print(section)
