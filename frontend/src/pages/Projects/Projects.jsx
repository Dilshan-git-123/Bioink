import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaPlus, 
  FaSearch, 
  FaFolderOpen, 
  FaTrashAlt, 
  FaCopy, 
  FaCheckCircle, 
  FaChevronDown,
  FaFileAlt,
  FaClock
} from "react-icons/fa";
import { useProject } from "../../context/ProjectContext";
import { formatTimestamp } from "../../utils/projectStorage";
import Modal from "../../components/common/Modal";
import "./Projects.css";

function Projects() {
  const navigate = useNavigate();
  const {
    projects,
    createProject,
    deleteProject,
    duplicateProject,
    updateProject,
    openProject,
    isDuplicateName,
    getSuggestions
  } = useProject();

  // Search & Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc"); // name-asc, name-desc, date-asc, date-desc
  const [statusFilter, setStatusFilter] = useState("all"); // all, Draft, In Progress, Completed

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameSuggestions, setNameSuggestions] = useState([]);

  // Create Project modal handlers
  const handleOpenModal = () => {
    setProjectName("");
    setProjectDescription("");
    setNameError("");
    setNameSuggestions([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleNameChange = (e) => {
    setProjectName(e.target.value);
    if (nameError) {
      setNameError("");
      setNameSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setProjectName(suggestion);
    setNameError("");
    setNameSuggestions([]);
  };

  const handleSubmitProject = async () => {
    const trimmed = projectName.trim();
    if (!trimmed) {
      setNameError("Project name is required.");
      setNameSuggestions([]);
      return;
    }

    if (isDuplicateName(trimmed)) {
      setNameError(`A project named "${trimmed}" already exists.`);
      setNameSuggestions(getSuggestions(trimmed));
      return;
    }

    await createProject(trimmed, projectDescription.trim());
    setIsModalOpen(false);
    navigate("/designer");
  };

  // Action Handlers
  const handleOpenProject = (id) => {
    openProject(id);
    navigate("/designer");
  };

  const handleDuplicateProject = async (e, id) => {
    e.stopPropagation();
    await duplicateProject(id);
  };

  const handleDeleteProject = async (e, id, name) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete project "${name}"?`)) {
      await deleteProject(id);
    }
  };

  const handleToggleStatus = (e, id, currentStatus) => {
    e.stopPropagation();
    const newStatus = currentStatus === "Completed" ? "In Progress" : "Completed";
    updateProject(id, { status: newStatus });
  };

  // Filter & Sort logic
  const filteredProjects = projects.filter((proj) => {
    const matchesSearch = proj.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (proj.description && proj.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (proj.selectedTissue && proj.selectedTissue.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesStatus = statusFilter === "all" || proj.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === "name-asc") {
      return a.projectName.localeCompare(b.projectName);
    } else if (sortBy === "name-desc") {
      return b.projectName.localeCompare(a.projectName);
    } else if (sortBy === "date-asc") {
      const aTime = a.lastModified?.iso || a.lastModified || "";
      const bTime = b.lastModified?.iso || b.lastModified || "";
      return aTime.localeCompare(bTime);
    } else { // date-desc
      const aTime = a.lastModified?.iso || a.lastModified || "";
      const bTime = b.lastModified?.iso || b.lastModified || "";
      return bTime.localeCompare(aTime);
    }
  });

  return (
    <div className="projects-page workspace">
      <div className="projects-header-section">
        <div>
          <h1>📁 Project Management</h1>
          <p>Create, organize, and resume your 3D bioprinting bioink design projects.</p>
        </div>
        <button className="primary-btn new-project-btn" onClick={handleOpenModal}>
          <FaPlus style={{ marginRight: "8px" }} /> New Project
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="controls-panel">
        <div className="search-bar-wrapper">
          <FaSearch className="search-icon-projects" />
          <input
            type="text"
            className="search-input-projects"
            placeholder="Search projects by name, tissue, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters-group">
          {/* Status Filter */}
          <div className="filter-select-wrapper">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="control-select"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Sort Control */}
          <div className="filter-select-wrapper">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="control-select"
            >
              <option value="date-desc">Newest Modified</option>
              <option value="date-asc">Oldest Modified</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {sortedProjects.length === 0 ? (
        <div className="empty-projects-state">
          <div className="empty-state-icon">
            <FaFolderOpen />
          </div>
          <h3>No Projects Found</h3>
          <p>Try adjusting your search terms or filters, or create a brand new project.</p>
          <button className="secondary-btn" onClick={handleOpenModal}>
            Create New Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {sortedProjects.map((proj) => {
            const lastMod = formatTimestamp(proj.lastModified);
            const crDate = formatTimestamp(proj.createdAt);
            
            return (
              <div 
                key={proj.projectId} 
                className="project-card"
                onClick={() => handleOpenProject(proj.projectId)}
              >
                <div className="project-card-header">
                  <div className="project-card-title-group">
                    <span className="project-folder-icon">📁</span>
                    <h3 className="project-card-title" title={proj.projectName}>
                      {proj.projectName}
                    </h3>
                  </div>
                  <span className={`status-badge-projects ${proj.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {proj.status}
                  </span>
                </div>

                <p className="project-card-desc">
                  {proj.description || "No description provided."}
                </p>

                <div className="project-card-details">
                  <div className="detail-row">
                    <span className="detail-label">Tissue Type:</span>
                    <span className="detail-value text-highlight">
                      {proj.selectedTissue || "None Selected"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Biomaterials:</span>
                    <span className="detail-value">
                      {proj.materials && proj.materials.length > 0
                        ? proj.materials.map(m => m.biomaterial || "Unnamed").join(", ")
                        : "None"}
                    </span>
                  </div>
                </div>

                <div className="project-card-meta">
                  <span className="meta-time" title={`Created: ${crDate.date} ${crDate.time}`}>
                    <FaClock style={{ marginRight: "4px" }} />
                    Modified {lastMod.date} · {lastMod.time}
                  </span>
                </div>

                <div className="project-card-actions">
                  <button 
                    className="card-action-btn open-btn"
                    onClick={(e) => { e.stopPropagation(); handleOpenProject(proj.projectId); }}
                    title="Open Project"
                  >
                    Open
                  </button>
                  
                  <div className="card-action-icons">
                    <button 
                      className={`card-action-btn-icon complete-btn ${proj.status === "Completed" ? "is-completed" : ""}`}
                      onClick={(e) => handleToggleStatus(e, proj.projectId, proj.status)}
                      title={proj.status === "Completed" ? "Mark as In Progress" : "Mark as Completed"}
                    >
                      <FaCheckCircle />
                    </button>
                    
                    <button 
                      className="card-action-btn-icon clone-btn"
                      onClick={(e) => handleDuplicateProject(e, proj.projectId)}
                      title="Duplicate Project"
                    >
                      <FaCopy />
                    </button>
                    
                    <button 
                      className="card-action-btn-icon delete-btn"
                      onClick={(e) => handleDeleteProject(e, proj.projectId, proj.projectName)}
                      title="Delete Project"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Project Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="New Bioink Project">
        <div className="new-project-form">
          <div className="form-group">
            <label htmlFor="project-name" className="form-label">
              Project Name <span className="required-star">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              className={`form-input ${nameError ? "input-error" : ""}`}
              placeholder="e.g. Collagen Skin Scaffold"
              value={projectName}
              onChange={handleNameChange}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitProject()}
              autoFocus
              maxLength={100}
            />

            {nameError && (
              <div className="validation-block">
                <p className="error-message">{nameError}</p>
                {nameSuggestions.length > 0 && (
                  <div className="name-suggestions">
                    <span className="suggestions-label">Try one of these:</span>
                    <div className="suggestions-chips">
                      {nameSuggestions.map((s) => (
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

          <div className="form-group">
            <label htmlFor="project-description" className="form-label">
              Description <span className="optional-tag">(Optional)</span>
            </label>
            <textarea
              id="project-description"
              className="form-textarea"
              placeholder="Briefly describe the research goals..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="form-actions">
            <button className="btn-cancel" onClick={handleCloseModal}>
              Cancel
            </button>
            <button className="btn-create" onClick={handleSubmitProject}>
              Create Project
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Projects;
