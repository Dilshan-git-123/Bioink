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
  FaFileAlt,
  FaCheckCircle,
  FaFlask
} from "react-icons/fa";

function PredictionDashboard({
  prediction,
  loading,
  error
}) {

  console.log("Dashboard prediction:", prediction);

  if (loading) {
    return (
      <div className="prediction-dashboard">
        <div className="dashboard-state-container">
          <FaSpinner className="spinner-icon" />
          <h3>AI Prediction Engine</h3>
          <p>Analyzing formulation and predicting characteristics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prediction-dashboard">
        <div className="dashboard-state-container">
          <FaExclamationCircle className="error-icon" />
          <h3>Analysis Failed</h3>
          <p style={{ color: "#EF4444" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="prediction-dashboard">
        <div className="dashboard-state-container">
          <FaFlask className="empty-icon" />
          <h3>No Active Predictions</h3>
          <p>Configure ingredients above and click "Run AI Analysis" to begin.</p>
        </div>
      </div>
    );
  }

  // Calculate overall formulation quality status based on prediction values
  const getStatus = (printability, viability) => {
    const p = parseFloat(printability) || 0;
    const v = parseFloat(viability) || 0;

    if (p >= 80 && v >= 90) {
      return { text: "Excellent", className: "status-excellent" };
    } else if (p >= 70 && v >= 80) {
      return { text: "Good", className: "status-good" };
    } else if (p >= 60 && v >= 70) {
      return { text: "Moderate", className: "status-moderate" };
    } else {
      return { text: "Poor", className: "status-poor" };
    }
  };

  const status = getStatus(prediction.printability_score, prediction.cell_viability);

  const predictions = [
    {
      title: "Printability",
      value: prediction.printability_score + "%",
      color: "#27AE60",
      icon: <FaPrint />
    },
    {
      title: "Cell Viability",
      value: prediction.cell_viability + "%",
      color: "#3498DB",
      icon: <FaHeartbeat />
    },
    {
      title: "Mechanical Strength",
      value: prediction.mechanical_strength,
      color: "#9B59B6",
      icon: <FaDumbbell />
    },
    {
      title: "Degradation",
      value: prediction.degradation_rate,
      color: "#F39C12",
      icon: <FaHourglassHalf />
    },
    {
      title: "Crosslinking",
      value: prediction.crosslinking_efficiency,
      color: "#16A085",
      icon: <FaLink />
    },
    {
      title: "Clogging Risk",
      value: prediction.clogging_risk,
      color: "#E67E22",
      icon: <FaExclamationTriangle />
    }
  ];

  return (
    <div className="prediction-dashboard">
      <div className="dashboard-header">
        <h2>📊 AI Prediction Dashboard</h2>
        <div className="status-container">
          <span>Formulation Status:</span>
          <span className={`status-badge ${status.className}`}>
            {status.text}
          </span>
        </div>
      </div>

      <div className="prediction-grid">
        {predictions.map((item, index) => (
          <div
            className="prediction-card"
            key={index}
            style={{ color: item.color }}
          >
            <div 
              className="card-icon-container" 
              style={{ backgroundColor: `${item.color}15`, color: item.color }}
            >
              {item.icon}
            </div>
            <h4>{item.title}</h4>
            <h1 style={{ color: item.color }}>
              {item.value}
            </h1>
          </div>
        ))}
      </div>

      <div className="recommendation-panel">
        <div className="recommendation-section">
          <h3>
            <FaCheckCircle style={{ color: "#0F4C81" }} /> Overall Recommendation
          </h3>
          <p>{prediction.overall_recommendation}</p>
        </div>

        {prediction.scientific_explanation && prediction.scientific_explanation.length > 0 && (
          <div className="recommendation-section">
            <h3>
              <FaFileAlt style={{ color: "#0F4C81" }} /> Scientific Explanation
            </h3>
            <ul className="explanation-list">
              {prediction.scientific_explanation.map((item, index) => (
                <li key={index} className="explanation-item">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default PredictionDashboard;