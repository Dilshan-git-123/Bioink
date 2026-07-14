import "../styles/materialBuilder.css";
import { runPrediction } from "../services/api";

function PredictionEngine({
  selectedTissue,
  materials,
  finalMixing,
  setPrediction,
  setLoading,
  setError
}) {

  const handlePrediction = async () => {

    try {

      setLoading(true);
      setError("");

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

      console.log(JSON.stringify(payload, null, 2));

      const result = await runPrediction(payload);

      console.log("Prediction:", result);

      setPrediction(result);

    }

    catch (err) {

      console.error(err);

      setError("Prediction failed.");

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
        >
          ▶ Run AI Analysis
        </button>

      </div>

    </div>

  );

}

export default PredictionEngine;