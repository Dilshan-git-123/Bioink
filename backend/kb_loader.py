import os
import yaml
from typing import Dict, Any

KB_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'knowledge_base'))

def _load_yaml_file(path: str) -> Dict[str, Any]:
    with open(path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f) or {}

def load_biomaterials() -> Dict[str, Any]:
    biomaterials_dir = os.path.join(KB_ROOT, 'biomaterials')
    materials = {}
    if not os.path.isdir(biomaterials_dir):
        return materials
    for fname in os.listdir(biomaterials_dir):
        if fname.lower().endswith('.yaml') or fname.lower().endswith('.yml'):
            key = os.path.splitext(fname)[0].lower()
            materials[key] = _load_yaml_file(os.path.join(biomaterials_dir, fname))
    return materials

def load_rules() -> Dict[str, Any]:
    rules_dir = os.path.join(KB_ROOT, 'rules')
    rules = {}
    if not os.path.isdir(rules_dir):
        return rules
    for fname in os.listdir(rules_dir):
        if fname.lower().endswith('.yaml') or fname.lower().endswith('.yml'):
            rule_set = _load_yaml_file(os.path.join(rules_dir, fname))
            if isinstance(rule_set, dict) and 'rules' in rule_set:
                for rule in rule_set['rules']:
                    rule_id = rule.get('rule_id')
                    if rule_id:
                        rules[rule_id] = rule
    return rules

BIOMATERIALS_CACHE = load_biomaterials()
RULES_CACHE = load_rules()

def get_material_profile(name: str) -> Dict[str, Any]:
    return BIOMATERIALS_CACHE.get(name.lower(), {})

def get_all_rules() -> Dict[str, Any]:
    return RULES_CACHE
