const BASE_URL = 'http://127.0.0.1:8000';

/**
 * Fetch all experiments.
 */
export async function getExperiments() {
  const res = await fetch(`${BASE_URL}/experiments`);
  if (!res.ok) throw new Error('Failed to fetch experiments');
  return res.json();
}

/**
 * Fetch a single experiment by ID.
 */
export async function getExperimentById(id) {
  const res = await fetch(`${BASE_URL}/experiments/${id}`);
  if (!res.ok) throw new Error('Experiment not found');
  return res.json();
}

/**
 * Record a new experiment.
 * @param {Object} data - Experiment payload.
 */
export async function createExperiment(data) {
  const res = await fetch(`${BASE_URL}/experiments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create experiment');
  return res.json();
}

/**
 * Update an experiment's notes or favorite flag.
 * @param {string} id
 * @param {{ user_notes?: string, is_favorite?: boolean }} updates
 */
export async function updateExperiment(id, updates) {
  const res = await fetch(`${BASE_URL}/experiments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update experiment');
  return res.json();
}

/**
 * Delete an experiment permanently.
 * @param {string} id
 */
export async function deleteExperiment(id) {
  const res = await fetch(`${BASE_URL}/experiments/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete experiment');
  return res.json();
}

/**
 * Duplicate an experiment, creating a new record with a fresh UUID.
 * @param {string} id
 */
export async function duplicateExperiment(id) {
  const res = await fetch(`${BASE_URL}/experiments/${id}/duplicate`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to duplicate experiment');
  return res.json();
}


