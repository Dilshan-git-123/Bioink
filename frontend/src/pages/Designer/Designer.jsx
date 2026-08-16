// Designer page for BioInk AI
import TissueSelector from "../../components/TissueSelector";
import MaterialBuilder from "../../components/MaterialBuilder";
import FinalMixing from "../../components/FinalMixing";
import PredictionDashboard from "../../components/PredictionDashboard";
import ProtocolGenerator from "../../components/ProtocolGenerator";
import ReferenceProtocol from "../../components/ReferenceProtocol";
import LiteratureReferenceProtocol from "../../components/LiteratureReferenceProtocol";
import LiteraturePanel from "../../components/LiteraturePanel";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getTissueRecommendation } from "../../services/tissueApi";
import { createExperiment } from "../../services/experimentService";
import * as PredictionService from "../../api/predictionService";
import { useProject } from "../../context/ProjectContext"; // Added import

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
  const [materials, setMaterials] = useState([{ ...emptyMaterial }]);
  const [finalMixing, setFinalMixing] = useState({
    temperature: "",
    time: "",
    rpm: "",
    crosslinking: "CaCl₂"
  });
  const [prediction, setPrediction] = useState(null);
  const [protocol, setProtocol] = useState(null);
  const [referenceProtocol, setReferenceProtocol] = useState(null);
  const [litProtocol, setLitProtocol] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tissueRecommendation, setTissueRecommendation] = useState(null);

  // Hydration ref to avoid initial overwriting or layout sync loops
  const hydratedProjectIdRef = useRef(null);

  // Helper to check if materials list is equivalent (empty vs single-empty-row)
  const isMaterialsEquivalent = (a, b) => {
    const listA = a || [];
    const listB = b || [];
    if (listA.length === 0 && listB.length === 0) return true;
    const isEmptyRow = (item) => {
      return !item.biomaterial && !item.concentration && !item.temperature && !item.rpm && !item.time && !item.method;
    };
    if (listA.length === 0 && listB.length === 1 && isEmptyRow(listB[0])) return true;
    if (listB.length === 0 && listA.length === 1 && isEmptyRow(listA[0])) return true;
    return JSON.stringify(listA) === JSON.stringify(listB);
  };

  // Helper to check if final mixing object is equivalent (null/empty vs defaults)
  const isFinalMixingEquivalent = (a, b) => {
    if (!a && !b) return true;
    const defaultFM = { temperature: "", time: "", rpm: "", crosslinking: "CaCl₂" };
    const valA = a || defaultFM;
    const valB = b || defaultFM;
    return JSON.stringify(valA) === JSON.stringify(valB);
  };

  // ─── Synchronise state from active project (Hydration) ─────────────────────
  useEffect(() => {
    if (!activeProject) {
      hydratedProjectIdRef.current = null;
      return;
    }

    if (hydratedProjectIdRef.current !== activeProject.projectId) {
      console.info("[BioInkAI] Hydrating Designer from project:", activeProject.projectId);
      setSelectedTissue(activeProject.selectedTissue || "");
      setMaterials(activeProject.materials?.length > 0 ? activeProject.materials : [{ ...emptyMaterial }]);
      setFinalMixing(activeProject.finalMixing || { temperature: "", time: "", rpm: "", crosslinking: "CaCl₂" });
      setPrediction(activeProject.prediction || null);
      setProtocol(activeProject.protocol || null);
      hydratedProjectIdRef.current = activeProject.projectId;
    }
  }, [activeProject?.projectId]);

  // ─── Sync selections back to project (User Edits only) ─────────────────────
  useEffect(() => {
    if (activeProject && hydratedProjectIdRef.current === activeProject.projectId) {
      if ((selectedTissue || "") !== (activeProject.selectedTissue || "")) {
        updateProject(activeProject.projectId, { selectedTissue });
      }
    }
  }, [selectedTissue, activeProject?.projectId]);

  useEffect(() => {
    if (activeProject && hydratedProjectIdRef.current === activeProject.projectId) {
      if (!isMaterialsEquivalent(materials, activeProject.materials)) {
        updateProject(activeProject.projectId, { materials });
      }
    }
  }, [materials, activeProject?.projectId]);

  useEffect(() => {
    if (activeProject && hydratedProjectIdRef.current === activeProject.projectId) {
      if (JSON.stringify(prediction) !== JSON.stringify(activeProject.prediction || null)) {
        updateProject(activeProject.projectId, { prediction });
      }
    }
  }, [prediction, activeProject?.projectId]);

  useEffect(() => {
    if (activeProject && hydratedProjectIdRef.current === activeProject.projectId) {
      if (!isFinalMixingEquivalent(finalMixing, activeProject.finalMixing)) {
        updateProject(activeProject.projectId, { finalMixing });
      }
    }
  }, [finalMixing, activeProject?.projectId]);

  useEffect(() => {
    if (activeProject && hydratedProjectIdRef.current === activeProject.projectId) {
      if (JSON.stringify(protocol) !== JSON.stringify(activeProject.protocol || null)) {
        updateProject(activeProject.projectId, { protocol });
      }
    }
  }, [protocol, activeProject?.projectId]);

  // Auto‑record experiment after prediction
  const prevPredictionRef = useRef(null);
  useEffect(() => {
    if (!prediction || prediction === prevPredictionRef.current) return;
    prevPredictionRef.current = prediction;
    if (!activeProject) return;
    const expPayload = {
      project_id: activeProject.projectId || "unknown",
      project_name: activeProject.projectName || "Unnamed Project",
      tissue_type: selectedTissue || null,
      biomaterials: materials,
      final_mixing: finalMixing,
      prediction_results: prediction,
      compatibility_analysis: prediction?.compatibilityAnalysis || null,
      generated_protocol: protocol ? JSON.stringify(protocol) : null,
      user_notes: null,
      is_favorite: false
    };
    createExperiment(expPayload)
      .then(() => console.info("[BioInkAI] Experiment auto‑recorded."))
      .catch(err => console.warn("[BioInkAI] Could not record experiment:", err));
  }, [prediction]);

  // Tissue recommendation fetch
  useEffect(() => {
    if (!selectedTissue) { setTissueRecommendation(null); return; }
    async function fetchRecommendation() {
      try { const data = await getTissueRecommendation(selectedTissue); setTissueRecommendation(data); }
      catch (err) { console.error(err); setTissueRecommendation(null); }
    }
    fetchRecommendation();
  }, [selectedTissue]);

  // Predict handler using PredictionService
  const handlePredict = async () => {
    try {
      setLoading(true);
      setError("");
      if (!selectedTissue) throw new Error("Please select a target tissue.");
      if (!materials || materials.length === 0) throw new Error("Please add at least one biomaterial.");
      for (let i = 0; i < materials.length; i++) {
        const mat = materials[i];
        if (!mat.biomaterial || !mat.concentration || !mat.temperature || !mat.rpm || !mat.time || !mat.method) {
          throw new Error(`Please complete all fields for Material ${i + 1}.`);
        }
      }
      if (!finalMixing?.temperature || !finalMixing?.rpm || !finalMixing?.time || !finalMixing?.crosslinking) {
        throw new Error("Please complete all Final Mixing parameters.");
      }
      const payload = {
        tissue: selectedTissue,
        materials: materials.map(m => ({
          biomaterial: m.biomaterial,
          concentration: parseFloat(m.concentration) || 0,
          temperature: parseFloat(m.temperature) || 0,
          rpm: parseFloat(m.rpm) || 0,
          time: parseFloat(m.time) || 0,
          method: m.method || ""
        })),
        finalMixing: {
          temperature: parseFloat(finalMixing?.temperature) || 0,
          rpm: parseFloat(finalMixing?.rpm) || 0,
          time: parseFloat(finalMixing?.time) || 0,
          crosslinking: finalMixing?.crosslinking || ""
        }
      };
      const result = await PredictionService.predict(payload);

      // The backend returns:
      //   { success, prediction: { printability_score, cell_viability, ... },
      //     scores, warnings, recommendations, scientific_explanations, risks }
      //
      // PredictionDashboard expects the metrics at the TOP level of the prop
      // (e.g. prediction.printability_score, not prediction.prediction.printability_score).
      // We flatten result.prediction + surrounding arrays into one object.
      if (result && result.success && result.prediction) {
        setPrediction({
          // All numeric prediction metrics (printability_score, cell_viability, etc.)
          ...result.prediction,
          // Attach supporting arrays so PredictionDashboard insight panels work
          warnings: result.warnings || [],
          recommendations: result.recommendations || [],
          scientific_explanation: result.scientific_explanations || [],
          risks: result.risks || [],
          scores: result.scores || {},
          // "suggestions" maps to recommendations for the Suggestions panel
          suggestions: result.recommendations || [],
        });
      } else if (result && !result.success) {
        // Engine returned a validation failure inside the response body
        const msgs = Array.isArray(result.errors) ? result.errors.join('; ') : 'Prediction failed.';
        throw new Error(msgs);
      } else {
        throw new Error('Unexpected response from prediction server.');
      }
    } catch (err) {
      setError(err.message || "Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <div className="hero">
        <div className="hero-left">
          <h1>🧬 BioInk Designer</h1>
          {activeProject && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '6px 14px', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#1E3A8A', fontWeight: 600 }}>📁 {activeProject.projectName}</span>
              <span style={{ fontSize: '12px', color: activeProject.status === 'Completed' ? '#166534' : '#2563EB', background: activeProject.status === 'Completed' ? '#DCFCE7' : '#DBEAFE', borderRadius: '20px', padding: '2px 8px', fontWeight: 500 }}>{activeProject.status}</span>
              <button onClick={handleManualSave} disabled={isSaving} style={{ fontSize: '11px', color: 'white', background: '#0F4C81', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontWeight: 600, opacity: isSaving ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {isSaving ? "Saving..." : "Save Project"}
              </button>
              {lastSaved && (<span style={{ fontSize: '11px', color: '#667085' }}>Last saved: {lastSaved}</span>)}
            </div>
          )}
          <p>Create, optimize and validate bioinks using AI-powered scientific predictions for tissue engineering and 3D bioprinting.</p>
          <div className="hero-buttons">
            <button className="primary-btn" onClick={() => navigate('/projects')}>+ New Project</button>
            <button className="secondary-btn">Import Formulation</button>
            <button className="secondary-btn">Templates</button>
          </div>
        </div>
        <div className="hero-right">
          <img src={heroImage} alt="BioInk Hero" className="hero-image" />
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="workspace-grid">
        {/* Left Panel */}
        <div className="left-panel">
          <TissueSelector selectedTissue={selectedTissue} setSelectedTissue={setSelectedTissue} />
          <MaterialBuilder materials={materials} setMaterials={setMaterials} />
          <FinalMixing finalMixing={finalMixing} setFinalMixing={setFinalMixing} />
          <div style={{ marginTop: '16px' }}>
            <button className="predict-btn" onClick={handlePredict} disabled={loading} style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? "Predicting..." : "▶ Run AI Analysis"}
            </button>
            {error && <p style={{ color: 'red', marginTop: '8px' }}>{error}</p>}
          </div>
          <PredictionDashboard prediction={prediction} loading={loading} error={error} />
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <ProtocolGenerator
              materials={materials}
              finalMixing={finalMixing}
              selectedTissue={selectedTissue}
              protocol={protocol}
              setProtocol={setProtocol}
            />
            <ReferenceProtocol
              materials={materials}
              finalMixing={finalMixing}
              selectedTissue={selectedTissue}
              referenceProtocol={referenceProtocol}
              setReferenceProtocol={setReferenceProtocol}
            />
          </div>
          <LiteratureReferenceProtocol
            materials={materials}
            finalMixing={finalMixing}
            selectedTissue={selectedTissue}
            litProtocol={litProtocol}
            setLitProtocol={setLitProtocol}
          />
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <h2 className="ai-title">🤖 AI Research Assistant</h2>
          <div className="ai-card">
            <h4>Welcome</h4>
            <p>Select a target tissue to begin designing your bioink. AI suggestions, recommended biomaterials, protocols and scientific literature will automatically appear here.</p>
          </div>
          <div className="ai-card">
            <h4>Current Status</h4>
            <p>Waiting for tissue selection...</p>
          </div>
        </div>
      </div>

      <button className="floating-ai-btn" onClick={() => alert("BioInkAI Assistant will be available soon.")} aria-label="BioInkAI Assistant">🤖</button>
    </>
  );
}

export default Designer;