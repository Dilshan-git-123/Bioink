import React from "react";
import "../styles/predictionDashboard.css";
import {
  FaPrint,
  FaHeartbeat,
  FaDumbbell,
  FaHourglassHalf,
  FaLink,
  FaExclamationTriangle,
  FaSpinner,
  FaExclamationCircle,
  FaFlask,
  FaCheckCircle,
  FaThumbsUp,
  FaExclamation,
  FaLightbulb,
  FaBrain
} from "react-icons/fa";

function PredictionDashboard({
  prediction,
  loading,
  error
}) {

  console.log("Dashboard prediction:", prediction);

  if (loading) {
    return (
      <div className="prediction-dashboard" style={{ background: '#f8fafc', padding: '40px', borderRadius: '16px', textAlign: 'center' }}>
        <FaSpinner className="spinner-icon" style={{ fontSize: '40px', color: '#0F4C81', animation: 'spin 1s linear infinite' }} />
        <h3 style={{ marginTop: '20px', color: '#1e293b' }}>AI Prediction Engine</h3>
        <p style={{ color: '#64748b' }}>Analyzing formulation and predicting characteristics...</p>
        <style>
          {`@keyframes spin { 100% { transform: rotate(360deg); } }`}
        </style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prediction-dashboard" style={{ background: '#fef2f2', padding: '40px', borderRadius: '16px', textAlign: 'center', border: '1px solid #fecaca' }}>
        <FaExclamationCircle className="error-icon" style={{ fontSize: '40px', color: '#ef4444' }} />
        <h3 style={{ marginTop: '20px', color: '#991b1b' }}>Analysis Failed</h3>
        <p style={{ color: '#b91c1c' }}>{error}</p>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="prediction-dashboard" style={{ background: '#f8fafc', padding: '40px', borderRadius: '16px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
        <FaFlask className="empty-icon" style={{ fontSize: '40px', color: '#94a3b8' }} />
        <h3 style={{ marginTop: '20px', color: '#334155' }}>No Active Predictions</h3>
        <p style={{ color: '#64748b' }}>Configure ingredients above and click "Run AI Analysis" to begin.</p>
      </div>
    );
  }

  // Validation failed
  if (prediction.valid === false) {
    return (
      <div className="prediction-dashboard" style={{ background: '#fef2f2', padding: '30px', borderRadius: '16px', border: '1px solid #fecaca' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <FaExclamationCircle style={{ fontSize: '32px', color: '#ef4444' }} />
          <h2 style={{ color: '#991b1b', margin: 0 }}>Validation Failed</h2>
        </div>
        <p style={{ color: '#b91c1c' }}>Please correct the following issues before running the AI prediction.</p>
        
        <div style={{ marginTop: '20px', background: '#fff', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ color: '#ef4444', fontSize: '16px', marginTop: 0 }}>Errors</h3>
          <ul style={{ color: '#475569', paddingLeft: '20px' }}>
            {prediction.errors?.map((item, index) => (
              <li key={index} style={{ marginBottom: '8px' }}>{item}</li>
            ))}
          </ul>

          {prediction.warnings?.length > 0 && (
            <>
              <h3 style={{ marginTop: '20px', color: '#eab308', fontSize: '16px' }}>Warnings</h3>
              <ul style={{ color: '#475569', paddingLeft: '20px' }}>
                {prediction.warnings.map((item, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    );
  }

  // --- Helper Functions for Sprint 12 Requirements ---

  // 7. Add color coding
  const getColor = (value, inverse = false) => {
    const v = inverse ? 100 - value : value;
    if (v >= 80) return "#22c55e"; // Green
    if (v >= 60) return "#eab308"; // Yellow
    if (v >= 40) return "#f97316"; // Orange
    return "#ef4444"; // Red
  };

  // 5. Replace raw values for Mechanical Strength
  const getStrengthRating = (val) => {
    if (val >= 80) return "Excellent";
    if (val >= 60) return "High";
    if (val >= 40) return "Moderate";
    if (val >= 20) return "Low";
    return "Very Low";
  };

  // 6. Replace degradation numbers
  const getDegradationRating = (val) => {
    if (val >= 75) return "Slow";
    if (val >= 50) return "Moderate";
    if (val >= 25) return "Fast";
    return "Very Fast";
  };

  // General ratings
  const getGeneralRating = (val, inverse = false) => {
    const v = inverse ? 100 - val : val;
    if (v >= 80) return "Excellent";
    if (v >= 60) return "Good";
    if (v >= 40) return "Moderate";
    if (v >= 20) return "Poor";
    return "Critical";
  };

  // 4. Laboratory Readiness
  const getReadiness = (printability, viability, clogging) => {
    if (printability >= 70 && viability >= 75 && clogging <= 40) {
      return { text: "Ready for Printing", color: "#22c55e", bg: "#dcfce7", icon: <FaCheckCircle /> };
    } else if (printability >= 50 && viability >= 50 && clogging <= 60) {
      return { text: "Requires Optimization", color: "#eab308", bg: "#fef9c3", icon: <FaExclamationTriangle /> };
    } else {
      return { text: "Not Recommended", color: "#ef4444", bg: "#fef2f2", icon: <FaExclamationCircle /> };
    }
  };

  // 8. Improve Overall Recommendation
  const getInsights = () => {
    const weaknesses = Array.isArray(prediction.risks) && prediction.risks.length > 0 ? [...prediction.risks] : [];
    const strengths = [];

    prediction.scientific_explanation?.forEach(exp => {
      const lower = exp.toLowerCase();
      if (lower.includes("excellent") || lower.includes("optimal") || lower.includes("ideal") || lower.includes("within the recommended")) {
        strengths.push(exp);
      } else if (!lower.includes("reduced") && !lower.includes("exceeds") && !lower.includes("below") && !lower.includes("drastically") && !lower.includes("severe")) {
         if (strengths.length < 3) strengths.push(exp);
      }
    });

    if (strengths.length === 0) strengths.push("Formulation base components are valid but synergistic properties require tuning.");
    if (weaknesses.length === 0) weaknesses.push("No significant risks or cytotoxic factors detected.");

    const suggestions = Array.isArray(prediction.suggestions) && prediction.suggestions.length > 0 
      ? prediction.suggestions 
      : [];

    return { strengths: Array.from(new Set(strengths)), weaknesses: Array.from(new Set(weaknesses)), suggestions };
  };

  const insights = getInsights();
  const readiness = getReadiness(prediction.printability_score, prediction.cell_viability, prediction.clogging_risk);
  
  // 9. Prediction Confidence (%)
  const confidence = Math.round((prediction.printability_score + prediction.cell_viability) / 2);

  const predictionsData = [
    {
      title: "Printability",
      value: prediction.printability_score,
      unit: "%",
      rating: getGeneralRating(prediction.printability_score),
      color: getColor(prediction.printability_score),
      icon: <FaPrint />,
      description: "Extrusion capability and post-print shape fidelity."
    },
    {
      title: "Cell Viability",
      value: prediction.cell_viability,
      unit: "%",
      rating: getGeneralRating(prediction.cell_viability),
      color: getColor(prediction.cell_viability),
      icon: <FaHeartbeat />,
      description: "Expected post-printing cell survival rate."
    },
    {
      title: "Mechanical Strength",
      value: prediction.mechanical_strength,
      unit: "/10",
      rating: getStrengthRating(prediction.mechanical_strength),
      color: getColor(prediction.mechanical_strength),
      icon: <FaDumbbell />,
      description: "Structural integrity and stiffness of the hydrogel."
    },
    {
      title: "Degradation Rate",
      value: prediction.degradation_rate,
      unit: "Score",
      rating: getDegradationRating(prediction.degradation_rate),
      color: getColor(prediction.degradation_rate),
      icon: <FaHourglassHalf />,
      description: "Predicted rate of biological scaffold breakdown."
    },
    {
      title: "Crosslinking",
      value: prediction.crosslinking_efficiency,
      unit: "%",
      rating: getGeneralRating(prediction.crosslinking_efficiency),
      color: getColor(prediction.crosslinking_efficiency),
      icon: <FaLink />,
      description: "Efficiency of polymer network formation."
    },
    {
      title: "Clogging Risk",
      value: prediction.clogging_risk,
      unit: "%",
      rating: getGeneralRating(prediction.clogging_risk, true),
      color: getColor(prediction.clogging_risk, true),
      icon: <FaExclamationTriangle />,
      description: "Probability of nozzle blockage during extrusion."
    }
  ];

  return (
    <div style={{ fontFamily: '"Inter", sans-serif', background: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginTop: '25px' }}>
      
      {/* Dashboard Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2 style={{ color: '#0f172a', margin: '0 0 8px 0', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaBrain style={{ color: '#3b82f6' }} /> AI Prediction Dashboard
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            AI Confidence Score: <strong style={{ color: '#10b981' }}>{confidence}%</strong>
          </p>
        </div>

        {/* Laboratory Readiness Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: readiness.bg, padding: '12px 20px', borderRadius: '12px', border: `1px solid ${readiness.color}40` }}>
          <div style={{ color: readiness.color, fontSize: '24px' }}>
            {readiness.icon}
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Laboratory Readiness</div>
            <div style={{ color: readiness.color, fontWeight: 700, fontSize: '16px' }}>{readiness.text}</div>
          </div>
        </div>
        
      </div>

      {/* Prediction Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {predictionsData.map((item, index) => (
          <div key={index} style={{ background: '#f8fafc', padding: '24px', borderRadius: '14px', border: `1px solid ${item.color}30`, position: 'relative', overflow: 'hidden', transition: 'transform 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', backgroundColor: item.color }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${item.color}15`, color: item.color, fontSize: '20px' }}>
                  {item.icon}
                </div>
                <h4 style={{ margin: 0, color: '#334155', fontSize: '15px', fontWeight: 600 }}>{item.title}</h4>
              </div>
              <span style={{ backgroundColor: `${item.color}15`, color: item.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                {item.rating}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
              <h1 style={{ margin: 0, fontSize: '36px', color: '#0f172a', fontWeight: 800, letterSpacing: '-1px' }}>
                {item.value}
              </h1>
              {item.title !== "Mechanical Strength" && item.title !== "Degradation Rate" && (
                <span style={{ fontSize: '16px', color: '#64748B', fontWeight: 600 }}>{item.unit}</span>
              )}
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', backgroundColor: '#e2e8f0', height: '6px', borderRadius: '3px', marginBottom: '16px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.max(0, item.value))}%`, backgroundColor: item.color, height: '100%', borderRadius: '3px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {/* Insights Section (Strengths, Weaknesses, Suggestions) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Strengths */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#166534', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaThumbsUp /> Strengths
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#15803d', fontSize: '14px', lineHeight: 1.6 }}>
            {insights.strengths.map((s, i) => <li key={i} style={{ marginBottom: '8px' }}>{s}</li>)}
          </ul>
        </div>

        {/* Weaknesses */}
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#991b1b', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaExclamation /> Weaknesses
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#b91c1c', fontSize: '14px', lineHeight: 1.6 }}>
            {insights.weaknesses.map((w, i) => <li key={i} style={{ marginBottom: '8px' }}>{w}</li>)}
          </ul>
        </div>

        {/* Suggestions */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e40af', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaLightbulb /> Suggestions
          </h3>
          {insights.suggestions.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#1d4ed8', fontSize: '14px', lineHeight: 1.6 }}>
              {insights.suggestions.map((s, i) => <li key={i} style={{ marginBottom: '8px' }}>{s}</li>)}
            </ul>
          ) : (
            <p style={{ margin: 0, color: '#1d4ed8', fontSize: '14px', lineHeight: 1.6 }}>
              No optimization suggestions available.
            </p>
          )}
        </div>

      </div>

    </div>
  );
}

export default PredictionDashboard;