const API_URL = "http://127.0.0.1:8000";

// ---------------------------------------------------------------------------
// Client-side payload validation
// Returns an array of human-readable error strings (empty = valid).
// ---------------------------------------------------------------------------

function validatePayload(payload) {
    const errors = [];

    // 1. tissue must be a non-empty string
    if (!payload.tissue || typeof payload.tissue !== "string" || !payload.tissue.trim()) {
        errors.push("Tissue type is required and must be a non-empty string.");
    }

    // 2. materials must be a non-empty array
    if (!Array.isArray(payload.materials) || payload.materials.length === 0) {
        errors.push("At least one biomaterial must be added.");
    } else {
        payload.materials.forEach((mat, i) => {
            const label = `Material ${i + 1}`;

            if (!mat.biomaterial || typeof mat.biomaterial !== "string" || !mat.biomaterial.trim()) {
                errors.push(`${label}: "biomaterial" is required and must be a non-empty string.`);
            }
            if (mat.concentration === undefined || mat.concentration === null || typeof mat.concentration !== "number") {
                errors.push(`${label}: "concentration" is required and must be a number.`);
            }
            if (mat.temperature === undefined || mat.temperature === null || typeof mat.temperature !== "number") {
                errors.push(`${label}: "temperature" is required and must be a number.`);
            }
            if (mat.rpm === undefined || mat.rpm === null || typeof mat.rpm !== "number") {
                errors.push(`${label}: "rpm" is required and must be a number.`);
            }
            if (mat.time === undefined || mat.time === null || typeof mat.time !== "number") {
                errors.push(`${label}: "time" is required and must be a number.`);
            }
            if (!mat.method || typeof mat.method !== "string" || !mat.method.trim()) {
                errors.push(`${label}: "method" is required and must be a non-empty string.`);
            }
        });
    }

    // 3. finalMixing must contain all required fields
    const fm = payload.finalMixing;
    if (!fm || typeof fm !== "object") {
        errors.push("Final mixing parameters are required.");
    } else {
        if (fm.temperature === undefined || fm.temperature === null || typeof fm.temperature !== "number") {
            errors.push('finalMixing: "temperature" is required and must be a number.');
        }
        if (fm.rpm === undefined || fm.rpm === null || typeof fm.rpm !== "number") {
            errors.push('finalMixing: "rpm" is required and must be a number.');
        }
        if (fm.time === undefined || fm.time === null || typeof fm.time !== "number") {
            errors.push('finalMixing: "time" is required and must be a number.');
        }
        if (!fm.crosslinking || typeof fm.crosslinking !== "string" || !fm.crosslinking.trim()) {
            errors.push('finalMixing: "crosslinking" is required and must be a non-empty string.');
        }
    }

    return errors;
}

// ---------------------------------------------------------------------------
// Public API function — unchanged contract, adds pre-flight validation + log
// ---------------------------------------------------------------------------

export async function runOptimization(data) {
    // Validate before hitting the network
    const validationErrors = validatePayload(data);
    if (validationErrors.length > 0) {
        // Throw a structured error so the caller can display it
        const err = new Error("Validation failed before sending request.");
        err.validationErrors = validationErrors;
        throw err;
    }

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


