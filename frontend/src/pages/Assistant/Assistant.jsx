import React, { useState, useRef, useEffect } from 'react';
import { 
    FaRobot, 
    FaUser, 
    FaPaperPlane, 
    FaHistory, 
    FaLightbulb, 
    FaBook, 
    FaFlask, 
    FaPlus,
    FaRegCommentDots,
    FaSpinner,
    FaTrash
} from 'react-icons/fa';
import './Assistant.css';

const API_URL = "http://127.0.0.1:8000";

const Assistant = () => {
    const [input, setInput] = useState('');
    
    // Load sessions from local storage or start with an empty one
    const [sessions, setSessions] = useState(() => {
        const saved = localStorage.getItem('chatSessions');
        if (saved) return JSON.parse(saved);
        return [{
            id: Date.now(),
            title: "New Conversation",
            date: new Date().toISOString(),
            messages: [{
                role: "ai",
                text: "Hello! I am BioInkAI Research Assistant. I have access to your saved projects and predictions. How can I help you today?"
            }]
        }];
    });

    const [activeSessionId, setActiveSessionId] = useState(sessions[0]?.id);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Get active session messages
    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
    const messages = activeSession ? activeSession.messages : [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Save to local storage whenever sessions change
    useEffect(() => {
        localStorage.setItem('chatSessions', JSON.stringify(sessions));
    }, [sessions]);

    const handleNewChat = () => {
        const newSession = {
            id: Date.now(),
            title: "New Conversation",
            date: new Date().toISOString(),
            messages: [{
                role: "ai",
                text: "Hello! I am BioInkAI Research Assistant. I have access to your saved projects and predictions. How can I help you today?"
            }]
        };
        setSessions([newSession, ...sessions]);
        setActiveSessionId(newSession.id);
    };

    const handleDeleteChat = (id, e) => {
        e.stopPropagation();
        const updatedSessions = sessions.filter(s => s.id !== id);
        if (updatedSessions.length === 0) {
            handleNewChat();
        } else {
            setSessions(updatedSessions);
            if (activeSessionId === id) {
                setActiveSessionId(updatedSessions[0].id);
            }
        }
    };

    const updateSessionMessages = (newMessages) => {
        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                // Generate title from first user message if it's "New Conversation"
                let title = s.title;
                if (title === "New Conversation" && newMessages.length > 1) {
                    const firstUserMsg = newMessages.find(m => m.role === 'user');
                    if (firstUserMsg) {
                        title = firstUserMsg.text.substring(0, 30) + (firstUserMsg.text.length > 30 ? "..." : "");
                    }
                }
                return { ...s, messages: newMessages, title, date: new Date().toISOString() };
            }
            return s;
        }));
    };

    const handleSend = async (text = input) => {
        if (!text.trim() || isLoading) return;

        const newMessages = [...messages, { role: "user", text: text }];
        updateSessionMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ messages: newMessages })
            });

            if (!response.ok) {
                throw new Error("Failed to get response");
            }

            const data = await response.json();
            updateSessionMessages([...newMessages, { role: "ai", text: data.response }]);
        } catch (error) {
            console.error("Chat error:", error);
            updateSessionMessages([...newMessages, { role: "ai", text: "⚠️ Sorry, I encountered an error. Please make sure the backend is running and the GEMINI_API_KEY is valid." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="assistant-page">
            
            {/* Left Sidebar: Conversation History */}
            <div className="assistant-sidebar">
                <button className="primary-btn w-100 mb-3" onClick={handleNewChat}>
                    <FaPlus className="mr-2" /> New Chat
                </button>
                
                <div className="history-section">
                    <h4>Recent Conversations</h4>
                    <ul className="history-list">
                        {sessions.map(session => (
                            <li 
                                key={session.id} 
                                className={session.id === activeSessionId ? 'active' : ''}
                                onClick={() => setActiveSessionId(session.id)}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <FaRegCommentDots style={{marginRight: '8px'}} /> 
                                    {session.title}
                                </span>
                                <FaTrash 
                                    style={{ cursor: 'pointer', opacity: 0.5 }} 
                                    onClick={(e) => handleDeleteChat(session.id, e)} 
                                    title="Delete chat"
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="chat-area">
                <div className="chat-header">
                    <div className="chat-title">
                        <h2><FaRobot className="text-primary" /> BioInkAI Research Assistant</h2>
                        <span className="context-badge">Context: Connected to Database</span>
                    </div>
                </div>

                <div className="chat-window">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message-bubble ${msg.role === 'ai' ? 'ai-msg' : 'user-msg'}`}>
                            {msg.role === 'ai' && <div className="avatar ai-avatar"><FaRobot /></div>}
                            <div className="msg-content">
                                {msg.text.split('\n').map((line, i) => (
                                    <p key={i} style={{ marginBottom: line.trim() ? '10px' : '0' }}>{line}</p>
                                ))}
                            </div>
                            {msg.role === 'user' && <div className="avatar user-avatar"><FaUser /></div>}
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="message-bubble ai-msg">
                            <div className="avatar ai-avatar"><FaRobot /></div>
                            <div className="msg-content">
                                <p><FaSpinner className="fa-spin" style={{marginRight: '8px'}}/> Thinking...</p>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area & Suggested Prompts */}
                <div className="input-section">
                    <div className="suggested-prompts">
                        <span className="prompt-chip" onClick={() => handleSend("Find papers on GelMA degradation")}>Find papers on GelMA degradation</span>
                        <span className="prompt-chip" onClick={() => handleSend("Analyze my current formulation")}>Analyze my current formulation</span>
                        <span className="prompt-chip" onClick={() => handleSend("Troubleshoot low viability")}>Troubleshoot low viability</span>
                    </div>
                    <div className="chat-input-box">
                        <input 
                            type="text" 
                            placeholder="Ask BioInkAI a question about your research..." 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button className="send-btn" onClick={() => handleSend()} disabled={isLoading}>
                            <FaPaperPlane />
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Sidebar: Context & Assistance */}
            <div className="context-panel">
                <div className="context-card">
                    <h3><FaFlask className="icon-blue" /> Current Context</h3>
                    <div className="context-details">
                        <div className="ctx-item">
                            <span>Integration</span>
                            <strong>Active Database</strong>
                        </div>
                        <div className="ctx-item">
                            <span>LLM Engine</span>
                            <strong>Gemini 2.5 Flash</strong>
                        </div>
                    </div>
                </div>

                <div className="context-card">
                    <h3><FaLightbulb className="icon-yellow" /> Tips</h3>
                    <ul className="recomm-list">
                        <li>Ask me about your saved projects.</li>
                        <li>I can analyze your recent predictions.</li>
                        <li>Ask for formulation advice!</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Assistant;
