import { useState } from "react";
import "../styles/protocolGenerator.css";
import { generateProtocol } from "../services/protocolApi";
import { downloadProtocolPDF } from "../utils/pdfGenerator";
import { parseError } from "../utils/errorHandler";

function ProtocolGenerator({ materials, finalMixing, selectedTissue, protocol, setProtocol }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleGenerate = async () => {
        setLoading(true);
        setError("");

        if (!selectedTissue) {
            setError("Please select a target tissue.");
            setLoading(false);
            return;
        }

        if (!materials || materials.length === 0) {
            setError("Please add at least one biomaterial.");
            setLoading(false);
            return;
        }

        try {
            const payload = {
                tissue: selectedTissue || "General",
                materials: (materials || []).map(mat => ({
                    biomaterial: mat.biomaterial || "Unknown Material",
                    concentration: parseFloat(mat.concentration) || 0,
                    temperature: parseFloat(mat.temperature) || 25,
                    rpm: parseFloat(mat.rpm) || 100,
                    time: parseFloat(mat.time) || 10,
                    method: mat.method || "Standard mixing"
                })),
                finalMixing: {
                    temperature: parseFloat(finalMixing?.temperature) || 25,
                    rpm: parseFloat(finalMixing?.rpm) || 100,
                    time: parseFloat(finalMixing?.time) || 10,
                    crosslinking: finalMixing?.crosslinking || "None"
                }
            };

            const data = await generateProtocol(payload);
            setProtocol(data);
        } catch (err) {
            setError(parseError(err, "Failed to generate protocol. Please try again."));
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {

    if (!protocol) {
        alert("Generate a protocol first.");
        return;
    }

    window.print();

};

const handleCopy = async () => {

    if (!protocol) {
        alert("Generate a protocol first.");
        return;
    }

    const text = `
${protocol.title}

Objective
${protocol.objective}

Required Materials
${protocol.required_materials.join("\n")}

Laboratory Procedure
${protocol.steps.map((step, i) => `${i + 1}. ${step}`).join("\n")}

Storage
${protocol.storage}

Safety
${protocol.safety.join("\n")}

Status
${protocol.status}
`;

    try {

        await navigator.clipboard.writeText(text);

        alert("Protocol copied successfully!");

    }

    catch {

        alert("Unable to copy protocol.");

    }

};

    return (
        <div className="protocol">
            <div className="protocol-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h2>📋 Generated Laboratory Protocol</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={handleGenerate} 
                        disabled={loading} 
                        style={{ 
                            background: '#0F4C81', 
                            color: 'white', 
                            border: 'none', 
                            padding: '8px 16px', 
                            borderRadius: '6px', 
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? "Generating protocol..." : "Generate Protocol"}
                    </button>
                    <button
    onClick={() =>
        downloadProtocolPDF(protocol, selectedTissue)
    }
>
    📄 PDF
</button>
                    <button onClick={handlePrint}>
    🖨 Print
</button>
                    <button onClick={handleCopy}>
    📋 Copy
</button>
                </div>
            </div>

            {error && (
                <div style={{ color: '#ef4444', marginTop: '15px', padding: '15px', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                    {error}
                </div>
            )}

            {protocol ? (
                <div className="protocol-card" style={{ marginTop: '20px', padding: '25px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#ffffff', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '20px' }}>
                        <h1 style={{ color: '#0F4C81', margin: '0 0 10px 0', fontSize: '22px' }}>{protocol.title}</h1>
                        <p style={{ margin: '0 0 10px 0', color: '#475569', fontSize: '15px' }}><strong>Objective:</strong> {protocol.objective}</p>
                        <p style={{ margin: 0, fontSize: '15px' }}>
                            <strong>Status:</strong> <span style={{ color: protocol.status?.includes('Ready') ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>{protocol.status}</span>
                        </p>
                    </div>

                    <h3 style={{ color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Required Materials</h3>
                    <ul style={{ color: '#475569', marginBottom: '25px', paddingLeft: '20px' }}>
                        {(protocol.required_materials || []).map((mat, i) => (
                            <li key={i} style={{ marginBottom: '5px' }}>{mat}</li>
                        ))}
                    </ul>

                    <h3 style={{ color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Laboratory Steps</h3>
                    <div className="steps-container" style={{ marginBottom: '25px' }}>
                        {(protocol.steps || []).map((step, i) => (
                            <div key={i} className="step" style={{ marginBottom: '12px', padding: '12px 16px', background: '#f8fafc', borderLeft: '4px solid #0F4C81', borderRadius: '4px', color: '#334155' }}>
                                <strong style={{ color: '#0F4C81', marginRight: '8px' }}>Step {i + 1}:</strong> {step}
                            </div>
                        ))}
                    </div>

                    <h3 style={{ color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Storage Conditions</h3>
                    <p style={{ color: '#475569', marginBottom: '25px', lineHeight: '1.5' }}>{protocol.storage}</p>

                    <h3 style={{ color: '#b91c1c', borderBottom: '1px solid #fecaca', paddingBottom: '5px' }}>Safety Notes</h3>
                    <ul style={{ color: '#991b1b', margin: 0, paddingLeft: '20px' }}>
                        {(protocol.safety || []).map((note, i) => (
                            <li key={i} style={{ marginBottom: '5px', lineHeight: '1.5' }}>{note}</li>
                        ))}
                    </ul>
                </div>
            ) : (
                !loading && (
                    <div className="protocol-card" style={{ marginTop: '20px', padding: '40px 20px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                        <p style={{ margin: 0, fontSize: '15px' }}>Click "Generate Protocol" to create a standard operating procedure for your current formulation.</p>
                    </div>
                )
            )}
        </div>
    );
}

export default ProtocolGenerator;