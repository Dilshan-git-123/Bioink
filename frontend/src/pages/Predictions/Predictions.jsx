import React from "react";
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
  FaMagic,
} from "react-icons/fa";

import "./Predictions.css";

const GaugeIndicator = ({ label, value, colorClass }) => (
  <div className="gauge-indicator">
    <div className="gauge-header">
      <span>{label}</span>
      <span className={colorClass}>{value}%</span>
    </div>

    <div className="gauge-track">
      <div
        className={`gauge-fill ${colorClass}`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const InsightItem = ({ icon, title, description, type }) => (
  <div className={`insight-item ${type}`}>
    <div className="insight-icon">{icon}</div>

    <div className="insight-text">
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
  </div>
);

export default function Predictions() {
  return (
    <div className="predictions-page">

      {/* ====================================================== */}
      {/* Header */}
      {/* ====================================================== */}

      <div className="pred-header">

        <div>
          <h1>AI Prediction Analytics</h1>

          <p>
            Formulation :
            <strong> Alginate-GelMA (BioInk Alpha v2.4)</strong>
          </p>
        </div>

        <div className="pred-actions">

          <button className="secondary-btn">
            <FaShareAlt />
            Share
          </button>

          <button className="primary-btn">
            <FaDownload />
            Export Report
          </button>

        </div>

      </div>

      {/* ====================================================== */}
      {/* Top Cards */}
      {/* ====================================================== */}

      <div className="metrics-row">

        <div className="metric-card">

          <h3>Overall Score</h3>

          <div className="metric-value">
            92<span>/100</span>
          </div>

          <p>Excellent Printability</p>

        </div>

        <div className="metric-card">

          <h3>AI Confidence</h3>

          <div className="metric-value">
            98<span>%</span>
          </div>

          <p>Based on 12,000 formulations</p>

        </div>

        <div className="metric-card">

          <h3>Laboratory Status</h3>

          <div className="ready-badge">

            <FaCheckCircle />

            Ready for Printing

          </div>

          <p>All parameters are within range.</p>

        </div>

      </div>

      {/* ====================================================== */}
      {/* Main Grid */}
      {/* ====================================================== */}

      <div className="pred-main-grid">

        {/* LEFT */}

        <div className="left-column">

          <div className="pred-card">

            <h2>
              <FaChartPie />
              Parameter Radar
            </h2>

            <div className="radar-placeholder">
              Interactive Radar Chart
            </div>

          </div>

          <div className="pred-card">

            <h2>
              <FaTachometerAlt />
              Scientific Metrics
            </h2>

            <GaugeIndicator
              label="Printability"
              value={95}
              colorClass="green"
            />

            <GaugeIndicator
              label="Cell Viability"
              value={88}
              colorClass="blue"
            />

            <GaugeIndicator
              label="Structural Integrity"
              value={92}
              colorClass="green"
            />

            <GaugeIndicator
              label="Degradation Rate"
              value={76}
              colorClass="orange"
            />

            <GaugeIndicator
              label="Viscosity Match"
              value={89}
              colorClass="blue"
            />

          </div>

        </div>

        {/* RIGHT */}

        <div className="right-column">

          <div className="pred-card">

            <h2>
              <FaBrain />
              AI Insights
            </h2>

            <InsightItem
              icon={<FaCheckCircle />}
              type="success"
              title="Optimal Crosslinking"
              description="UV exposure of 30 seconds gives excellent structural integrity."
            />

            <InsightItem
              icon={<FaExclamationTriangle />}
              type="warning"
              title="Degradation Risk"
              description="Increasing GelMA slightly may reduce degradation."
            />

            <InsightItem
              icon={<FaBrain />}
              type="info"
              title="Cell Behaviour"
              description="Stem cells show high compatibility with this stiffness."
            />

          </div>

          <div className="pred-card">

            <h2>
              <FaVial />
              Material Analysis
            </h2>

            <div className="material-grid">

              <div>
                <small>Yield Stress</small>
                <h3>150 Pa</h3>
              </div>

              <div>
                <small>Storage Modulus</small>
                <h3>12.4 kPa</h3>
              </div>

              <div>
                <small>Loss Modulus</small>
                <h3>1.8 kPa</h3>
              </div>

            </div>

          </div>

          <div className="pred-card">

            <h2>
              <FaMagic />
              Optimization Suggestions
            </h2>

            <ul className="suggestion-list">

              <li>Reduce print bed temperature to 15°C.</li>

              <li>Reduce print speed by 5 mm/s.</li>

              <li>Add 0.1% LAP photoinitiator.</li>

            </ul>

          </div>

        </div>

      </div>

      {/* ====================================================== */}
      {/* Compare Table */}
      {/* ====================================================== */}

      <div className="pred-card">

        <div className="pred-compare-header">

          <h2>
            <FaBalanceScale />
            Compare Formulations
          </h2>

          <button className="secondary-btn">
            Select Baseline
          </button>

        </div>

        <div className="pred-compare-wrapper">

          <table className="pred-compare-table">

            <thead>

              <tr>

                <th>Parameter</th>

                <th>Current</th>

                <th>Baseline</th>

                <th>Difference</th>

              </tr>

            </thead>

            <tbody>

              <tr>
                <td>Printability</td>
                <td>95%</td>
                <td>70%</td>
                <td className="positive">+25%</td>
              </tr>

              <tr>
                <td>Cell Viability</td>
                <td>88%</td>
                <td>85%</td>
                <td className="positive">+3%</td>
              </tr>

              <tr>
                <td>Degradation Rate</td>
                <td>76%</td>
                <td>82%</td>
                <td className="negative">-6%</td>
              </tr>

              <tr>
                <td>Viscosity Match</td>
                <td>89%</td>
                <td>95%</td>
                <td className="negative">-6%</td>
              </tr>

              <tr>
                <td>Structural Integrity</td>
                <td>92%</td>
                <td>85%</td>
                <td className="positive">+7%</td>
              </tr>

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}
