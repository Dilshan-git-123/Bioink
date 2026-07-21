import React, { useState } from 'react';
import { 
    FaUserCircle, 
    FaPalette, 
    FaBrain, 
    FaVial, 
    FaFileExport, 
    FaBell, 
    FaInfoCircle,
    FaSave
} from 'react-icons/fa';
import './Settings.css';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('profile');

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className="settings-section animate-fade">
                        <h3>Profile Settings</h3>
                        <p className="settings-desc">Update your personal information and laboratory role.</p>
                        
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" defaultValue="Dr. G. Torres" />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" defaultValue="gtorres@bioinkai.edu" />
                        </div>
                        <div className="form-group">
                            <label>Laboratory Role</label>
                            <select defaultValue="lead">
                                <option value="lead">Lead Scientist</option>
                                <option value="researcher">Researcher</option>
                                <option value="technician">Lab Technician</option>
                            </select>
                        </div>
                    </div>
                );
            case 'appearance':
                return (
                    <div className="settings-section animate-fade">
                        <h3>Appearance</h3>
                        <p className="settings-desc">Customize how BioInkAI looks on your device.</p>
                        
                        <div className="setting-row">
                            <div>
                                <strong>Theme</strong>
                                <p>Select your preferred color theme.</p>
                            </div>
                            <select defaultValue="light">
                                <option value="light">Light (BioInk Blue)</option>
                                <option value="dark">Dark Mode</option>
                                <option value="system">System Default</option>
                            </select>
                        </div>
                        <div className="setting-row">
                            <div>
                                <strong>Compact UI</strong>
                                <p>Reduce spacing to show more data on screen.</p>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                );
            case 'ai':
                return (
                    <div className="settings-section animate-fade">
                        <h3>AI Preferences</h3>
                        <p className="settings-desc">Configure how the BioInkAI Research Assistant operates.</p>
                        
                        <div className="setting-row">
                            <div>
                                <strong>Prediction Model Strictness</strong>
                                <p>Higher strictness requires more data confidence to recommend a formulation.</p>
                            </div>
                            <select defaultValue="high">
                                <option value="low">Low (Exploratory)</option>
                                <option value="medium">Medium (Balanced)</option>
                                <option value="high">High (Clinical Grade)</option>
                            </select>
                        </div>
                        <div className="setting-row">
                            <div>
                                <strong>Auto-Literature Summarization</strong>
                                <p>Automatically generate summaries for newly added papers.</p>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" defaultChecked />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                );
            case 'units':
                return (
                    <div className="settings-section animate-fade">
                        <h3>Laboratory Units</h3>
                        <p className="settings-desc">Set your preferred units for formulations and rheology.</p>
                        
                        <div className="form-group">
                            <label>Viscosity Unit</label>
                            <select defaultValue="pas">
                                <option value="pas">Pascal-second (Pa·s)</option>
                                <option value="cp">Centipoise (cP)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Concentration Format</label>
                            <select defaultValue="wv">
                                <option value="wv">Weight/Volume (% w/v)</option>
                                <option value="mgml">mg/mL</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Temperature</label>
                            <select defaultValue="c">
                                <option value="c">Celsius (°C)</option>
                                <option value="f">Fahrenheit (°F)</option>
                            </select>
                        </div>
                    </div>
                );
            case 'export':
                return (
                    <div className="settings-section animate-fade">
                        <h3>Export Options</h3>
                        <p className="settings-desc">Configure default formats for exporting experiments and predictions.</p>
                        
                        <div className="setting-row">
                            <div>
                                <strong>Default Report Format</strong>
                                <p>Format used when clicking 'Export Report' globally.</p>
                            </div>
                            <select defaultValue="pdf">
                                <option value="pdf">PDF Document</option>
                                <option value="csv">CSV Spreadsheet</option>
                                <option value="json">JSON Data</option>
                            </select>
                        </div>
                        <div className="setting-row">
                            <div>
                                <strong>Include Raw Data in PDF</strong>
                                <p>Attach raw chart data tables to the end of PDF reports.</p>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" defaultChecked />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="settings-section animate-fade">
                        <h3>Notifications</h3>
                        <p className="settings-desc">Manage your alerts and daily digests.</p>
                        
                        <div className="setting-row">
                            <div>
                                <strong>Experiment Completion Alerts</strong>
                                <p>Notify when an active experiment timeline finishes.</p>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" defaultChecked />
                                <span className="slider"></span>
                            </label>
                        </div>
                        <div className="setting-row">
                            <div>
                                <strong>Literature Updates</strong>
                                <p>Weekly digest of newly published papers matching your saved materials.</p>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" defaultChecked />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                );
            case 'about':
                return (
                    <div className="settings-section animate-fade about-section">
                        <div className="about-logo">
                            <h1>🧬 BioInkAI</h1>
                        </div>
                        <h3>Version 2.0.4 (Build 8829)</h3>
                        <p>BioInkAI is an advanced computational platform designed to accelerate the formulation of biomaterials for 3D bioprinting and tissue engineering through artificial intelligence.</p>
                        
                        <div className="about-links">
                            <a href="#">Documentation</a>
                            <a href="#">Release Notes</a>
                            <a href="#">Terms of Service</a>
                            <a href="#">Privacy Policy</a>
                        </div>
                        
                        <div className="about-footer">
                            <p>© 2026 BioInkAI Labs. All rights reserved.</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1>Settings & Preferences</h1>
                <p>Manage your account, laboratory preferences, and AI behavior.</p>
            </div>

            <div className="settings-container">
                
                {/* Sidebar Navigation */}
                <div className="settings-sidebar">
                    <button 
                        className={`settings-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <FaUserCircle /> Profile
                    </button>
                    <button 
                        className={`settings-nav-btn ${activeTab === 'appearance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('appearance')}
                    >
                        <FaPalette /> Appearance
                    </button>
                    <button 
                        className={`settings-nav-btn ${activeTab === 'ai' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ai')}
                    >
                        <FaBrain /> AI Preferences
                    </button>
                    <button 
                        className={`settings-nav-btn ${activeTab === 'units' ? 'active' : ''}`}
                        onClick={() => setActiveTab('units')}
                    >
                        <FaVial /> Laboratory Units
                    </button>
                    <button 
                        className={`settings-nav-btn ${activeTab === 'export' ? 'active' : ''}`}
                        onClick={() => setActiveTab('export')}
                    >
                        <FaFileExport /> Export Options
                    </button>
                    <button 
                        className={`settings-nav-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notifications')}
                    >
                        <FaBell /> Notifications
                    </button>
                    <div className="nav-divider"></div>
                    <button 
                        className={`settings-nav-btn ${activeTab === 'about' ? 'active' : ''}`}
                        onClick={() => setActiveTab('about')}
                    >
                        <FaInfoCircle /> About BioInkAI
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="settings-content">
                    {renderContent()}
                    
                    {/* Action Footer (hidden on 'about' tab) */}
                    {activeTab !== 'about' && (
                        <div className="settings-footer">
                            <button className="primary-btn"><FaSave className="btn-icon" /> Save Changes</button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Settings;
