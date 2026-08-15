"""
===============================================================================
BioInkAI Knowledge Engine - Cache
===============================================================================

Purpose:
    Stores parsed and validated knowledge objects in memory to avoid
    repeatedly reading YAML files from disk.

Responsibilities:
    ✓ Store data
    ✓ Retrieve data
    ✓ Check existence
    ✓ Remove data
    ✓ Clear cache

Not Responsible For:
    ✗ Reading YAML
    ✗ Validation
    ✗ Prediction
===============================================================================
"""

from typing import Any, Dict


class KnowledgeCache:
    """Simple in-memory cache."""

    def __init__(self):
        self._cache: Dict[str, Any] = {}

    def set(self, key: str, value: Any) -> None:
        """Store an object in the cache."""
        self._cache[key] = value

    def get(self, key: str) -> Any:
        """Retrieve an object from the cache."""
        return self._cache.get(key)

    def exists(self, key: str) -> bool:
        """Check whether an object exists in the cache."""
        return key in self._cache

    def remove(self, key: str) -> None:
        """Remove an object from the cache."""
        self._cache.pop(key, None)

    def clear(self) -> None:
        """Clear the entire cache."""
        self._cache.clear()

    def size(self) -> int:
        """Return the number of cached objects."""
        return len(self._cache)


# Singleton cache instance
cache = KnowledgeCache()