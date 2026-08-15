from knowledge_engine.parser import YAMLParser

material = YAMLParser.parse("../knowledge_base/materials/alginate.yaml")

print(material["Material Information"]["Material Name"])