import { useState } from "react";
import { runOptimization } from "../services/optimizationApi";
import { parseError } from "../utils/errorHandler";

function OptimizationPanel({

    materials,

    finalMixing,

    selectedTissue

}) {

    const [result, setResult] = useState(null);

    const [loading, setLoading] = useState(false);
    
    const [validationError, setValidationError] = useState("");

    const optimize = async () => {

        setLoading(true);
        setValidationError("");

        const payload = {

            tissue: selectedTissue,

            materials,

            finalMixing

        };

        try {

            const response = await runOptimization(payload);

            setResult(response);

        }

        catch (err) {

            if (err.validationErrors) {
                setValidationError(err.validationErrors.join("\n"));
            } else {
                setValidationError(parseError(err, "Optimization failed. Please check your network and try again."));
            }

        }

        finally {

            setLoading(false);

        }

    };

    return (

        <div className="prediction-dashboard">

            <div className="dashboard-header">

                <h2>🧠 AI Optimization Engine</h2>

                <button
                    className="predict-btn"
                    onClick={optimize}
                    disabled={loading}
                    style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                >

                    {loading ? "Optimizing bioink..." : "Optimize Formulation"}

                </button>

            </div>
            
            {validationError && (
                <div className="error-message" style={{ color: "red", whiteSpace: "pre-wrap", marginBottom: "15px" }}>
                    {validationError}
                </div>
            )}

            {loading && <p>Analyzing formulation...</p>}

            {result && (

                <>

                    <h3>Optimization Suggestions</h3>

                    {result.optimization_suggestions.map((item, index) => (

                        <div
                            key={index}
                            className="prediction-card"
                            style={{
                                marginBottom: "15px"
                            }}
                        >

                            <h4>{item.parameter}</h4>

                            <p>

                                <strong>Current:</strong>{" "}

                                {item.current}

                            </p>

                            <p>

                                <strong>Recommended:</strong>{" "}

                                {item.recommended}

                            </p>

                            <p>

                                {item.reason}

                            </p>

                        </div>

                    ))}

                    <h3>

                        Expected Improvement

                    </h3>

                    <div className="prediction-grid">

                        <div className="prediction-card">

                            <h4>Cell Viability</h4>

                            <h2>

                                {

                                    result.predicted_improvement.cell_viability

                                }%

                            </h2>

                        </div>

                        <div className="prediction-card">

                            <h4>Printability</h4>

                            <h2>

                                {

                                    result.predicted_improvement.printability

                                }%

                            </h2>

                        </div>

                        <div className="prediction-card">

                            <h4>

                                Mechanical Strength

                            </h4>

                            <h2>

                                {

                                    result.predicted_improvement.mechanical_strength

                                }

                            </h2>

                        </div>

                    </div>

                </>

            )}

        </div>

    );

}

export default OptimizationPanel;
