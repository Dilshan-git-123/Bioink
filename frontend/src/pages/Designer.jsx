import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import TissueSelector from "../components/TissueSelector";
import MaterialBuilder from "../components/MaterialBuilder";
import FinalMixing from "../components/FinalMixing";
import PredictionDashboard from "../components/PredictionDashboard";
import ProtocolGenerator from "../components/ProtocolGenerator";
import LiteraturePanel from "../components/LiteraturePanel";
import { useState } from "react";
import PredictionEngine from "../components/PredictionEngine";

import "../styles/layout.css";

import heroImage from "../assets/bioink-hero.png";

function Designer() {
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

const [loading, setLoading] = useState(false);

const [error, setError] = useState("");

  return (
    <div className="app-layout">

      <Sidebar />

      <div className="main-content">

        <Header />

        <div className="workspace">

          {/* ================= Hero Section ================= */}

          <div className="hero">

            <div className="hero-left">

              <h1>🧬 BioInk Designer</h1>

              <p>
                Create, optimize and validate bioinks using
                AI-powered scientific predictions for tissue
                engineering and 3D bioprinting.
              </p>

              <div className="hero-buttons">

                <button className="primary-btn">
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

<ProtocolGenerator
    materials={materials}
    finalMixing={finalMixing}
    selectedTissue={selectedTissue}
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

        </div>

      </div>

      <button 
        className="floating-ai-btn"
        onClick={() => alert("BioInkAI Assistant will be available soon.")}
        aria-label="BioInkAI Assistant"
      >
        🤖
      </button>

    </div>
  );
}

export default Designer;