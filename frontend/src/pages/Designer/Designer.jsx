import TissueSelector from "../../components/TissueSelector";
import MaterialBuilder from "../../components/MaterialBuilder";
import FinalMixing from "../../components/FinalMixing";
import PredictionDashboard from "../../components/PredictionDashboard";
import ProtocolGenerator from "../../components/ProtocolGenerator";
import LiteraturePanel from "../../components/LiteraturePanel";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PredictionEngine from "../../components/PredictionEngine";
import OptimizationPanel from "../../components/OptimizationPanel";
import { getTissueRecommendation } from "../../services/tissueApi";
import { useProject } from "../../context/ProjectContext";

import "../../styles/layout.css";

import heroImage from "../../assets/bioink-hero.png";

function Designer() {
  const navigate = useNavigate();
  const { activeProject, updateProject, saveActiveProject, isSaving, lastSaved } = useProject();

  const handleManualSave = async () => {
    if (activeProject) {
      try {
        await saveActiveProject(activeProject.projectId);
      } catch (err) {
        console.error("Manual save failed:", err);
      }
    }
  };

  const [selectedTissue, setSelectedTissue] = useState("");
  const emptyMaterial = {
  biomaterial: "",
  concentration: "",
  temperature: "",
  rpm: "",
  time: "",
  method: ""
};

const [materials, setMaterials] = useState([
  { ...emptyMaterial }
]);

const [finalMixing, setFinalMixing] = useState({
  temperature: "",
  time: "",
  rpm: "",
  crosslinking: "CaCl₂"
});

const [prediction, setPrediction] = useState(null);
const [protocol, setProtocol] = useState(null);

const [loading, setLoading] = useState(false);

const [error, setError] = useState("");

const [tissueRecommendation, setTissueRecommendation] = useState(null);

  // ── Sync state FROM active project when project changes (open / continue) ──
  useEffect(() => {
    if (!activeProject) return;
    setSelectedTissue(activeProject.selectedTissue || "");
    setMaterials(activeProject.materials?.length > 0 ? activeProject.materials : [{ biomaterial: "", concentration: "", temperature: "", rpm: "", time: "", method: "" }]);
    setFinalMixing(activeProject.finalMixing || { temperature: "", time: "", rpm: "", crosslinking: "CaCl₂" });
    setPrediction(activeProject.prediction || null);
    setProtocol(activeProject.protocol || null);
  // Run whenever the active project ID changes (new project OR continue old one)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.projectId]);

  // ── Sync tissue selection BACK to active project ─────────────────────────
  useEffect(() => {
    if (activeProject) {
      updateProject(activeProject.projectId, { selectedTissue });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTissue]);

  // ── Sync materials BACK to active project ────────────────────────────────
  useEffect(() => {
    if (activeProject) {
      updateProject(activeProject.projectId, { materials });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materials]);

  // ── Sync prediction BACK to active project ───────────────────────────────
  useEffect(() => {
    if (activeProject) {
      updateProject(activeProject.projectId, { prediction });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prediction]);

  // ── Sync final mixing BACK to active project ─────────────────────────────
  useEffect(() => {
    if (activeProject) {
      updateProject(activeProject.projectId, { finalMixing });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalMixing]);

  // ── Sync protocol BACK to active project ─────────────────────────────────
  useEffect(() => {
    if (activeProject) {
      updateProject(activeProject.projectId, { protocol });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocol]);

  // ── Tissue recommendation fetching (unchanged) ───────────────────────────
  useEffect(() => {
  if (!selectedTissue) {
    setTissueRecommendation(null);
    return;
  }

  async function fetchRecommendation() {
    try {
      const data = await getTissueRecommendation(selectedTissue);
      setTissueRecommendation(data);
    } catch (err) {
      console.error(err);
      setTissueRecommendation(null);
    }
  }

  fetchRecommendation();
}, [selectedTissue]);

  return (
    <>

          {/* ================= Hero Section ================= */}

          <div className="hero">

            <div className="hero-left">

              <h1>🧬 BioInk Designer</h1>

              {activeProject && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '6px 14px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#1E3A8A', fontWeight: 600 }}>📁 {activeProject.projectName}</span>
                  <span style={{ fontSize: '12px', color: activeProject.status === 'Completed' ? '#166534' : '#2563EB', background: activeProject.status === 'Completed' ? '#DCFCE7' : '#DBEAFE', borderRadius: '20px', padding: '2px 8px', fontWeight: 500 }}>{activeProject.status}</span>
                  
                  <button 
                    onClick={handleManualSave}
                    disabled={isSaving}
                    style={{ 
                      fontSize: '11px', 
                      color: 'white', 
                      background: '#0F4C81', 
                      border: 'none', 
                      borderRadius: '6px', 
                      padding: '4px 10px', 
                      cursor: 'pointer',
                      fontWeight: 600,
                      opacity: isSaving ? 0.7 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isSaving ? "Saving..." : "Save Project"}
                  </button>
                  {lastSaved && (
                    <span style={{ fontSize: '11px', color: '#667085' }}>Last saved: {lastSaved}</span>
                  )}
                </div>
              )}

              <p>
                Create, optimize and validate bioinks using
                AI-powered scientific predictions for tissue
                engineering and 3D bioprinting.
              </p>

              <div className="hero-buttons">

                <button className="primary-btn" onClick={() => navigate('/projects')}>
                  + New Project
                </button>

                <button className="secondary-btn">
                  Import Formulation
                </button>

                <button className="secondary-btn">
                  Templates
                </button>

              </div>

            </div>

            <div className="hero-right">

              <img
                src={heroImage}
                alt="BioInk Hero"
                className="hero-image"
              />

            </div>

          </div>

          {/* ================= Workspace ================= */}

          <div className="workspace-grid">

            {/* Left Panel */}

            <div className="left-panel">

              <TissueSelector
    selectedTissue={selectedTissue}
    setSelectedTissue={setSelectedTissue}
/>

              <MaterialBuilder
  materials={materials}
  setMaterials={setMaterials}
/>

              <FinalMixing
  finalMixing={finalMixing}
  setFinalMixing={setFinalMixing}
/>

<PredictionEngine
  selectedTissue={selectedTissue}
  materials={materials}
  finalMixing={finalMixing}
  setPrediction={setPrediction}
  setLoading={setLoading}
  setError={setError}
/>

<PredictionDashboard
  prediction={prediction}
  loading={loading}
  error={error}
/>

<OptimizationPanel

    materials={materials}

    finalMixing={finalMixing}

    selectedTissue={selectedTissue}

/>

<ProtocolGenerator
    materials={materials}
    finalMixing={finalMixing}
    selectedTissue={selectedTissue}
    protocol={protocol}
    setProtocol={setProtocol}
/>

<LiteraturePanel />

            </div>

            {/* Right Panel */}

            <div className="right-panel">

              <h2 className="ai-title">
                🤖 AI Research Assistant
              </h2>

              <div className="ai-card">

                <h4>Welcome</h4>

                <p>
                  Select a target tissue to begin designing your
                  bioink.

                  AI suggestions, recommended biomaterials,
                  protocols and scientific literature will
                  automatically appear here.
                </p>

              </div>

              <div className="ai-card">

                <h4>Current Status</h4>

                <p>
                  Waiting for tissue selection...
                </p>

              </div>

            </div>

            </div>

          

      <button 
        className="floating-ai-btn"
        onClick={() => alert("BioInkAI Assistant will be available soon.")}
        aria-label="BioInkAI Assistant"
      >
        🤖
      </button>

    </>
  );
}

export default Designer;