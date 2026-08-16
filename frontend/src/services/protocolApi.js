const API_URL = "http://127.0.0.1:8000";

export const generateProtocol = async (payload) => {

  const response = await fetch(`${API_URL}/protocol`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();

    console.error(
  "Backend Validation Error:",
  JSON.stringify(errorData, null, 2)
);

    throw errorData;
  }

  return await response.json();
};

export const generateReferenceProtocol = async (payload) => {
  const response = await fetch(`${API_URL}/protocol/reference`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error(
      "Backend Validation Error:",
      JSON.stringify(errorData, null, 2)
    );
    throw errorData;
  }

  return await response.json();
};

export const searchLiterature = async (payload) => {
  const response = await fetch(`${API_URL}/literature/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json();
    console.error("Literature search error:", JSON.stringify(errorData, null, 2));
    throw errorData;
  }
  return await response.json();
};

export const generateLiteratureReferenceProtocol = async (payload) => {
  const response = await fetch(`${API_URL}/protocol/literature-reference`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json();
    console.error("Literature reference protocol error:", JSON.stringify(errorData, null, 2));
    throw errorData;
  }
  return await response.json();
};