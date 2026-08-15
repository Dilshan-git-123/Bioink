"""
===============================================================================
BioInkAI System Health Check
===============================================================================

Checks:

✓ Folder Structure
✓ Adapter Files
✓ Test Files
✓ __init__.py exports
✓ Profile Builder sections

===============================================================================
"""

import os

BASE = os.path.dirname(os.path.abspath(__file__))

ADAPTER_DIR = os.path.join(BASE, "knowledge_engine", "adapters")

TESTS = [
    "test_material_info.py",
    "test_physical_adapter.py",
    "test_chemical_adapter.py",
    "test_preparation_adapter.py",
    "test_printing_adapter.py",
    "test_crosslinking_adapter.py",
    "test_biological_adapter.py",
    "test_mechanical_adapter.py",
]

ADAPTERS = [
    "material_info.py",
    "physical.py",
    "chemical.py",
    "preparation.py",
    "printing.py",
    "crosslinking.py",
    "biological.py",
    "mechanical.py",
]

print("=" * 70)
print("BIOINKAI KNOWLEDGE ENGINE HEALTH CHECK")
print("=" * 70)

print("\nADAPTER FILES")
print("-" * 70)

for file in ADAPTERS:
    path = os.path.join(ADAPTER_DIR, file)

    if os.path.exists(path):
        print(f"✅ {file}")
    else:
        print(f"❌ {file}")

print("\nTEST FILES")
print("-" * 70)

for file in TESTS:
    path = os.path.join(BASE, file)

    if os.path.exists(path):
        print(f"✅ {file}")
    else:
        print(f"❌ {file}")

print("\n__init__.py")
print("-" * 70)

init_path = os.path.join(ADAPTER_DIR, "__init__.py")

if os.path.exists(init_path):

    text = open(init_path, encoding="utf8").read()

    names = [
        "MaterialInfoAdapter",
        "PhysicalAdapter",
        "ChemicalAdapter",
        "PreparationAdapter",
        "PrintingAdapter",
        "CrosslinkingAdapter",
        "BiologicalAdapter",
        "MechanicalAdapter",
    ]

    for name in names:

        if name in text:
            print(f"✅ {name}")

        else:
            print(f"❌ {name}")

else:
    print("❌ __init__.py missing")

print("\nPROFILE BUILDER")
print("-" * 70)

pb = os.path.join(BASE, "knowledge_engine", "profile_builder.py")

if os.path.exists(pb):

    text = open(pb, encoding="utf8").read()

    sections = [
        '"material"',
        '"physical"',
        '"chemical"',
        '"preparation"',
        '"printing"',
        '"crosslinking"',
        '"biological"',
        '"mechanical"',
    ]

    for section in sections:

        if section in text:
            print(f"✅ {section}")

        else:
            print(f"❌ {section}")

else:
    print("❌ profile_builder.py missing")

print("\n" + "=" * 70)
print("HEALTH CHECK COMPLETE")
print("=" * 70)