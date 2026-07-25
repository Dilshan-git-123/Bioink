import React, { useState, useEffect } from 'react';
import { parseError } from "../../utils/errorHandler";
import { 
    FaPlusCircle, 
    FaSpinner, 
    FaCheckCircle, 
    FaExclamationCircle, 
    FaDatabase, 
    FaTools, 
    FaHistory, 
    FaUndo, 
    FaPlay, 
    FaEye 
} from 'react-icons/fa';
import './KnowledgeBase.css';

const KnowledgeBase = () => {
    // Page level navigation: 'generator' or 'maintenance'
    const [activeTab, setActiveTab] = useState('generator');

    // Generator Form State
    const [formData, setFormData] = useState({
        materialName: '',
        scientificName: '',
        commonName: '',
        materialType: '',
        source: '',
        grade: ''
    });
    const [genLoading, setGenLoading] = useState(false);
    const [genNotification, setGenNotification] = useState(null);

    // Maintenance State
    const [maintenanceTab, setMaintenanceTab] = useState('migrate');
    const [maintenanceLoading, setMaintenanceLoading] = useState(false);
    const [maintenanceNotification, setMaintenanceNotification] = useState(null);
    
    const [previewData, setPreviewData] = useState(null);
    const [migrationResult, setMigrationResult] = useState(null);
    const [logs, setLogs] = useState([]);
    const [backups, setBackups] = useState([]);
    const [selectedBackup, setSelectedBackup] = useState('');

    // Fetch logs and backups when in maintenance tab
    useEffect(() => {
        if (activeTab === 'maintenance') {
            fetchLogs();
            fetchBackups();
        }
    }, [activeTab]);

    const fetchLogs = async () => {
        try {
            const res = await fetch('http://localhost:8000/migration/logs');
            const data = await res.json();
            if (res.ok) setLogs(data.logs || []);
        } catch (err) {
            console.error("Error fetching logs:", err);
        }
    };

    const fetchBackups = async () => {
        try {
            const res = await fetch('http://localhost:8000/migration/backups');
            const data = await res.json();
            if (res.ok) {
                setBackups(data.backups || []);
                if (data.backups?.length > 0) {
                    setSelectedBackup(data.backups[0]);
                }
            }
        } catch (err) {
            console.error("Error fetching backups:", err);
        }
    };

    const handleGenChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (genNotification?.type === 'error') setGenNotification(null);
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!formData.materialName.trim()) {
            setGenNotification({ type: 'error', message: 'Material Name is required.' });
            return;
        }

        setGenLoading(true);
        setGenNotification(null);

        try {
            const response = await fetch('http://localhost:8000/materials/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Failed to generate material.');

            setGenNotification({ type: 'success', message: `✅ Material created successfully: ${data.filename}` });
            setFormData({ materialName: '', scientificName: '', commonName: '', materialType: '', source: '', grade: '' });
        } catch (err) {
            setGenNotification({ type: 'error', message: parseError(err, "Failed to generate material.") });
        } finally {
            setGenLoading(false);
        }
    };

    // Maintenance Handlers
    const handlePreview = async () => {
        setMaintenanceLoading(true);
        setMaintenanceNotification(null);
        setMigrationResult(null);
        try {
            const res = await fetch('http://localhost:8000/migration/preview');
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to fetch preview.');
            setPreviewData(data.preview);
        } catch (err) {
            setMaintenanceNotification({ type: 'error', message: parseError(err, "Failed to fetch preview.") });
        } finally {
            setMaintenanceLoading(false);
        }
    };

    const handleMigrate = async () => {
        setMaintenanceLoading(true);
        setMaintenanceNotification(null);
        setPreviewData(null);
        try {
            const res = await fetch('http://localhost:8000/migration/run', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Migration failed.');
            
            setMigrationResult(data);
            setMaintenanceNotification({ type: 'success', message: 'Migration completed successfully!' });
            fetchLogs();
            fetchBackups();
        } catch (err) {
            setMaintenanceNotification({ type: 'error', message: parseError(err, "Migration failed.") });
        } finally {
            setMaintenanceLoading(false);
        }
    };

    const handleRestore = async () => {
        if (!selectedBackup) return;
        setMaintenanceLoading(true);
        setMaintenanceNotification(null);
        try {
            const res = await fetch('http://localhost:8000/migration/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ backup_filename: selectedBackup })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Restore failed.');
            setMaintenanceNotification({ type: 'success', message: `Successfully restored backup into ${data.restored_file}` });
        } catch (err) {
            setMaintenanceNotification({ type: 'error', message: parseError(err, "Restore failed.") });
        } finally {
            setMaintenanceLoading(false);
        }
    };

    return (
        <div className="kb-page">
            <div className="kb-header-section cinematic-fade-in stagger-1">
                <h1>Knowledge Base Manager</h1>
                <p>Configure templates, generate new scientific profiles, and maintain standard schemas.</p>
                
                {/* Tab Switcher */}
                <div className="kb-tab-switcher">
                    <button 
                        className={`tab-btn ${activeTab === 'generator' ? 'active' : ''}`}
                        onClick={() => setActiveTab('generator')}
                    >
                        <FaDatabase /> Material Generator
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('maintenance')}
                    >
                        <FaTools /> Database Maintenance
                    </button>
                </div>
            </div>

            <div className="kb-content-grid cinematic-fade-in stagger-2">
                {activeTab === 'generator' ? (
                    <>
                        <div className="kb-card">
                            <h3><FaPlusCircle /> Add New Material</h3>
                            
                            {genNotification && (
                                <div className={`notification-banner ${genNotification.type}`}>
                                    {genNotification.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                                    <span>{genNotification.message}</span>
                                </div>
                            )}

                            <form className="kb-form" onSubmit={handleGenerate}>
                                <div className="form-group">
                                    <label className="form-label">Material Name <span className="required-star">*</span></label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        name="materialName"
                                        value={formData?.materialName || ""}
                                        onChange={handleGenChange}
                                        placeholder="e.g. Silk Fibroin"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Scientific Name <span className="required-star">*</span></label>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            name="scientificName"
                                            value={formData?.scientificName || ""}
                                            onChange={handleGenChange}
                                            placeholder="e.g. Bombyx mori silk fibroin"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Common Name <span className="optional-tag">(Optional)</span></label>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            name="commonName"
                                            value={formData?.commonName || ""}
                                            onChange={handleGenChange}
                                            placeholder="e.g. SF"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Material Type <span className="required-star">*</span></label>
                                        <select 
                                            className="form-input"
                                            name="materialType"
                                            value={formData?.materialType || ""}
                                            onChange={handleGenChange}
                                            required
                                        >
                                            <option value="" disabled>Select Type...</option>
                                            <option value="Natural">Natural</option>
                                            <option value="Synthetic">Synthetic</option>
                                            <option value="Hybrid">Hybrid</option>
                                            <option value="Protein">Protein</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Source <span className="required-star">*</span></label>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            name="source"
                                            value={formData?.source || ""}
                                            onChange={handleGenChange}
                                            placeholder="e.g. Silkworm cocoons"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Grade <span className="optional-tag">(Optional)</span></label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        name="grade"
                                        value={formData?.grade || ""}
                                        onChange={handleGenChange}
                                        placeholder="e.g. Research Grade"
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="gen-btn"
                                    disabled={genLoading}
                                    style={{ opacity: genLoading ? 0.7 : 1, cursor: genLoading ? 'not-allowed' : 'pointer' }}
                                >
                                    <FaTools style={{ marginRight: '8px' }} />
                                    {genLoading ? "Generating..." : "Generate Material"}
                                </button>
                            </form>
                        </div>

                        <div className="kb-card" style={{ height: 'fit-content' }}>
                            <h3>Material Generator Info</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                This tool automatically generates a comprehensive biomaterial profile based on the official BioInkAI Master Template. 
                                <br/><br/>
                                Upon successful generation, the file will be saved in <code>knowledge_base/materials/</code> and will instantly open in your default editor for scientific value configuration.
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Maintenance Dashboard */}
                        <div className="kb-card">
                            <h3><FaTools /> Knowledge Base Maintenance</h3>

                            {/* Sub-tab navigation */}
                            <div className="maintenance-subtabs">
                                <button 
                                    className={`subtab-btn ${maintenanceTab === 'migrate' ? 'active' : ''}`}
                                    onClick={() => setMaintenanceTab('migrate')}
                                >
                                    <FaPlay /> Migration Engine
                                </button>
                                <button 
                                    className={`subtab-btn ${maintenanceTab === 'logs' ? 'active' : ''}`}
                                    onClick={() => setMaintenanceTab('logs')}
                                >
                                    <FaHistory /> Logs
                                </button>
                                <button 
                                    className={`subtab-btn ${maintenanceTab === 'backups' ? 'active' : ''}`}
                                    onClick={() => setMaintenanceTab('backups')}
                                >
                                    <FaUndo /> Revert / Restore
                                </button>
                            </div>

                            {maintenanceNotification && (
                                <div className={`notification-banner ${maintenanceNotification.type}`}>
                                    {maintenanceNotification.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                                    <span>{maintenanceNotification.message}</span>
                                </div>
                            )}

                            {/* Content based on sub-tab */}
                            <div className="maintenance-tab-content">
                                {maintenanceTab === 'migrate' && (
                                    <div className="migrate-actions">
                                        <p className="tab-desc">
                                            The Migration Engine synchronizes your active materials in <code>knowledge_base/materials/</code> with the structure of your <code>master/material_template.yaml</code>, injecting new sections and fields without erasing your data.
                                        </p>
                                        <div className="action-buttons-row">
                                            <button 
                                                className="btn-secondary" 
                                                onClick={handlePreview}
                                                disabled={maintenanceLoading}
                                            >
                                                <FaEye /> Preview Changes
                                            </button>
                                            <button 
                                                className="primary-btn" 
                                                onClick={handleMigrate} 
                                                disabled={maintenanceLoading}
                                                style={{ opacity: maintenanceLoading ? 0.7 : 1, cursor: maintenanceLoading ? 'not-allowed' : 'pointer' }}
                                            >
                                                {maintenanceLoading ? "Processing..." : "Run Migration Engine"}
                                            </button>
                                        </div>

                                        {maintenanceLoading && (
                                            <div className="maintenance-loading">
                                                <FaSpinner className="fa-spin" /> Processing requested operations...
                                            </div>
                                        )}

                                        {/* Preview Details */}
                                        {previewData && (
                                            <div className="preview-results-box">
                                                <h4>Migration Preview</h4>
                                                <ul className="results-list">
                                                    {previewData.map((item, idx) => (
                                                        <li key={idx} className={`result-item ${item.status}`}>
                                                            <strong>{item.file}</strong>: {
                                                                item.status === 'will_update' ? (
                                                                    <span>Will add {item.added_fields.length} fields: <code className="added-fields-tag">{item.added_fields.join(', ')}</code></span>
                                                                ) : item.status === 'up_to_date' ? (
                                                                    <span>Up to Date</span>
                                                                ) : (
                                                                    <span className="error-text">Corrupt file: {item.errors.join(', ')}</span>
                                                                )
                                                            }
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Migration Result Metrics */}
                                        {migrationResult && (
                                            <div className="migration-completed-box">
                                                <h4>Migration Completed Successfully</h4>
                                                <div className="metrics-grid">
                                                    <div className="metric-card">
                                                        <span className="metric-val">{migrationResult["Files Updated"]}</span>
                                                        <span className="metric-label">Files Updated</span>
                                                    </div>
                                                    <div className="metric-card">
                                                        <span className="metric-val">{migrationResult["Files Skipped"]}</span>
                                                        <span className="metric-label">Files Skipped</span>
                                                    </div>
                                                    <div className="metric-card">
                                                        <span className="metric-val">{migrationResult["Backups Created"]}</span>
                                                        <span className="metric-label">Backups Created</span>
                                                    </div>
                                                    <div className="metric-card">
                                                        <span className="metric-val">{migrationResult["Duration Seconds"].toFixed(2)}s</span>
                                                        <span className="metric-label">Time Taken</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {maintenanceTab === 'logs' && (
                                    <div className="logs-tab">
                                        <p className="tab-desc">Historical logs documenting past knowledge base updates.</p>
                                        {logs.length === 0 ? (
                                            <div className="empty-logs">No migration logs found.</div>
                                        ) : (
                                            <div className="logs-wrapper">
                                                {logs.map((log, idx) => (
                                                    <div key={idx} className="log-entry-card">
                                                        <div className="log-entry-header">
                                                            <strong>Version {log.data["Migration Version"]}</strong>
                                                            <span className="log-date">{new Date(log.data["Date"]).toLocaleString()}</span>
                                                        </div>
                                                        <div className="log-entry-details">
                                                            Updated: {log.data["Files Updated"]} | Skipped: {log.data["Files Skipped"]} | Backups: {log.data["Backups Created"]}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {maintenanceTab === 'backups' && (
                                    <div className="backups-tab">
                                        <p className="tab-desc">Select a prior automatic backup file to restore. This will overwrite the matching file in the materials folder with the backed-up version.</p>
                                        
                                        <div className="restore-form-group">
                                            <label className="form-label">Available Backups</label>
                                            {backups.length === 0 ? (
                                                <div className="empty-logs">No backups found.</div>
                                            ) : (
                                                <>
                                                    <select 
                                                        className="form-input" 
                                                        value={selectedBackup || ""}
                                                        onChange={(e) => setSelectedBackup(e.target.value)}
                                                    >
                                                        {backups.map((b, idx) => (
                                                            <option key={idx} value={b}>{b}</option>
                                                        ))}
                                                    </select>
                                                    <button 
                                                        className="btn-primary w-100 mt-3"
                                                        onClick={handleRestore}
                                                        disabled={maintenanceLoading || !selectedBackup}
                                                        style={{ opacity: (maintenanceLoading || !selectedBackup) ? 0.7 : 1, cursor: (maintenanceLoading || !selectedBackup) ? 'not-allowed' : 'pointer' }}
                                                    >
                                                        <FaUndo /> {maintenanceLoading ? "Processing..." : "Restore Selected Backup"}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="kb-card" style={{ height: 'fit-content' }}>
                            <h3>Maintenance Rules</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                - <strong>Safety First</strong>: Run a Preview Changes check before triggering a migration.
                                <br/><br/>
                                - <strong>Automatic Backups</strong>: Every time a file is modified during a migration, a timestamped copy is sent to <code>knowledge_base/backups/</code>.
                                <br/><br/>
                                - <strong>Data Integrity</strong>: The engine only appends missing fields. Existing science metrics will never be overwritten.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default KnowledgeBase;
