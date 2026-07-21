import React, { useState } from 'react';
import { 
    FaRobot, 
    FaUser, 
    FaPaperPlane, 
    FaHistory, 
    FaLightbulb, 
    FaBook, 
    FaFlask, 
    FaPlus,
    FaRegCommentDots
} from 'react-icons/fa';
import './Assistant.css';

const Assistant = () => {
    const [input, setInput] = useState('');

    return (
        <div className="assistant-page">
            
            {/* Left Sidebar: Conversation History */}
            <div className="assistant-sidebar">
                <button className="primary-btn w-100 mb-3"><FaPlus className="mr-2" /> New Chat</button>
                
                <div className="history-section">
                    <h4>Recent Conversations</h4>
                    <ul className="history-list">
                        <li className="active"><FaRegCommentDots /> Alginate viscosity tuning</li>
                        <li><FaRegCommentDots /> Cartilage printbed temps</li>
                        <li><FaRegCommentDots /> Literature: PEGDA crosslinking</li>
                        <li><FaRegCommentDots /> Troubleshooting nozzle clog</li>
                    </ul>
                </div>
                <div className="history-section mt-4">
                    <h4>Last Week</h4>
                    <ul className="history-list">
                        <li><FaRegCommentDots /> Optimizing cell viability</li>
                        <li><FaRegCommentDots /> Photoinitiator comparison</li>
                    </ul>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="chat-area">
                <div className="chat-header">
                    <div className="chat-title">
                        <h2><FaRobot className="text-primary" /> BioInkAI Research Assistant</h2>
                        <span className="context-badge">Context: Project Alpha v2.4</span>
                    </div>
                </div>

                <div className="chat-window">
                    
                    {/* Mock Chat Messages */}
                    <div className="message-bubble ai-msg">
                        <div className="avatar ai-avatar"><FaRobot /></div>
                        <div className="msg-content">
                            <p>Hello! I noticed you're working on the <strong>Alginate-GelMA blend</strong> for articular cartilage. Your latest prediction showed a slight risk of rapid degradation. Would you like me to suggest some crosslinking adjustments or search the literature for similar formulations?</p>
                        </div>
                    </div>

                    <div className="message-bubble user-msg">
                        <div className="msg-content">
                            <p>Yes, please suggest crosslinking adjustments to improve degradation time without compromising printability.</p>
                        </div>
                        <div className="avatar user-avatar"><FaUser /></div>
                    </div>

                    <div className="message-bubble ai-msg">
                        <div className="avatar ai-avatar"><FaRobot /></div>
                        <div className="msg-content">
                            <p>To improve degradation time while maintaining your 95% printability score, I recommend a dual-crosslinking approach:</p>
                            <ul>
                                <li><strong>Ionic:</strong> Briefly expose to 50mM CaCl2 for 1 minute post-printing.</li>
                                <li><strong>Photo:</strong> Follow immediately with UV (365nm) exposure for 45 seconds using 0.1% LAP.</li>
                            </ul>
                            <p>This creates an interpenetrating polymer network (IPN) that resists rapid enzymatic degradation. I can load these parameters into your Designer module if you'd like.</p>
                            <div className="msg-actions">
                                <button className="outline-btn small">Load into Designer</button>
                                <button className="outline-btn small">Save to Protocol</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Input Area & Suggested Prompts */}
                <div className="input-section">
                    <div className="suggested-prompts">
                        <span className="prompt-chip">Find papers on GelMA degradation</span>
                        <span className="prompt-chip">Analyze my current formulation</span>
                        <span className="prompt-chip">Troubleshoot low viability</span>
                    </div>
                    <div className="chat-input-box">
                        <input 
                            type="text" 
                            placeholder="Ask BioInkAI a question about your research..." 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <button className="send-btn"><FaPaperPlane /></button>
                    </div>
                </div>
            </div>

            {/* Right Sidebar: Context & Assistance */}
            <div className="context-panel">
                
                <div className="context-card">
                    <h3><FaFlask className="icon-blue" /> Current Context</h3>
                    <div className="context-details">
                        <div className="ctx-item">
                            <span>Project</span>
                            <strong>Alpha v2.4</strong>
                        </div>
                        <div className="ctx-item">
                            <span>Target</span>
                            <strong>Cartilage</strong>
                        </div>
                        <div className="ctx-item">
                            <span>Status</span>
                            <strong>Formulation Phase</strong>
                        </div>
                    </div>
                </div>

                <div className="context-card">
                    <h3><FaLightbulb className="icon-yellow" /> Recommendations</h3>
                    <ul className="recomm-list">
                        <li>Consider lowering printbed temperature to 15°C based on rheology data.</li>
                        <li>Add a viability test step to your upcoming protocol.</li>
                    </ul>
                </div>

                <div className="context-card">
                    <h3><FaBook className="icon-green" /> Literature Assistance</h3>
                    <p className="ctx-desc">I found 3 new papers related to your dual-crosslinking strategy.</p>
                    <div className="lit-item">
                        <strong>IPN Hydrogels for Cartilage</strong>
                        <span>Biomaterials, 2025</span>
                    </div>
                    <div className="lit-item">
                        <strong>Tuning GelMA Degradation</strong>
                        <span>Biofabrication, 2024</span>
                    </div>
                    <button className="text-btn mt-2">View all in Library</button>
                </div>

            </div>
        </div>
    );
};

export default Assistant;
