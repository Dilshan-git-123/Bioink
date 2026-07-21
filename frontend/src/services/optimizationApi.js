const API_URL = "http://127.0.0.1:8000";

export async function runOptimization(data) {

    const response = await fetch(`${API_URL}/optimize`, {

        method: "POST",

        headers: {

            "Content-Type": "application/json"

        },

        body: JSON.stringify(data)

    });

    if (!response.ok) {

        throw new Error("Optimization failed.");

    }

    return await response.json();

}
