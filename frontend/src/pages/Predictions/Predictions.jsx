import React from 'react';
import { 
    FaDownload, 
    FaShareAlt, 
    FaChartPie, 
    FaBrain, 
    FaCheckCircle, 
    FaExclamationTriangle,
    FaVial,
    FaTachometerAlt,
    FaBalanceScale,
    FaMagic
} from 'react-icons/fa';
import './Predictions.css';

const GaugeIndicator = ({ label, value, colorClass }) => (
    <div className="gauge-indicator">
        <div className="gauge-header">
            <span className="gauge-label">{label}</span>
            <span className={`gauge-value ${colorClass}`}>{value}%</span>
        </div>
        <div className="gauge-bar-bg">
            <div className={`gauge-bar-fill ${colorClass}`} style={{ width: `${value}%` }}></div>
        </div>
    </div>
);

const InsightItem = ({ title, description, type }) => {
    const icons = {
        success: <FaCheckCircle className="text-success" />,
        warning: <FaExclamationTriangle className="text-warning" />,
        info: <FaBrain className="text-info" />
    };
    return (
        <div className={`insight-item type-${type}`}>
            <div className="insight-icon">{icons[type]}</div>
            <div className="insight-content">
                <h5>{title}</h5>
                <p>{description}</p>
            </div>
        </div>
    );
};

const Predictions = () => {
    return (
        <div className="predictions-page">
            
            {/* Header Section */}
            <div className="pred-header">
                <div className="pred-title-area">
                    <h1>AI Prediction Analytics</h1>
                    <p>Formulation: <strong>Alginate-GelMA (Bioink Alpha v2.4)</strong></p>
                </div>
                <div className="pred-actions">
                    <button className="secondary-btn"><FaShareAlt /> Share</button>
                    <button className="primary-btn"><FaDownload /> Export Report</button>
                </div>
            </div>

            {/* Top Metrics Row */}
            <div className="metrics-row">
                <div className="metric-card primary-metric">
                    <h3>Overall Score</h3>
                    <div className="metric-value highlight">92<span className="metric-unit">/100</span></div>
                    <p className="metric-trend positive">Excellent printability</p>
                </div>
                <div className="metric-card">
                    <h3>AI Confidence</h3>
                    <div className="metric-value">98<span className="metric-unit">%</span></div>
                    <p className="metric-trend neutral">Based on 12k data points</p>
                </div>
                <div className="metric-card status-card">
                    <h3>Laboratory Readiness</h3>
                    <div className="status-badge ready">
                        <FaCheckCircle /> Ready for Print
                    </div>
                    <p className="status-desc">Meets all physical parameters</p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="pred-main-grid">
                
                {/* Left Column: Charts and Gauges */}
                <div className="pred-left-col">
                    <div className="pred-card">
                        <div className="card-header">
                            <h3><FaChartPie /> Parameter Radar</h3>
                        </div>
                        <div className="radar-placeholder">
                            <div className="radar-grid-bg"></div>
                            <p>Interactive Radar Chart Rendering...</p>
                        </div>
                    </div>

                    <div className="pred-card">
                        <div className="card-header">
                            <h3><FaTachometerAlt /> Scientific Metrics</h3>
                        </div>
                        <div className="gauges-container">
                            <GaugeIndicator label="Printability Score" value={95} colorClass="excellent" />
                            <GaugeIndicator label="Cell Viability (Day 7)" value={88} colorClass="good" />
                            <GaugeIndicator label="Structural Integrity" value={92} colorClass="excellent" />
                            <GaugeIndicator label="Degradation Rate" value={76} colorClass="warning" />
                            <GaugeIndicator label="Viscosity Match" value={89} colorClass="good" />
                        </div>
                    </div>
                </div>

                {/* Right Column: Insights & Analysis */}
                <div className="pred-right-col">
                    <div className="pred-card ai-insights-card">
                        <div className="card-header">
                            <h3><FaBrain /> AI Insights Panel</h3>
                        </div>
                        <div className="insights-container">
                            <InsightItem 
                                type="success"
                                title="Optimal Crosslinking Detected"
                                description="The predicted UV exposure time of 30 seconds yields a 92% structural integrity match."
                            />
                            <InsightItem 
                                type="warning"
                                title="Slight Degradation Risk"
                                description="Consider increasing GelMA concentration by 0.5% to slow down the degradation rate in vivo."
                            />
                            <InsightItem 
                                type="info"
                                title="Cell Viability Trend"
                                description="Historical data suggests MSCs respond highly favorably to this exact stiffness profile (12 kPa)."
                            />
                        </div>
                    </div>

                    <div className="pred-card">
                        <div className="card-header">
                            <h3><FaVial /> Material Analysis</h3>
                        </div>
                        <div className="material-stats">
                            <div className="mat-stat">
                                <span>Yield Stress</span>
                                <strong>150 Pa</strong>
                            </div>
                            <div className="mat-stat">
                                <span>Storage Modulus (G')</span>
                                <strong>12.4 kPa</strong>
                            </div>
                            <div className="mat-stat">
                                <span>Loss Modulus (G")</span>
                                <strong>1.8 kPa</strong>
                            </div>
                        </div>
                    </div>

                    <div className="pred-card optimization-card">
                        <div className="card-header">
                            <h3><FaMagic /> Optimization Suggestions</h3>
                        </div>
                        <ul className="suggestion-list">
                            <li>Lower print bed temperature to <strong>15°C</strong> for better shape fidelity.</li>
                            <li>Reduce printing speed by <strong>5 mm/s</strong> to eliminate under-extrusion risks.</li>
                            <li>Add <strong>0.1% LAP</strong> photoinitiator to boost crosslinking efficiency.</li>
                        </ul>
                    </div>
                </div>

            </div>

            {/* Bottom Section: Compare Formulations */}
            <div className="pred-bottom-section">
                <div className="pred-card">
                    <div className="card-header">
                        <h3><FaBalanceScale /> Compare Formulations</h3>
                        <button className="text-btn">Select Baseline</button>
                    </div>
                    <div className="compare-table-placeholder">
                        <table className="compare-table">
                            <thead>
                                <tr>
                                    <th>Parameter</th>
                                    <th>Current (Alpha v2.4)</th>
                                    <th>Baseline (Standard Alg)</th>
                                    <th>Difference</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Printability</td>
                                    <td className="highlight-cell">95%</td>
                                    <td>70%</td>
                                    <td className="text-success">+25%</td>
                                </tr>
                                <tr>
                                    <td>Viability</td>
                                    <td className="highlight-cell">88%</td>
                                    <td>85%</td>
                                    <td className="text-success">+3%</td>
                                </tr>
                                <tr>
                                    <td>Degradation</td>
                                    <td className="highlight-cell">14 Days</td>
                                    <td>7 Days</td>
                                    <td className="text-info">+7 Days</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Predictions;
