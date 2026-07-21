import React, { useState } from 'react';
import { 
    FaFileExport, 
    FaPrint, 
    FaVial, 
    FaListUl, 
    FaClipboardCheck, 
    FaImage, 
    FaChartBar, 
    FaMicroscope,
    FaRegClock,
    FaCheckCircle,
    FaRegCircle,
    FaPen
} from 'react-icons/fa';
import './Experiments.css';

const TimelineItem = ({ time, title, desc, completed }) => (
    <div className={`timeline-item ${completed ? 'completed' : 'pending'}`}>
        <div className="timeline-icon">
            {completed ? <FaCheckCircle /> : <FaRegCircle />}
        </div>
        <div className="timeline-content">
            <span className="timeline-time">{time}</span>
            <h4>{title}</h4>
            <p>{desc}</p>
        </div>
    </div>
);

const Experiments = () => {
    // Mock state for interactive protocol checklist
    const [steps, setSteps] = useState([
        { id: 1, text: "Prepare 5% w/v Alginate solution in DPBS.", done: true },
        { id: 2, text: "Prepare 10% w/v GelMA solution and heat to 37°C.", done: true },
        { id: 3, text: "Mix solutions in a 1:1 ratio using a dual-syringe system.", done: true },
        { id: 4, text: "Add 0.1% LAP photoinitiator and vortex for 2 mins.", done: false },
        { id: 5, text: "Load into printer cartridge and centrifuge to remove bubbles.", done: false },
        { id: 6, text: "Print grid structure at 20 mm/s, 15°C printbed.", done: false }
    ]);

    const toggleStep = (id) => {
        setSteps(steps.map(s => s.id === id ? { ...s, done: !s.done } : s));
    };

    return (
        <div className="experiments-page">
            
            {/* Header Section */}
            <div className="exp-header-section">
                <div className="exp-title-area">
                    <div className="title-row">
                        <h1>Experiment #104: Cartilage Grid Printability</h1>
                        <span className="status-badge in-progress">In Progress</span>
                    </div>
                    <p><strong>Objective:</strong> Assess the shape fidelity and crosslinking efficiency of Alginate-GelMA blend.</p>
                </div>
                <div className="exp-actions">
                    <button className="secondary-btn"><FaPrint /> Print Record</button>
                    <button className="primary-btn"><FaFileExport /> Export PDF</button>
                </div>
            </div>

            {/* Meta Data Row */}
            <div className="exp-meta-row">
                <div className="meta-item">
                    <span>Lead Scientist</span>
                    <strong>Dr. G. Torres</strong>
                </div>
                <div className="meta-item">
                    <span>Date Started</span>
                    <strong>Jul 21, 2026</strong>
                </div>
                <div className="meta-item">
                    <span>Target Tissue</span>
                    <strong>Articular Cartilage</strong>
                </div>
                <div className="meta-item">
                    <span>Associated Formulation</span>
                    <strong className="link-text">BIO-001 (Alg-GelMA v2)</strong>
                </div>
            </div>

            {/* Main ELN Layout */}
            <div className="exp-main-grid">
                
                {/* Left Column */}
                <div className="exp-left-col">
                    
                    {/* Materials */}
                    <div className="exp-card">
                        <div className="card-header">
                            <h3><FaVial /> Materials & Reagents</h3>
                        </div>
                        <ul className="materials-list">
                            <li>Sodium Alginate (High G-block) - <em>Sigma Aldrich</em></li>
                            <li>GelMA (80% Degree of Substitution) - <em>Cellink</em></li>
                            <li>LAP Photoinitiator (0.1%)</li>
                            <li>CaCl2 Crosslinking Solution (50mM)</li>
                        </ul>
                    </div>

                    {/* Protocol Checklist */}
                    <div className="exp-card protocol-card">
                        <div className="card-header">
                            <h3><FaListUl /> Standard Operating Protocol</h3>
                            <button className="text-btn"><FaPen /> Edit</button>
                        </div>
                        <div className="protocol-checklist">
                            {steps.map(step => (
                                <div 
                                    key={step.id} 
                                    className={`checklist-item ${step.done ? 'done' : ''}`}
                                    onClick={() => toggleStep(step.id)}
                                >
                                    <div className="checkbox">
                                        {step.done && <FaCheckCircle className="check-icon" />}
                                    </div>
                                    <span className="step-text">{step.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Observations */}
                    <div className="exp-card">
                        <div className="card-header">
                            <h3><FaClipboardCheck /> Live Observations</h3>
                        </div>
                        <div className="notebook-entry">
                            <p className="timestamp">10:45 AM</p>
                            <p>Solution mixing went smoothly. Viscosity visually appears slightly higher than previous batch.</p>
                        </div>
                        <div className="notebook-entry">
                            <p className="timestamp">11:15 AM</p>
                            <p>Centrifugation at 1500 RPM for 3 mins successfully removed all visible microbubbles.</p>
                        </div>
                        <div className="add-entry-box">
                            <input type="text" placeholder="Type a new observation..." />
                            <button className="primary-btn">Add Note</button>
                        </div>
                    </div>

                </div>

                {/* Right Column */}
                <div className="exp-right-col">
                    
                    {/* Timeline */}
                    <div className="exp-card">
                        <div className="card-header">
                            <h3><FaRegClock /> Experiment Timeline</h3>
                        </div>
                        <div className="timeline-container">
                            <TimelineItem 
                                time="09:00 AM" 
                                title="Preparation Phase" 
                                desc="Gathered reagents and sterilized printer area." 
                                completed={true} 
                            />
                            <TimelineItem 
                                time="10:30 AM" 
                                title="Bioink Formulation" 
                                desc="Mixed Alginate and GelMA solutions." 
                                completed={true} 
                            />
                            <TimelineItem 
                                time="1:00 PM" 
                                title="3D Bioprinting" 
                                desc="Executing g-code for scaffold grid." 
                                completed={false} 
                            />
                            <TimelineItem 
                                time="3:00 PM" 
                                title="Crosslinking & Imaging" 
                                desc="UV exposure and brightfield microscopy." 
                                completed={false} 
                            />
                        </div>
                    </div>

                    {/* Images Placeholder */}
                    <div className="exp-card">
                        <div className="card-header">
                            <h3><FaImage /> Microscopy & Media</h3>
                        </div>
                        <div className="image-grid-placeholder">
                            <div className="img-box">
                                <FaMicroscope className="img-icon" />
                                <span>No Image Yet</span>
                            </div>
                            <div className="img-box">
                                <FaMicroscope className="img-icon" />
                                <span>No Image Yet</span>
                            </div>
                        </div>
                        <button className="secondary-btn w-100 mt-2">Upload Images</button>
                    </div>

                    {/* Results & Conclusion */}
                    <div className="exp-card">
                        <div className="card-header">
                            <h3><FaChartBar /> Results & Conclusion</h3>
                        </div>
                        <div className="results-placeholder">
                            <p><em>Experiment still in progress. Results and conclusion will be documented here post-printing.</em></p>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default Experiments;
