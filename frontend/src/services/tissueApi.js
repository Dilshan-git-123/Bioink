const API_URL = "http://127.0.0.1:8000";

export async function getTissueRecommendation(tissue) {
  const response = await fetch(`${API_URL}/tissue/${tissue}`);

  if (!response.ok) {
    throw new Error("Failed to fetch tissue recommendation");
  }

  return await response.json();
}