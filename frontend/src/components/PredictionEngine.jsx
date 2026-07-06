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
        alginate: 0,
        gelatin: 0,
        pectin: 0,
        pluronic: 0
      };

      materials.forEach((material) => {

        const name = material.biomaterial.toLowerCase();

        const value = parseFloat(material.concentration) || 0;

        if (name === "alginate") payload.alginate = value;

        if (name === "gelatin") payload.gelatin = value;

        if (name === "pectin") payload.pectin = value;

        if (name === "pluronic") payload.pluronic = value;

      });

      console.log("Sending to Backend:", payload);

      const result = await runPrediction(payload);

      console.log(JSON.stringify(result, null, 2));

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