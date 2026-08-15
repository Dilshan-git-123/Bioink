// src/api/predictionService.js
// Service layer for Prediction Engine API calls
import client from "./client";

/**
 * Send prediction request to backend.
 *
 * Forwards the Designer payload unchanged:
 *   { tissue, materials: [...], finalMixing: { ... } }
 *
 * On HTTP errors, extracts the backend detail message so the user sees
 * a meaningful error (e.g. the exact 422 validation message) instead of
 * "Request failed with status code 422".
 *
 * @param {Object} payload - Prediction request payload.
 * @returns {Promise<Object>} - Full prediction response JSON from the server.
 */
export async function predict(payload) {
  try {
    const response = await client.post('/predict', payload);
    return response.data;
  } catch (error) {
    // Surface the backend error detail when available
    if (error.response) {
      const { status, data } = error.response;
      // FastAPI validation errors (422) return { detail: [...] | string }
      let detail = null;
      if (data && data.detail) {
        if (typeof data.detail === 'string') {
          detail = data.detail;
        } else if (Array.isArray(data.detail)) {
          // Pydantic validation error array → extract human-readable messages
          detail = data.detail
            .map(e => {
              const loc = e.loc ? e.loc.slice(1).join(' → ') : '';
              return loc ? `${loc}: ${e.msg}` : e.msg;
            })
            .join('; ');
        } else if (typeof data.detail === 'object' && data.detail.error) {
          detail = data.detail.error;
        }
      }
      const prefix = status === 422
        ? 'Validation error'
        : status === 404
        ? 'Not found'
        : status === 500
        ? 'Server error'
        : `HTTP ${status}`;

      throw new Error(detail ? `${prefix}: ${detail}` : `${prefix} (${status})`);
    }
    // Network error or timeout
    throw new Error(error.message || 'Prediction request failed. Please check your connection.');
  }
}

/**
 * Retrieve an example prediction payload (optional helper).
 */
export async function getPredictionExample() {
  const response = await client.get('/prediction/example');
  return response.data;
}
