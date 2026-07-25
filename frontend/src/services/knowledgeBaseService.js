import yaml from 'js-yaml';

// Dynamically import raw YAML files from the knowledge base.
// Vite's import.meta.glob is used to create a map of file paths to loaders.
// The `as: 'raw'` option returns the file content as a string.
const yamlModules = import.meta.glob('../../knowledge_base/materials/*.yaml', { as: 'raw', eager: false });

/**
 * Load and parse a YAML file from the knowledge base.
 * @param {string} filename - The YAML file name (e.g., 'collagen.yaml').
 * @returns {Promise<Object>} Parsed YAML object.
 * @throws If the file is not found or parsing fails.
 */
export async function loadYamlFile(filename) {
  // Find the matching module path.
  const path = Object.keys(yamlModules).find(p => p.endsWith(`/${filename}`));
  if (!path) {
    throw new Error(`YAML file not found: ${filename}`);
  }
  const loader = yamlModules[path];
  const raw = await loader();
  try {
    return yaml.load(raw);
  } catch (e) {
    console.error('YAML parsing error for', filename, e);
    throw e;
  }
}
