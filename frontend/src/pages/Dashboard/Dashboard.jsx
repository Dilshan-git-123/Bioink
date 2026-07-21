import React from 'react';
import { 
    FaPlus, 
    FaFlask, 
    FaChartLine, 
    FaRobot, 
    FaDatabase, 
    FaMicroscope,
    FaArrowRight,
    FaBell,
    FaCheckCircle,
    FaExclamationCircle
} from 'react-icons/fa';
import './Dashboard.css';

// Reusable components within the Dashboard
const StatCard = ({ title, value, icon, trend, positive }) => (
    <div className="stat-card">
        <div className="stat-card-header">
            <div className="stat-icon">{icon}</div>
            <h4 className="stat-title">{title}</h4>
        </div>
        <div className="stat-value">{value}</div>
        <div className={`stat-trend ${positive ? 'positive' : 'neutral'}`}>{trend}</div>
    </div>
);

const ProjectItem = ({ name, date, status }) => (
    <div className="list-item">
        <div className="list-item-content">
            <h5 className="item-title">{name}</h5>
            <p className="item-subtitle">Last modified: {date}</p>
        </div>
        <div className={`status-badge ${status.toLowerCase()}`}>{status}</div>
    </div>
);

const ActivityItem = ({ message, time, icon, type }) => (
    <div className="activity-item">
        <div className={`activity-icon ${type}`}>{icon}</div>
        <div className="activity-content">
            <p className="activity-message">{message}</p>
            <span className="activity-time">{time}</span>
        </div>
    </div>
);

const Dashboard = () => {
    return (
        <div className="dashboard-page">
            
            {/* Welcome Banner */}
            <div className="dashboard-banner">
                <div className="banner-content">
                    <h1>Welcome back, Researcher! 👋</h1>
                    <p>Here is what's happening with your bioink designs today.</p>
                </div>
                <div className="dashboard-actions">
                    <button className="primary-btn"><FaPlus className="btn-icon"/> New Project</button>
                    <button className="secondary-btn"><FaFlask className="btn-icon"/> Quick Formulate</button>
                    <button className="secondary-btn"><FaChartLine className="btn-icon"/> Run Predictions</button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">
                <StatCard 
                    title="Total Projects" 
                    value="12" 
                    icon={<FaFlask />} 
                    trend="+2 this week" 
                    positive={true} 
                />
                <StatCard 
                    title="AI Predictions" 
                    value="1,432" 
                    icon={<FaRobot />} 
                    trend="98% accuracy" 
                    positive={true} 
                />
                <StatCard 
                    title="Saved Formulations" 
                    value="28" 
                    icon={<FaDatabase />} 
                    trend="+5 this month" 
                    positive={true} 
                />
                <StatCard 
                    title="Active Experiments" 
                    value="4" 
                    icon={<FaMicroscope />} 
                    trend="2 finishing soon" 
                    positive={false} 
                />
            </div>

            {/* Dashboard Main Grid */}
            <div className="dashboard-main-grid">
                
                {/* Left Column */}
                <div className="dashboard-col-left">
                    
                    {/* Charts Placeholder */}
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h3>Performance Overview</h3>
                            <button className="text-btn">View All</button>
                        </div>
                        <div className="chart-placeholder">
                            <FaChartLine className="chart-icon" />
                            <p>Printability vs. Viability Chart Rendering...</p>
                        </div>
                    </div>

                    {/* Recent Projects */}
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h3>Recent Projects</h3>
                            <button className="text-btn">View All</button>
                        </div>
                        <div className="card-body list-container">
                            <ProjectItem name="Alginate-GelMA Cardiac Patch" date="Today, 10:30 AM" status="Active" />
                            <ProjectItem name="PEGDA Bone Scaffold" date="Yesterday, 2:15 PM" status="Completed" />
                            <ProjectItem name="Collagen Skin Graft" date="Jul 18, 2026" status="Draft" />
                        </div>
                    </div>

                    {/* Recent Predictions */}
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h3>Recent Predictions</h3>
                            <button className="text-btn">View All</button>
                        </div>
                        <div className="card-body list-container">
                            <ActivityItem 
                                message="High viability predicted for Alginate-GelMA blend (94%)" 
                                time="1 hour ago" 
                                icon={<FaCheckCircle />} 
                                type="success" 
                            />
                            <ActivityItem 
                                message="Low printability warning for formulation #829" 
                                time="3 hours ago" 
                                icon={<FaExclamationCircle />} 
                                type="warning" 
                            />
                        </div>
                    </div>

                </div>

                {/* Right Column */}
                <div className="dashboard-col-right">
                    
                    {/* AI Activity */}
                    <div className="dashboard-card ai-activity-card">
                        <div className="card-header">
                            <h3>🤖 AI Activity</h3>
                        </div>
                        <div className="card-body list-container">
                            <ActivityItem 
                                message="AI generated 3 new protocols based on your recent tissue selection." 
                                time="20 mins ago" 
                                icon={<FaRobot />} 
                                type="info" 
                            />
                            <ActivityItem 
                                message="Literature review updated: 12 new papers found for PEGDA." 
                                time="2 hours ago" 
                                icon={<FaRobot />} 
                                type="info" 
                            />
                            <ActivityItem 
                                message="Optimized crosslinking time for Project Alpha." 
                                time="Yesterday" 
                                icon={<FaRobot />} 
                                type="info" 
                            />
                            <button className="secondary-btn w-100 mt-3">Ask AI Assistant</button>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h3>Notifications</h3>
                            <div className="badge-count">2 New</div>
                        </div>
                        <div className="card-body list-container">
                            <ActivityItem 
                                message="Experiment #102 finished running." 
                                time="10 mins ago" 
                                icon={<FaBell />} 
                                type="neutral" 
                            />
                            <ActivityItem 
                                message="Team member Sarah left a comment on your protocol." 
                                time="1 hour ago" 
                                icon={<FaBell />} 
                                type="neutral" 
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
