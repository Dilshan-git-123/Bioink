/**
 * Standardizes raw API or JavaScript errors into user-friendly messages.
 * Preserves the original error internally via console.error for developer debugging.
 */
export const parseError = (error, defaultMessage = "Something went wrong while processing your request. Please try again.") => {
    // Internally log the exact error structure for debugging
    console.error("[BioInkAI System Error]:", error);

    // Handle Network / Fetch errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return "Unable to connect to the BioInkAI server. Please check your connection and try again.";
    }
    
    // Handle specific structured errors from our custom fetch wrappers
    if (error?.status) {
        if (error.status === 401 || error.status === 403) {
            return "You do not have permission to perform this action.";
        }
        if (error.status === 404) {
            return "The requested resource could not be found.";
        }
        if (error.status === 422) {
            return "Please complete all required fields before proceeding.";
        }
        if (error.status >= 500) {
            return "Something went wrong on the server while processing your request. Please try again later.";
        }
    }

    // FastAPI detailed 422 errors (usually an array of detail locators)
    if (error?.detail && Array.isArray(error.detail)) {
        return "Please complete all required fields correctly before proceeding.";
    }

    // Generic fallback for objects with a custom message that isn't a technical stack trace
    if (error?.message && typeof error.message === 'string') {
        // Prevent exposing internal JS/React/Fetch messages if they look technical
        const technicalTerms = ['networkerror', 'failed to fetch', 'undefined', 'null', 'internal server error', '422', 'is not a function', 'json'];
        const isTechnical = technicalTerms.some(term => error.message.toLowerCase().includes(term));
        if (!isTechnical) {
            return error.message;
        }
    }

    return defaultMessage;
};
