import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaFolderOpen, FaBook, FaRobot, FaClock, FaLightbulb, FaFlask, FaCheckCircle, FaThumbtack, FaEllipsisV } from 'react-icons/fa';
import './Welcome.css';

import welcomeHero from "../../assets/images/welcome-hero.png";
import Modal from '../../components/common/Modal';
import { useProject } from '../../context/ProjectContext';
import { formatTimestamp } from '../../utils/projectStorage';

const Welcome = () => {
    const navigate = useNavigate();
    const {
        createProject,
        recentProjects,
        openProject,
        updateProject,
        duplicateProject,
        isDuplicateName,
        getSuggestions,
        getMostRecentProject
    } = useProject();

    const [greeting, setGreeting] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (!e.target.closest('.project-menu-container')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, []);

    // ── Modal state ──────────────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen]           = useState(false);
    const [modalMode, setModalMode]               = useState('create'); // 'create' or 'rename'
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [projectName, setProjectName]           = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [nameError, setNameError]               = useState('');
    const [nameSuggestions, setNameSuggestions]   = useState([]);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12)      setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else                setGreeting('Good Evening');
    }, []);

    // Recent activity stays static (no backend yet)
    const recentActivity = [
        { id: 1, text: "AI generated 3 new protocols based on tissue selection.", time: "20 mins ago", icon: <FaRobot /> },
        { id: 2, text: "Experiment #102 finished running.",                       time: "1 hour ago",  icon: <FaCheckCircle /> },
    ];

    // ── Modal helpers ────────────────────────────────────────────────────────
    const handleOpenModal = () => {
        setModalMode('create');
        setEditingProjectId(null);
        setProjectName('');
        setProjectDescription('');
        setNameError('');
        setNameSuggestions([]);
        setIsModalOpen(true);
    };

    const handleOpenRenameModal = (e, project) => {
        e.stopPropagation();
        setModalMode('rename');
        setEditingProjectId(project.projectId);
        setProjectName(project.projectName);
        setProjectDescription(project.description || '');
        setNameError('');
        setNameSuggestions([]);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleNameChange = (e) => {
        setProjectName(e.target.value);
        if (nameError) {
            setNameError('');
            setNameSuggestions([]);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setProjectName(suggestion);
        setNameError('');
        setNameSuggestions([]);
    };

    const handleSubmitProject = () => {
        const trimmed = projectName.trim();

        // Validation: empty name
        if (!trimmed) {
            setNameError('Project name is required.');
            setNameSuggestions([]);
            return;
        }

        // Validation: duplicate name (Feature 1 & Feature 2)
        if (isDuplicateName(trimmed, editingProjectId)) {
            setNameError(`A project named "${trimmed}" already exists.`);
            setNameSuggestions(getSuggestions(trimmed));
            return;
        }

        if (modalMode === 'create') {
            createProject(trimmed, projectDescription.trim());
            setIsModalOpen(false);
            navigate('/designer');
        } else {
            updateProject(editingProjectId, { projectName: trimmed, description: projectDescription.trim() });
            setIsModalOpen(false);
        }
    };

    // ── Continue Previous Project (Feature 5) ─────────────────────────────
    const mostRecent = getMostRecentProject();

    const handleContinuePrevious = () => {
        if (!mostRecent) return;
        openProject(mostRecent.projectId);
        navigate('/designer');
    };

    // ── Open existing project from Recent Projects list (Feature 6) ──────
    const handleOpenProject = (projectId) => {
        openProject(projectId);
        navigate('/designer');
    };

    return (
        <div className="welcome-page">
            <div className="welcome-container">

                {/* ── Header ─────────────────────────────────────────── */}
                <header className="welcome-header cinematic-fade-in stagger-1">
                    <div className="greeting-block">
                        <span className="welcome-badge">AI-Powered 3D Bioprinting Platform</span>
                        <h1>{greeting}, Researcher 👋</h1>
                        <p>Welcome back to BioInkAI. Ready to continue today's research?</p>
                    </div>
                    <div className="hero-illustration-container">
                        <img src={welcomeHero} alt="BioInkAI Bioprinter" className="welcome-hero-img" />
                    </div>
                </header>

                {/* ── Action Cards ────────────────────────────────────── */}
                <div className="action-cards-grid">
                    <div className="action-card ai-glow cinematic-fade-in stagger-5" onClick={() => navigate('/assistant')}>
                        <div className="card-icon-wrapper purple">
                            <FaRobot className="card-icon" />
                        </div>
                        <h3>AI Research Assistant</h3>
                        <p>Chat with your personalized AI agent</p>
                    </div>

                    {/* Continue Previous Project — Feature 5 */}
                    <div
                        className={`action-card cinematic-fade-in stagger-3 ${!mostRecent ? 'action-card-disabled' : ''}`}
                        onClick={handleContinuePrevious}
                        title={!mostRecent ? 'No previous project found.' : `Resume: ${mostRecent.projectName}`}
                    >
                        <div className="card-icon-wrapper cyan">
                            <FaFolderOpen className="card-icon" />
                        </div>
                        <h3>Continue Previous Project</h3>
                        <p>
                            {mostRecent
                                ? `Resume: ${mostRecent.projectName}`
                                : 'No previous project found.'}
                        </p>
                    </div>

                    <div className="action-card cinematic-fade-in stagger-4" onClick={() => navigate('/literature')}>
                        <div className="card-icon-wrapper indigo">
                            <FaBook className="card-icon" />
                        </div>
                        <h3>Literature Library</h3>
                        <p>Explore the latest biomaterial papers</p>
                    </div>

                    <div className="action-card cinematic-fade-in stagger-2" onClick={handleOpenModal}>
                        <div className="card-icon-wrapper blue">
                            <FaPlus className="card-icon" />
                        </div>
                        <h3>New Bioink Project</h3>
                        <p>Design a new formulation from scratch</p>
                    </div>
                </div>

                {/* ── Lower Grid ──────────────────────────────────────── */}
                <div className="dashboard-grid">

                    {/* Left Column */}
                    <div className="grid-col-left cinematic-fade-in stagger-6">

                        {/* Recent Projects — Feature 4 */}
                        <div className="dashboard-panel">
                            <div className="panel-header">
                                <h3><FaClock className="panel-icon" /> Recent Projects</h3>
                                <button className="text-link" onClick={() => navigate('/dashboard')}>View All</button>
                            </div>
                            <div className="panel-content list-view">
                                {recentProjects.length === 0 ? (
                                    <p className="empty-state-msg">No projects yet. Create your first one!</p>
                                ) : (
                                    recentProjects.slice(0, 5).map(proj => {
                                        const lm = formatTimestamp(proj.lastModified);
                                        const cr = formatTimestamp(proj.createdAt);
                                        return (
                                            <div
                                                key={proj.projectId}
                                                className="list-item list-item-clickable"
                                                onClick={() => handleOpenProject(proj.projectId)}
                                                title={`Open "${proj.projectName}"`}
                                            >
                                                <div className="item-info">
                                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {proj.isPinned && <FaThumbtack style={{ color: '#F59E0B', fontSize: '12px' }} />}
                                                        {proj.projectName}
                                                    </h4>
                                                    {proj.description && (
                                                        <span className="item-description">{proj.description}</span>
                                                    )}
                                                    <div className="item-meta">
                                                        <span className="meta-row">
                                                            <strong>Created:</strong> {cr.date} · {cr.day} · {cr.time}
                                                        </span>
                                                        <span className="meta-row">
                                                            <strong>Modified:</strong> {lm.date} · {lm.day} · {lm.time}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="item-side-content">
                                                    <span className={`status-badge ${proj.status === 'Completed' ? 'success' : 'pending'}`}>
                                                        {proj.status}
                                                    </span>
                                                    <div className="project-menu-container">
                                                        <button 
                                                            className="icon-action-btn three-dot-btn" 
                                                            title="More Options" 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenMenuId(openMenuId === proj.projectId ? null : proj.projectId);
                                                            }}
                                                        >
                                                            <FaEllipsisV />
                                                        </button>
                                                        {openMenuId === proj.projectId && (
                                                            <div className="project-dropdown-menu">
                                                                <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleOpenProject(proj.projectId); }}>Open Project</button>
                                                                <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleOpenProject(proj.projectId); }}>Continue</button>
                                                                <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleOpenRenameModal(e, proj); }}>Rename</button>
                                                                <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); duplicateProject(proj.projectId); }}>Duplicate</button>
                                                                <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); updateProject(proj.projectId, { isPinned: !proj.isPinned }); }}>{proj.isPinned ? 'Unpin' : 'Pin'}</button>
                                                                {proj.status !== 'Completed' && (
                                                                    <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); updateProject(proj.projectId, { status: 'Completed' }); }}>Mark as Completed</button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Today's Research Insight */}
                        <div className="dashboard-panel premium-insight">
                            <div className="panel-header">
                                <h3><FaLightbulb className="panel-icon highlight" /> Today's Research Insight</h3>
                            </div>
                            <div className="panel-content">
                                <p className="insight-text">
                                    "Recent studies suggest that incorporating 5% nanocellulose into Alginate-based bioinks significantly improves print fidelity without compromising cell viability in cardiac applications."
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="grid-col-right cinematic-fade-in stagger-7">
                        {/* AI Suggestions */}
                        <div className="dashboard-panel ai-suggestions">
                            <div className="panel-header">
                                <h3><FaFlask className="panel-icon" /> AI Suggestions</h3>
                            </div>
                            <div className="panel-content">
                                <ul className="suggestion-list">
                                    <li>Optimize crosslinking time for Project Alpha</li>
                                    <li>Review new viability predictions for PEGDA blend</li>
                                    <li>Run rheology simulation on Draft Formulation #3</li>
                                </ul>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="dashboard-panel">
                            <div className="panel-header">
                                <h3><FaClock className="panel-icon" /> Recent Activity</h3>
                            </div>
                            <div className="panel-content list-view activity-list">
                                {recentActivity.map(act => (
                                    <div key={act.id} className="activity-item">
                                        <div className="activity-icon-sm">{act.icon}</div>
                                        <div className="activity-text">
                                            <p>{act.text}</p>
                                            <span>{act.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── New / Rename Project Modal ────────────────────────────────────── */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={modalMode === 'create' ? "New Bioink Project" : "Rename Project"}>
                <div className="new-project-form">

                    {/* Project Name */}
                    <div className="form-group">
                        <label htmlFor="project-name" className="form-label">
                            Project Name <span className="required-star">*</span>
                        </label>
                        <input
                            id="project-name"
                            type="text"
                            className={`form-input ${nameError ? 'input-error' : ''}`}
                            placeholder="e.g. Alginate-GelMA Cardiac Patch"
                            value={projectName}
                            onChange={handleNameChange}
                            onKeyDown={e => e.key === 'Enter' && handleSubmitProject()}
                            autoFocus
                            maxLength={100}
                        />

                        {/* Validation error + suggestions — Feature 1 */}
                        {nameError && (
                            <div className="validation-block">
                                <p className="error-message">{nameError}</p>
                                {nameSuggestions.length > 0 && (
                                    <div className="name-suggestions">
                                        <span className="suggestions-label">Try one of these:</span>
                                        <div className="suggestions-chips">
                                            {nameSuggestions.map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    className="suggestion-chip"
                                                    onClick={() => handleSuggestionClick(s)}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label htmlFor="project-description" className="form-label">
                            Description <span className="optional-tag">(Optional)</span>
                        </label>
                        <textarea
                            id="project-description"
                            className="form-textarea"
                            placeholder="Briefly describe the goal of this formulation..."
                            value={projectDescription}
                            onChange={e => setProjectDescription(e.target.value)}
                            rows={3}
                            maxLength={500}
                        />
                    </div>

                    {/* Actions */}
                    <div className="form-actions">
                        <button id="cancel-project-btn" className="btn-cancel" onClick={handleCloseModal}>
                            Cancel
                        </button>
                        <button id="create-project-btn" className="btn-create" onClick={handleSubmitProject}>
                            {modalMode === 'create' ? "Create Project" : "Save Changes"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Welcome;
