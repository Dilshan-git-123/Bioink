import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import {
    loadProjects,
    saveProjects,
    buildTimestamp,
    deleteProjectFromStorage
} from '../utils/projectStorage';
import {
    fetchProjects as apiFetchProjects,
    createBackendProject as apiCreateProject,
    updateBackendProject as apiUpdateProject,
    deleteBackendProject as apiDeleteProject
} from '../services/projectApi';

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    
    const saveTimeoutRef = useRef({});

    // ─── Load projects from Backend API on mount ────────────────────────────
    const loadAllProjects = useCallback(async () => {
        try {
            const data = await apiFetchProjects();
            setProjects(data);
        } catch (err) {
            console.error('[BioInkAI] Failed to fetch projects from API, falling back to localStorage:', err);
            setProjects(loadProjects());
        }
    }, []);

    useEffect(() => {
        loadAllProjects();
    }, [loadAllProjects]);

    // ─── Internal helper: persist to localStorage as fallback ─────────────────
    const _persistLocal = useCallback((updated) => {
        saveProjects(updated);
    }, []);

    // ─── Duplicate name check (case-insensitive) ──────────────────────────────
    const isDuplicateName = useCallback((name, excludeId = null) => {
        const lower = name.trim().toLowerCase();
        return projects.some(p =>
            p.projectName.toLowerCase() === lower &&
            p.projectId !== excludeId
        );
    }, [projects]);

    // ─── Generate name suggestions ───────────────────────────────────────────
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
            if (i > 100) break;
        }
        return suggestions;
    }, [projects]);

    // ─── Create a brand-new project ───────────────────────────────────────────
    const createProject = useCallback(async (name, description) => {
        const ts = buildTimestamp();
        const tempId = 'temp-' + Date.now();
        const tempProject = {
            projectId:       tempId,
            projectName:     name.trim(),
            description:     (description || '').trim(),
            status:          'Draft',
            isPinned:        false,
            createdAt:       ts,
            lastModified:    ts,
            selectedTissue:  null,
            materials:       [],
            finalMixing:     null,
            prediction:      null,
            protocol:        null
        };

        // Instantly update UI state for responsiveness
        setProjects(prev => [...prev, tempProject]);
        setActiveProject(tempProject);

        try {
            const created = await apiCreateProject(tempProject);
            setProjects(prev => prev.map(p => p.projectId === tempId ? created : p));
            setActiveProject(created);
            
            // Also update localStorage backup
            const allLocal = loadProjects();
            saveProjects([...allLocal, created]);
            
            return created;
        } catch (err) {
            console.error('[BioInkAI] Failed to create project on backend, using local:', err);
            const realLocalId = Date.now().toString();
            const localProj = { ...tempProject, projectId: realLocalId };
            
            setProjects(prev => prev.map(p => p.projectId === tempId ? localProj : p));
            setActiveProject(localProj);
            
            const allLocal = loadProjects();
            saveProjects([...allLocal, localProj]);
            return localProj;
        }
    }, []);

    // ─── Update any fields on an existing project (with debounced API sync) ──
    const updateProject = useCallback((projectId, updates) => {
        const ts = buildTimestamp();
        let updatedProject = null;

        // 1. Instant local state updates
        setProjects(prev => {
            const updated = prev.map(proj => {
                if (proj.projectId === projectId) {
                    const isDesignerEdit = ['selectedTissue', 'materials', 'finalMixing', 'prediction', 'protocol'].some(k => k in updates);
                    const newStatus = isDesignerEdit ? 'In Progress' : (updates.status || proj.status || 'Draft');
                    
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
            _persistLocal(updated);
            return updated;
        });

        setActiveProject(prev => {
            if (prev && prev.projectId === projectId) {
                const isDesignerEdit = ['selectedTissue', 'materials', 'finalMixing', 'prediction', 'protocol'].some(k => k in updates);
                const newStatus = isDesignerEdit ? 'In Progress' : (updates.status || prev.status || 'Draft');
                return {
                    ...prev,
                    ...updates,
                    status: newStatus,
                    isPinned: updates.isPinned !== undefined ? updates.isPinned : (prev.isPinned || false),
                    lastModified: ts
                };
            }
            return prev;
        });

        // 2. Debounced API sync to backend
        if (projectId.startsWith('temp-')) return; // Wait until temporary project is created

        if (saveTimeoutRef.current[projectId]) {
            clearTimeout(saveTimeoutRef.current[projectId]);
        }

        setIsSaving(true);
        saveTimeoutRef.current[projectId] = setTimeout(async () => {
            delete saveTimeoutRef.current[projectId];
            try {
                // Get the latest up-to-date project fields
                let latestProj = null;
                setProjects(prev => {
                    latestProj = prev.find(p => p.projectId === projectId);
                    return prev;
                });
                
                if (latestProj) {
                    await apiUpdateProject(projectId, latestProj);
                    setLastSaved(new Date().toLocaleTimeString());
                }
            } catch (err) {
                console.error(`[BioInkAI] Failed auto-saving project ${projectId} to backend:`, err);
            } finally {
                setIsSaving(false);
            }
        }, 1200); // 1.2-second debounce
    }, [_persistLocal]);

    // ─── Manual Save Project (Immediate sync) ──────────────────────────────
    const saveActiveProject = useCallback(async (projectId) => {
        if (!projectId || projectId.startsWith('temp-')) return false;

        if (saveTimeoutRef.current[projectId]) {
            clearTimeout(saveTimeoutRef.current[projectId]);
            delete saveTimeoutRef.current[projectId];
        }

        setIsSaving(true);
        try {
            let latestProj = null;
            setProjects(prev => {
                latestProj = prev.find(p => p.projectId === projectId);
                return prev;
            });

            if (latestProj) {
                await apiUpdateProject(projectId, latestProj);
                setLastSaved(new Date().toLocaleTimeString());
                return true;
            }
            return false;
        } catch (err) {
            console.error('[BioInkAI] Manual save failed:', err);
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, []);

    // ─── Open an existing project ───────────────────────────────────────────
    const openProject = useCallback((projectId) => {
        const found = projects.find(p => p.projectId === projectId);
        if (found) setActiveProject(found);
        return found || null;
    }, [projects]);

    // ─── Duplicate (Clone) Project ──────────────────────────────────────────
    const duplicateProject = useCallback(async (projectId) => {
        const source = projects.find(p => p.projectId === projectId);
        if (!source) return null;

        const ts = buildTimestamp();
        const baseName = `${source.projectName} Copy`;
        let newName = baseName;
        
        const taken = new Set(projects.map(p => p.projectName.toLowerCase()));
        let i = 2;
        while (taken.has(newName.toLowerCase())) {
            newName = `${baseName} ${i}`;
            i++;
        }

        const newProjectTemplate = {
            ...source,
            projectName:     newName,
            status:          'Draft',
            isPinned:        false,
            createdAt:       ts,
            lastModified:    ts
        };

        try {
            const created = await apiCreateProject(newProjectTemplate);
            setProjects(prev => [...prev, created]);
            
            const allLocal = loadProjects();
            saveProjects([...allLocal, created]);
            return created;
        } catch (err) {
            console.error('[BioInkAI] Failed to duplicate project on backend:', err);
            const newProject = {
                ...newProjectTemplate,
                projectId: Date.now().toString()
            };
            const updated = [...projects, newProject];
            setProjects(updated);
            saveProjects(updated);
            return newProject;
        }
    }, [projects]);

    // ─── Delete Project ──────────────────────────────────────────────────────
    const deleteProject = useCallback(async (projectId) => {
        try {
            if (!projectId.startsWith('temp-')) {
                await apiDeleteProject(projectId);
            }
            setProjects(prev => {
                const updated = prev.filter(p => p.projectId !== projectId);
                saveProjects(updated);
                return updated;
            });
            if (activeProject?.projectId === projectId) {
                setActiveProject(null);
            }
        } catch (err) {
            console.error('[BioInkAI] Failed to delete project on backend, using local:', err);
            setProjects(prev => {
                const updated = prev.filter(p => p.projectId !== projectId);
                saveProjects(updated);
                return updated;
            });
            if (activeProject?.projectId === projectId) {
                setActiveProject(null);
            }
        }
    }, [projects, activeProject]);

    // ─── Most recently modified project ───────────────────────────────────────
    const getMostRecentProject = useCallback(() => {
        if (!projects.length) return null;
        return [...projects].sort((a, b) => {
            const aIso = a.lastModified?.iso ?? a.lastModified ?? '';
            const bIso = b.lastModified?.iso ?? b.lastModified ?? '';
            return bIso.localeCompare(aIso);
        })[0];
    }, [projects]);

    // ─── Projects sorted pinned-first, then newest-first ─────────────────────
    const recentProjects = [...projects].map(p => ({ ...p, isPinned: p.isPinned || false })).sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const aIso = a.lastModified?.iso ?? a.lastModified ?? '';
        const bIso = b.lastModified?.iso ?? b.lastModified ?? '';
        return bIso.localeCompare(aIso);
    });

    return (
        <ProjectContext.Provider value={{
            projects,
            recentProjects,
            activeProject,
            isSaving,
            lastSaved,
            setActiveProject,
            createProject,
            updateProject,
            saveActiveProject,
            openProject,
            duplicateProject,
            isDuplicateName,
            getSuggestions,
            getMostRecentProject,
            deleteProject,
            loadAllProjects
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
