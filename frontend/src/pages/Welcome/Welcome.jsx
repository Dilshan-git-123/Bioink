import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaFolderOpen, FaBook, FaRobot, FaClock, FaLightbulb, FaFlask, FaCheckCircle, FaUserCircle } from 'react-icons/fa';
import './Welcome.css';

import welcomeHero from "../../assets/images/welcome-hero.png";

const Welcome = () => {
    const navigate = useNavigate();
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    // Placeholder data for sections
    const recentProjects = [
        { id: 1, name: "Alginate-GelMA Cardiac Patch", time: "2 hours ago", status: "In Progress" },
        { id: 2, name: "PEGDA Bone Scaffold", time: "Yesterday", status: "Completed" },
    ];

    const recentActivity = [
        { id: 1, text: "AI generated 3 new protocols based on tissue selection.", time: "20 mins ago", icon: <FaRobot /> },
        { id: 2, text: "Experiment #102 finished running.", time: "1 hour ago", icon: <FaCheckCircle /> },
    ];

    return (
        <div className="welcome-page">
            <div className="welcome-container">
                
                {/* Header Section */}
                <header className="welcome-header cinematic-fade-in stagger-1">
                    <div className="greeting-block">
                        <span className="welcome-badge">AI-Powered 3D Bioprinting Platform</span>
                        <h1>{greeting}, Researcher 👋</h1>
                        <p>Welcome back to BioInkAI. Ready to continue today's research?</p>
                    </div>
                    
                    <div className="hero-illustration-container">
                        <img
                            src={welcomeHero}
                            alt="BioInkAI Bioprinter"
                            className="welcome-hero-img"
                        />
                    </div>
                </header>

                {/* Primary Action Cards Grid */}
                <div className="action-cards-grid">
                    <div className="action-card cinematic-fade-in stagger-2" onClick={() => navigate('/designer')}>
                        <div className="card-icon-wrapper blue">
                            <FaPlus className="card-icon" />
                        </div>
                        <h3>New Bioink Project</h3>
                        <p>Design a new formulation from scratch</p>
                    </div>

                    <div className="action-card cinematic-fade-in stagger-3" onClick={() => navigate('/dashboard')}>
                        <div className="card-icon-wrapper cyan">
                            <FaFolderOpen className="card-icon" />
                        </div>
                        <h3>Continue Previous Project</h3>
                        <p>Resume work on your recent designs</p>
                    </div>

                    <div className="action-card cinematic-fade-in stagger-4" onClick={() => navigate('/literature')}>
                        <div className="card-icon-wrapper indigo">
                            <FaBook className="card-icon" />
                        </div>
                        <h3>Literature Library</h3>
                        <p>Explore the latest biomaterial papers</p>
                    </div>

                    <div className="action-card ai-glow cinematic-fade-in stagger-5" onClick={() => navigate('/assistant')}>
                        <div className="card-icon-wrapper purple">
                            <FaRobot className="card-icon" />
                        </div>
                        <h3>AI Research Assistant</h3>
                        <p>Chat with your personalized AI agent</p>
                    </div>
                </div>

                {/* Lower Section Grid */}
                <div className="dashboard-grid">
                    
                    {/* Left Column */}
                    <div className="grid-col-left cinematic-fade-in stagger-6">
                        {/* Recent Projects */}
                        <div className="dashboard-panel">
                            <div className="panel-header">
                                <h3><FaClock className="panel-icon" /> Recent Projects</h3>
                                <button className="text-link" onClick={() => navigate('/dashboard')}>View All</button>
                            </div>
                            <div className="panel-content list-view">
                                {recentProjects.map(proj => (
                                    <div key={proj.id} className="list-item">
                                        <div className="item-info">
                                            <h4>{proj.name}</h4>
                                            <span>{proj.time}</span>
                                        </div>
                                        <span className={`status-badge ${proj.status === 'Completed' ? 'success' : 'pending'}`}>
                                            {proj.status}
                                        </span>
                                    </div>
                                ))}
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
        </div>
    );
};

export default Welcome;
