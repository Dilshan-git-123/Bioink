import "../styles/materialBuilder.css";
import { runPrediction } from "../services/api";
import { parseError } from "../utils/errorHandler";

function PredictionEngine({
  selectedTissue,
  materials,
  finalMixing,
  setPrediction,
  loading,
  setLoading,
  setError
}) {

  const handlePrediction = async () => {

    try {

      setLoading(true);
      setError("");

      if (!selectedTissue) {
        throw new Error("Please select a target tissue.");
      }

      if (!materials || materials.length === 0) {
        throw new Error("Please add at least one biomaterial.");
      }

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

        materials: materials.map((material) => ({

          biomaterial: material.biomaterial,

          concentration: parseFloat(material.concentration) || 0,

          temperature: parseFloat(material.temperature) || 0,

          rpm: parseFloat(material.rpm) || 0,

          time: parseFloat(material.time) || 0,

          method: material.method || ""

        })),

        finalMixing: {

          temperature: parseFloat(finalMixing?.temperature) || 0,

          rpm: parseFloat(finalMixing?.rpm) || 0,

          time: parseFloat(finalMixing?.time) || 0,

          crosslinking: finalMixing?.crosslinking || ""

        }

      };

      const result = await runPrediction(payload);

      setPrediction(result);

    }

    catch (err) {

      setError(parseError(err, "Analysis failed. Please try again."));

    }

    finally {

      setLoading(false);

    }

  };

  return (

    <div className="predict-card">

      <div className="predict-content">

        <h2>🧠 AI Prediction Engine</h2>

        <p>
          Analyze your complete bioink formulation using
          BioInkAI's intelligent prediction engine.
        </p>

        <button
          className="predict-btn"
          onClick={handlePrediction}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? "Predicting formulation..." : "▶ Run AI Analysis"}
        </button>

      </div>

    </div>

  );

}

export default PredictionEngine;