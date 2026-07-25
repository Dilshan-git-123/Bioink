import { loadYamlFile } from './knowledgeBaseService.js';

// Simple in‑memory cache to avoid repeated file reads.
const materialCache = new Map();

/**
 * Retrieve material information from the knowledge base.
 * @param {string} name - Biomaterial name (e.g., 'Collagen').
 * @returns {Promise<Object>} Parsed material properties.
 */
export async function getMaterialInfo(name) {
  if (!name) {
    throw new Error('Material name is required');
  }
  const key = name.toLowerCase();
  if (materialCache.has(key)) {
    return materialCache.get(key);
  }
  // Build expected filename. Preserve original case for display but use lower‑case for file lookup.
  const filename = `${key}.yaml`;
  const data = await loadYamlFile(filename);
  materialCache.set(key, data);
  return data;
}
