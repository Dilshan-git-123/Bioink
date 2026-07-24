/**
 * projectStorage.js
 * Reusable localStorage helpers for the BioInkAI Project Manager.
 * All functions are pure and have no side-effects beyond localStorage.
 */

const STORAGE_KEY = 'bioinkAI_projects';

/** Load all projects from localStorage. Returns an empty array if none found. */
export const loadProjects = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

/** Persist the full projects array to localStorage. */
export const saveProjects = (projects) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (err) {
        console.error('[BioInkAI] Failed to persist projects:', err);
    }
};

/** Update a single project by ID and save. Returns the updated list. */
export const updateProjectInStorage = (projects, projectId, updates) => {
    const updated = projects.map(p =>
        p.projectId === projectId
            ? { ...p, ...updates, lastModified: buildTimestamp() }
            : p
    );
    saveProjects(updated);
    return updated;
};

/** Prepare helper — does not expose a UI. */
export const deleteProjectFromStorage = (projects, projectId) => {
    const updated = projects.filter(p => p.projectId !== projectId);
    saveProjects(updated);
    return updated;
};

/**
 * Build a rich timestamp object.
 * Returns { iso, date, day, time }
 */
export const buildTimestamp = () => {
    const now = new Date();
    return {
        iso: now.toISOString(),
        date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        day:  now.toLocaleDateString('en-US', { weekday: 'long' }),
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
};

/**
 * Format a timestamp object for display.
 * Accepts either an ISO string (legacy) or a timestamp object.
 */
export const formatTimestamp = (ts) => {
    if (!ts) return { date: '—', day: '—', time: '—' };
    if (typeof ts === 'string') {
        // Legacy ISO string — convert on the fly
        const d = new Date(ts);
        return {
            date: d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            day:  d.toLocaleDateString('en-US', { weekday: 'long' }),
            time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        };
    }
    return ts; // already a { date, day, time } object
};
