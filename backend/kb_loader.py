import os
import yaml
from typing import Dict, Any

KB_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'knowledge_base'))

def _load_yaml_file(path: str) -> Dict[str, Any]:
    with open(path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f) or {}

def _load_directory(dir_name: str) -> Dict[str, Any]:
    """Loads all YAML files from a given directory in the knowledge base."""
    target_dir = os.path.join(KB_ROOT, dir_name)
    data = {}
    if not os.path.isdir(target_dir):
        return data
        
    for fname in os.listdir(target_dir):
        if fname.lower().endswith('.yaml') or fname.lower().endswith('.yml'):
            key = os.path.splitext(fname)[0].lower()
            data[key] = _load_yaml_file(os.path.join(target_dir, fname))
            
    return data

class KnowledgeBaseLoader:
    def __init__(self):
        self.materials = {}
        self.combinations = {}
        self.tissues = {}
        self.crosslinkers = {}
        self.protocols = {}
        self.reload()

    def reload(self):
        """Reloads all knowledge base files dynamically from the folders."""
        self.materials = _load_directory('materials')
        self.combinations = _load_directory('combinations')
        self.tissues = _load_directory('tissues')
        self.crosslinkers = _load_directory('crosslinkers')
        self.protocols = _load_directory('protocols')
        
    def get_material(self, name: str) -> Dict[str, Any]:
        return self.materials.get(name.lower(), {})
        
    def get_combination(self, name: str) -> Dict[str, Any]:
        return self.combinations.get(name.lower(), {})
        
    def get_tissue(self, name: str) -> Dict[str, Any]:
        return self.tissues.get(name.lower(), {})
        
    def get_crosslinker(self, name: str) -> Dict[str, Any]:
        return self.crosslinkers.get(name.lower(), {})
        
    def get_protocol(self, name: str) -> Dict[str, Any]:
        return self.protocols.get(name.lower(), {})

# Singleton instance for easy importing across the application
kb = KnowledgeBaseLoader()
