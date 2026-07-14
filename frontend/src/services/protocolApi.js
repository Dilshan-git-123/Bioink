const API_URL = "http://127.0.0.1:8000";

export const generateProtocol = async (payload) => {

  console.log("Sending Protocol Payload:", payload);

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