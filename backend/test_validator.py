from pathlib import Path

from knowledge_engine.parser import YAMLParser
from knowledge_engine.validator import KnowledgeValidator

BASE_DIR = Path(__file__).resolve().parent.parent

material_path = BASE_DIR / "knowledge_base" / "materials" / "alginate.yaml"

material = YAMLParser.parse(material_path)

valid, errors = KnowledgeValidator.validate(material)

print("Valid:", valid)

if errors:
    print("\nErrors:")
    for error in errors:
        print("-", error)
else:
    print("Knowledge Base validation passed successfully.")