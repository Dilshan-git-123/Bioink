import React, { useState, useEffect, useCallback } from 'react';
import {
    FaFlask,
    FaStar,
    FaRegStar,
    FaTrash,
    FaCopy,
    FaUndoAlt,
    FaSearch,
    FaFilter,
    FaSort,
    FaChevronDown,
    FaChevronUp,
    FaColumns,
    FaDna,
    FaCheckCircle,
    FaExclamationTriangle,
    FaInfoCircle,
    FaStickyNote,
    FaTimes,
    FaSave,
} from 'react-icons/fa';
import {
    getExperiments,
    updateExperiment,
    deleteExperiment,
    duplicateExperiment,
} from '../../services/experimentService';
import { useProject } from '../../context/ProjectContext';
import { parseError } from '../../utils/errorHandler';
import './Experiments.css';

// ─── Utility helpers ─────────────────────────────────────────────────────────

function formatDate(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return isNaN(d) ? ts : d.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function scoreColor(score) {
    if (score == null) return '#667085';
    if (score >= 75) return '#12B76A';
    if (score >= 50) return '#F79009';
    return '#F04438';
}

function riskBadge(risk) {
    const map = {
        low: { cls: 'badge-green', label: 'Low Risk' },
        medium: { cls: 'badge-yellow', label: 'Medium Risk' },
        high: { cls: 'badge-red', label: 'High Risk' },
    };
    const k = (risk || '').toLowerCase();
    return map[k] || { cls: 'badge-gray', label: risk || 'Unknown' };
}

// ─── Experiment Card ─────────────────────────────────────────────────────────

function ExperimentCard({ exp, onToggleFav, onDelete, onDuplicate, onRestore, onSelect, isCompareA, isCompareB, onCompareToggle, actionLoading }) {
    const score = exp.compatibility_analysis?.score ?? null;
    const risk  = exp.compatibility_analysis?.risk_level ?? null;
    const { cls: riskCls, label: riskLabel } = riskBadge(risk);

    const materials = Array.isArray(exp.biomaterials)
        ? exp.biomaterials.map(m => m.biomaterial || m.name || '').filter(Boolean)
        : [];

    return (
        <div className={`exp-card-item ${isCompareA ? 'compare-a' : ''} ${isCompareB ? 'compare-b' : ''}`}>
            <div className="exp-card-top">
                <div className="exp-card-meta">
                    <span className="exp-tissue-tag">{exp.tissue_type || 'Unknown Tissue'}</span>
                    {score != null && (
                        <span className="exp-score-badge" style={{ color: scoreColor(score) }}>
                            ⬤ {score}%
                        </span>
                    )}
                </div>
                <button
                    className={`fav-btn ${exp.is_favorite ? 'active' : ''}`}
                    onClick={() => onToggleFav(exp)}
                    disabled={actionLoading}
                    title={exp.is_favorite ? 'Remove from favorites' : 'Mark as favorite'}
                    style={{ opacity: actionLoading ? 0.7 : 1, cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                >
                    {exp.is_favorite ? <FaStar /> : <FaRegStar />}
                </button>
            </div>

            <h3 className="exp-card-name" onClick={() => onSelect(exp)}>
                {exp.project_name}
            </h3>
            <p className="exp-card-date">{formatDate(exp.timestamp)}</p>

            {materials.length > 0 && (
                <div className="exp-material-tags">
                    {materials.slice(0, 3).map((m, i) => (
                        <span key={i} className="material-chip">{m}</span>
                    ))}
                    {materials.length > 3 && (
                        <span className="material-chip more">+{materials.length - 3}</span>
                    )}
                </div>
            )}

            {risk && (
                <span className={`risk-badge ${riskCls}`}>{riskLabel}</span>
            )}

            {exp.user_notes && (
                <p className="exp-note-preview">
                    <FaStickyNote /> {exp.user_notes.slice(0, 80)}{exp.user_notes.length > 80 ? '…' : ''}
                </p>
            )}

            <div className="exp-card-actions">
                <button className="action-btn restore" onClick={() => onRestore(exp)} disabled={actionLoading} title="Restore to Designer" style={{ opacity: actionLoading ? 0.7 : 1, cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
                    <FaUndoAlt /> Restore
                </button>
                <button className="action-btn duplicate" onClick={() => onDuplicate(exp)} disabled={actionLoading} title="Duplicate" style={{ opacity: actionLoading ? 0.7 : 1, cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
                    <FaCopy />
                </button>
                <button
                    className={`action-btn compare ${isCompareA || isCompareB ? 'selected' : ''}`}
                    onClick={() => onCompareToggle(exp)}
                    disabled={actionLoading}
                    title="Add to comparison"
                    style={{ opacity: actionLoading ? 0.7 : 1, cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                >
                    <FaColumns />
                </button>
                <button className="action-btn delete" onClick={() => onDelete(exp)} disabled={actionLoading} title="Delete" style={{ opacity: actionLoading ? 0.7 : 1, cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
                    <FaTrash />
                </button>
            </div>
        </div>
    );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ exp, onClose, onSaveNotes }) {
    const [notes, setNotes] = useState(exp.user_notes || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try { await onSaveNotes(exp.id, notes); } finally { setSaving(false); }
    };

    const compat = exp.compatibility_analysis || {};
    const pred   = exp.prediction_results || {};

    return (
        <div className="detail-overlay" onClick={onClose}>
            <div className="detail-panel" onClick={e => e.stopPropagation()}>
                <div className="detail-header">
                    <h2><FaFlask /> {exp.project_name}</h2>
                    <button className="close-btn" onClick={onClose}><FaTimes /></button>
                </div>
                <p className="detail-date">{formatDate(exp.timestamp)}</p>

                {/* Compatibility Summary */}
                {compat.score != null && (
                    <div className="detail-section compat-section">
                        <h4><FaCheckCircle /> Compatibility Analysis</h4>
                        <div className="compat-score-row">
                            <div className="big-score" style={{ color: scoreColor(compat.score) }}>
                                {compat.score}<span>/100</span>
                            </div>
                            <span className={`risk-badge ${riskBadge(compat.risk_level).cls}`}>
                                {riskBadge(compat.risk_level).label}
                            </span>
                        </div>
                        {Array.isArray(compat.warnings) && compat.warnings.length > 0 && (
                            <div className="detail-warnings">
                                <strong><FaExclamationTriangle /> Warnings</strong>
                                <ul>{compat.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                            </div>
                        )}
                        {Array.isArray(compat.positives) && compat.positives.length > 0 && (
                            <div className="detail-positives">
                                <strong><FaCheckCircle /> Positive Interactions</strong>
                                <ul>{compat.positives.map((p, i) => <li key={i}>{p}</li>)}</ul>
                            </div>
                        )}
                        {Array.isArray(compat.recommendations) && compat.recommendations.length > 0 && (
                            <div className="detail-recommendations">
                                <strong><FaInfoCircle /> AI Recommendations</strong>
                                <ul>{compat.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Prediction Summary */}
                {pred.printability_score != null && (
                    <div className="detail-section">
                        <h4><FaDna /> Prediction Results</h4>
                        <div className="pred-grid">
                            {['printability_score', 'cell_viability', 'mechanical_strength', 'shape_fidelity'].map(k => (
                                pred[k] != null && (
                                    <div key={k} className="pred-item">
                                        <span>{k.replace(/_/g, ' ')}</span>
                                        <strong>{typeof pred[k] === 'number' ? pred[k].toFixed(1) : pred[k]}</strong>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                )}

                {/* Biomaterials */}
                {Array.isArray(exp.biomaterials) && exp.biomaterials.length > 0 && (
                    <div className="detail-section">
                        <h4>Biomaterials</h4>
                        <div className="material-detail-list">
                            {exp.biomaterials.map((m, i) => (
                                <div key={i} className="material-detail-row">
                                    <strong>{m.biomaterial || m.name}</strong>
                                    <span>{m.concentration}% · {m.temperature}°C · {m.method}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                <div className="detail-section">
                    <h4><FaStickyNote /> Researcher Notes</h4>
                    <textarea
                        className="notes-textarea"
                        value={notes || ""}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Add your observations, hypotheses, or conclusions here…"
                        rows={5}
                    />
                    <button className="save-notes-btn" onClick={handleSave} disabled={saving}>
                        <FaSave /> {saving ? 'Saving…' : 'Save Notes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Comparison View ──────────────────────────────────────────────────────────

function ComparisonView({ expA, expB, onClose }) {
    const fields = [
        { label: 'Project', key: e => e.project_name },
        { label: 'Timestamp', key: e => formatDate(e.timestamp) },
        { label: 'Tissue Type', key: e => e.tissue_type || '—' },
        { label: 'Compatibility Score', key: e => e.compatibility_analysis?.score != null ? `${e.compatibility_analysis.score}%` : '—' },
        { label: 'Risk Level', key: e => e.compatibility_analysis?.risk_level || '—' },
        { label: 'Printability Score', key: e => e.prediction_results?.printability_score?.toFixed(1) || '—' },
        { label: 'Cell Viability', key: e => e.prediction_results?.cell_viability?.toFixed(1) || '—' },
        { label: 'Mechanical Strength', key: e => e.prediction_results?.mechanical_strength?.toFixed(1) || '—' },
        { label: 'Shape Fidelity', key: e => e.prediction_results?.shape_fidelity?.toFixed(1) || '—' },
        { label: 'Notes', key: e => e.user_notes || '—' },
    ];

    return (
        <div className="detail-overlay" onClick={onClose}>
            <div className="compare-panel" onClick={e => e.stopPropagation()}>
                <div className="detail-header">
                    <h2><FaColumns /> Experiment Comparison</h2>
                    <button className="close-btn" onClick={onClose}><FaTimes /></button>
                </div>
                <div className="compare-table">
                    <div className="compare-col header-col">
                        <div className="compare-cell header-cell">Field</div>
                        {fields.map((f, i) => (
                            <div key={i} className="compare-cell label-cell">{f.label}</div>
                        ))}
                    </div>
                    {[expA, expB].map((exp, ei) => (
                        <div key={ei} className={`compare-col exp-col exp-${ei + 1}`}>
                            <div className="compare-cell header-cell">
                                {ei === 0 ? '🅰 ' : '🅱 '}{exp.project_name}
                            </div>
                            {fields.map((f, i) => {
                                const valA = fields[i].key(expA);
                                const valB = fields[i].key(expB);
                                const isDiff = valA !== valB;
                                return (
                                    <div key={i} className={`compare-cell ${isDiff ? 'diff-cell' : ''}`}>
                                        {f.key(exp)}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Main Experiments Page ────────────────────────────────────────────────────

const Experiments = () => {
    const { setActiveProject } = useProject();

    const [experiments, setExperiments]   = useState([]);
    const [loading, setLoading]           = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError]               = useState(null);

    // Filters & sort
    const [search, setSearch]             = useState('');
    const [filterFav, setFilterFav]       = useState(false);
    const [filterTissue, setFilterTissue] = useState('');
    const [sortKey, setSortKey]           = useState('timestamp');
    const [sortDir, setSortDir]           = useState('desc');

    // UI state
    const [selectedExp, setSelectedExp]   = useState(null);
    const [compareA, setCompareA]         = useState(null);
    const [compareB, setCompareB]         = useState(null);
    const [showCompare, setShowCompare]   = useState(false);

    // Load experiments
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getExperiments();
            setExperiments(data);
        } catch (e) {
            setError(parseError(e, 'Failed to load experiments. Make sure the backend is running.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleToggleFav = async (exp) => {
        if (actionLoading) return;
        setActionLoading(true);
        try {
            const updated = await updateExperiment(exp.id, { is_favorite: !exp.is_favorite });
            setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, is_favorite: updated.is_favorite } : e));
        } catch (e) {
            alert(parseError(e, "Failed to update favorite status."));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (exp) => {
        if (actionLoading) return;
        if (!window.confirm(`Delete experiment "${exp.project_name}"? This cannot be undone.`)) return;
        setActionLoading(true);
        try {
            await deleteExperiment(exp.id);
            setExperiments(prev => prev.filter(e => e.id !== exp.id));
            if (selectedExp?.id === exp.id) setSelectedExp(null);
        } catch (e) {
            alert(parseError(e, "Failed to delete experiment."));
        } finally {
            setActionLoading(false);
        }
    };

    // Duplicate
    const handleDuplicate = async (exp) => {
        if (actionLoading) return;
        setActionLoading(true);
        try {
            const dup = await duplicateExperiment(exp.id);
            setExperiments(prev => [dup, ...prev]);
            setSelectedExp(dup);
        } catch (e) {
            alert(parseError(e, "Failed to duplicate experiment."));
        } finally {
            setActionLoading(false);
        }
    };

    // Restore to Designer
    const handleRestore = (exp) => {
        const projectData = {
            projectId:        exp.project_id,
            projectName:      exp.project_name,
            selectedTissue:   exp.tissue_type,
            materials:        exp.biomaterials || [],
            finalMixing:      exp.final_mixing || null,
            prediction:       exp.prediction_results || null,
            compatAnalysis:   exp.compatibility_analysis || null,
            protocol:         exp.generated_protocol ? { text: exp.generated_protocol } : null,
            status:           'In Progress',
            lastModified:     new Date().toISOString(),
        };
        setActiveProject(projectData);
        alert(`✅ Experiment "${exp.project_name}" restored. Open the Designer to continue.`);
    };

    // Save notes from detail panel
    const handleSaveNotes = async (id, notes) => {
        const updated = await updateExperiment(id, { user_notes: notes });
        setExperiments(prev => prev.map(e => e.id === id ? { ...e, user_notes: updated.user_notes } : e));
        if (selectedExp?.id === id) setSelectedExp(prev => ({ ...prev, user_notes: updated.user_notes }));
    };

    // Compare toggle
    const handleCompareToggle = (exp) => {
        if (compareA?.id === exp.id) { setCompareA(null); return; }
        if (compareB?.id === exp.id) { setCompareB(null); return; }
        if (!compareA) { setCompareA(exp); return; }
        if (!compareB) { setCompareB(exp); return; }
        // Replace A
        setCompareA(exp);
    };

    // Sort toggle
    const toggleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    // Derive unique tissues for filter
    const tissues = [...new Set(experiments.map(e => e.tissue_type).filter(Boolean))];

    // Filter & sort
    const filtered = experiments
        .filter(e => {
            const q = search.toLowerCase();
            const matchSearch = !q ||
                (e.project_name || '').toLowerCase().includes(q) ||
                (e.tissue_type || '').toLowerCase().includes(q) ||
                (e.user_notes || '').toLowerCase().includes(q);
            const matchFav    = !filterFav || e.is_favorite;
            const matchTissue = !filterTissue || e.tissue_type === filterTissue;
            return matchSearch && matchFav && matchTissue;
        })
        .sort((a, b) => {
            let va, vb;
            if (sortKey === 'timestamp') {
                va = a.timestamp || ''; vb = b.timestamp || '';
            } else if (sortKey === 'score') {
                va = a.compatibility_analysis?.score ?? -1;
                vb = b.compatibility_analysis?.score ?? -1;
            } else if (sortKey === 'name') {
                va = (a.project_name || '').toLowerCase();
                vb = (b.project_name || '').toLowerCase();
            }
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

    const SortIcon = ({ k }) => sortKey === k
        ? (sortDir === 'asc' ? <FaChevronUp /> : <FaChevronDown />)
        : <FaSort />;

    return (
        <div className="experiments-history-page">

            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="exp-h-header">
                <div>
                    <h1><FaFlask /> Experiment History</h1>
                    <p>A complete record of every bioink formulation run — searchable, filterable, restorable.</p>
                </div>
                {compareA && compareB && (
                    <button className="compare-launch-btn" onClick={() => setShowCompare(true)}>
                        <FaColumns /> Compare Selected
                    </button>
                )}
            </div>

            {/* ── Toolbar ─────────────────────────────────────────────── */}
            <div className="exp-h-toolbar">
                <div className="search-box">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search experiments…"
                        value={search || ""}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && <button onClick={() => setSearch('')}><FaTimes /></button>}
                </div>
                <div className="toolbar-filters">
                    <button
                        className={`filter-btn ${filterFav ? 'active' : ''}`}
                        onClick={() => setFilterFav(f => !f)}
                    >
                        <FaStar /> Favorites
                    </button>
                    <select
                        className="tissue-select"
                        value={filterTissue || ""}
                        onChange={e => setFilterTissue(e.target.value)}
                    >
                        <option value="">All Tissues</option>
                        {tissues.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button className="sort-btn" onClick={() => toggleSort('timestamp')}>
                        Date <SortIcon k="timestamp" />
                    </button>
                    <button className="sort-btn" onClick={() => toggleSort('score')}>
                        Score <SortIcon k="score" />
                    </button>
                    <button className="sort-btn" onClick={() => toggleSort('name')}>
                        Name <SortIcon k="name" />
                    </button>
                </div>
                <span className="exp-count">{filtered.length} experiment{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* ── Compare banner ───────────────────────────────────────── */}
            {(compareA || compareB) && (
                <div className="compare-banner">
                    <FaColumns />
                    <span>Comparing: </span>
                    {compareA && <strong>{compareA.project_name}</strong>}
                    <span> vs </span>
                    {compareB ? <strong>{compareB.project_name}</strong> : <em>Select one more…</em>}
                    <button onClick={() => { setCompareA(null); setCompareB(null); }}><FaTimes /> Clear</button>
                </div>
            )}

            {/* ── Content ──────────────────────────────────────────────── */}
            {loading && (
                <div className="exp-loading">
                    <div className="spinner" />
                    <p>Loading experiments…</p>
                </div>
            )}

            {!loading && error && (
                <div className="exp-error">
                    <FaExclamationTriangle />
                    <p>{error}</p>
                    <button onClick={load}>Retry</button>
                </div>
            )}

            {!loading && !error && filtered.length === 0 && (
                <div className="exp-empty">
                    <FaFlask className="empty-icon" />
                    <h3>No experiments found</h3>
                    <p>Run a prediction or compatibility analysis in the Designer to automatically record your first experiment.</p>
                </div>
            )}

            {!loading && !error && filtered.length > 0 && (
                <div className="exp-h-grid">
                    {filtered.map(exp => (
                        <ExperimentCard
                            key={exp.id}
                            exp={exp}
                            onToggleFav={handleToggleFav}
                            onDelete={handleDelete}
                            onDuplicate={handleDuplicate}
                            onRestore={handleRestore}
                            onSelect={setSelectedExp}
                            isCompareA={compareA?.id === exp.id}
                            isCompareB={compareB?.id === exp.id}
                            onCompareToggle={handleCompareToggle}
                            actionLoading={actionLoading}
                        />
                    ))}
                </div>
            )}

            {/* ── Detail Panel ─────────────────────────────────────────── */}
            {selectedExp && (
                <DetailPanel
                    exp={selectedExp}
                    onClose={() => setSelectedExp(null)}
                    onSaveNotes={handleSaveNotes}
                />
            )}

            {/* ── Comparison View ──────────────────────────────────────── */}
            {showCompare && compareA && compareB && (
                <ComparisonView
                    expA={compareA}
                    expB={compareB}
                    onClose={() => setShowCompare(false)}
                />
            )}
        </div>
    );
};

export default Experiments;
