import React, { createContext, useState, useContext, useCallback } from 'react';
import {
    loadProjects,
    saveProjects,
    buildTimestamp,
    deleteProjectFromStorage
} from '../utils/projectStorage';

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
    // Initialise from localStorage on first render
    const [projects, setProjects] = useState(() => loadProjects());
    const [activeProject, setActiveProject] = useState(null);

    // ─── Internal helper: persist + set state atomically ─────────────────────
    const _persist = useCallback((updated) => {
        setProjects(updated);
        saveProjects(updated);
    }, []);

    // ─── Duplicate name check (case-insensitive) ──────────────────────────────
    /**
     * Returns true if a project with this name already exists.
     * Pass `excludeId` to ignore the project currently being edited.
     */
    const isDuplicateName = useCallback((name, excludeId = null) => {
        const lower = name.trim().toLowerCase();
        return projects.some(p =>
            p.projectName.toLowerCase() === lower &&
            p.projectId !== excludeId
        );
    }, [projects]);

    /**
     * Generate up to 3 unique name suggestions for a duplicate name.
     * e.g. "Apple" → ["Apple 1", "Apple 2", "Apple 3"]
     */
    const getSuggestions = useCallback((name) => {
        const base = name.trim();
        const taken = new Set(
            projects.map(p => p.projectName.toLowerCase())
        );
        const suggestions = [];
        let i = 1;
        while (suggestions.length < 3) {
            const candidate = `${base} ${i}`;
            if (!taken.has(candidate.toLowerCase())) {
                suggestions.push(candidate);
            }
            i++;
            if (i > 100) break; // safety cap
        }
        return suggestions;
    }, [projects]);

    // ─── Create a brand-new project ───────────────────────────────────────────
    const createProject = useCallback((name, description) => {
        const ts = buildTimestamp();
        const newProject = {
            projectId:       Date.now().toString(),
            projectName:     name.trim(),
            description:     (description || '').trim(),
            status:          'In Progress',
            isPinned:        false,
            createdAt:       ts,          // { iso, date, day, time }
            lastModified:    ts,
            selectedTissue:  null,
            materials:       [],
            finalMixing:     null,
            prediction:      null,
            protocol:        null
        };
        const updated = [...projects, newProject];
        _persist(updated);
        setActiveProject(newProject);
        return newProject;
    }, [projects, _persist]);

    // ─── Update any fields on an existing project ─────────────────────────────
    /**
     * Merges `updates` into the project and refreshes lastModified.
     * Also keeps activeProject in sync if it is the same project.
     */
    const updateProject = useCallback((projectId, updates) => {
        const ts = buildTimestamp();
        let updatedProject = null;

        const updated = projects.map(proj => {
            if (proj.projectId === projectId) {
                // Feature 1: Automatic Project Status to 'In Progress' on Designer edits
                const isDesignerEdit = ['selectedTissue', 'materials', 'finalMixing', 'prediction', 'protocol'].some(k => k in updates);
                const newStatus = isDesignerEdit ? 'In Progress' : (updates.status || proj.status || 'In Progress');
                
                updatedProject = { 
                    ...proj, 
                    ...updates, 
                    status: newStatus,
                    isPinned: updates.isPinned !== undefined ? updates.isPinned : (proj.isPinned || false),
                    lastModified: ts 
                };
                return updatedProject;
            }
            return proj;
        });

        _persist(updated);

        if (updatedProject && activeProject?.projectId === projectId) {
            setActiveProject(updatedProject);
        }
    }, [projects, activeProject, _persist]);

    // ─── Open an existing project in Designer ─────────────────────────────────
    const openProject = useCallback((projectId) => {
        const found = projects.find(p => p.projectId === projectId);
        if (found) setActiveProject(found);
        return found || null;
    }, [projects]);

    // ─── Duplicate (Clone) Project (Feature 3) ──────────────────────────────
    const duplicateProject = useCallback((projectId) => {
        const source = projects.find(p => p.projectId === projectId);
        if (!source) return null;

        const ts = buildTimestamp();
        const baseName = `${source.projectName} Copy`;
        let newName = baseName;
        
        // Find a unique name
        const taken = new Set(projects.map(p => p.projectName.toLowerCase()));
        let i = 2;
        while (taken.has(newName.toLowerCase())) {
            newName = `${baseName} ${i}`;
            i++;
        }

        const newProject = {
            ...source,
            projectId:       Date.now().toString(),
            projectName:     newName,
            status:          'In Progress',
            isPinned:        false,
            createdAt:       ts,
            lastModified:    ts
        };

        const updated = [...projects, newProject];
        _persist(updated);
        return newProject;
    }, [projects, _persist]);

    // ─── Most recently modified project ───────────────────────────────────────
    const getMostRecentProject = useCallback(() => {
        if (!projects.length) return null;
        return [...projects].sort((a, b) => {
            const aIso = a.lastModified?.iso ?? a.lastModified ?? '';
            const bIso = b.lastModified?.iso ?? b.lastModified ?? '';
            return bIso.localeCompare(aIso);
        })[0];
    }, [projects]);

    // ─── Projects sorted pinned-first, then newest-first (Feature 4) ─────────
    const recentProjects = [...projects].map(p => ({ ...p, isPinned: p.isPinned || false })).sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const aIso = a.lastModified?.iso ?? a.lastModified ?? '';
        const bIso = b.lastModified?.iso ?? b.lastModified ?? '';
        return bIso.localeCompare(aIso);
    });

    // ─── Delete helper (UI not exposed — prepared for future use) ─────────────
    const deleteProject = useCallback((projectId) => {
        const updated = deleteProjectFromStorage(projects, projectId);
        setProjects(updated);
        if (activeProject?.projectId === projectId) setActiveProject(null);
    }, [projects, activeProject]);

    return (
        <ProjectContext.Provider value={{
            projects,
            recentProjects,
            activeProject,
            setActiveProject,
            createProject,
            updateProject,
            openProject,
            duplicateProject,
            isDuplicateName,
            getSuggestions,
            getMostRecentProject,
            deleteProject          // prepared, no UI
        }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
