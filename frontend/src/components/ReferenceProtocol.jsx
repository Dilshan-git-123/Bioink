import { useState } from "react";
import "../styles/protocolGenerator.css";
import { generateReferenceProtocol } from "../services/protocolApi";
import { downloadReferenceProtocolPDF } from "../utils/pdfGenerator";
import { parseError } from "../utils/errorHandler";

export function normalizeProtocolStep(step, index) {
  if (typeof step === 'string') {
    return {
      step_number: index + 1,
      title: "",
      instruction: step,
      parameters: {},
      source: null
    };
  }
  if (step && typeof step === 'object') {
    if ('instruction' in step && 'step_number' in step) {
      return {
        step_number: step.step_number || index + 1,
        title: step.title || "",
        instruction: step.instruction || "",
        parameters: step.parameters || {},
        source: step.source || null
      };
    }
    const keys = Object.keys(step);
    if (keys.length > 0) {
      const key = keys.find(k => k.toLowerCase().includes('step')) || keys[0];
      return {
        step_number: index + 1,
        title: "",
        instruction: String(step[key]),
        parameters: {},
        source: null
      };
    }
  }
  return {
    step_number: index + 1,
    title: "",
    instruction: String(step),
    parameters: {},
    source: null
  };
}

function ReferenceProtocol({ materials, finalMixing, selectedTissue, referenceProtocol, setReferenceProtocol }) {
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

            const data = await generateReferenceProtocol(payload);
            setReferenceProtocol(data);
        } catch (err) {
            setError(parseError(err, "Failed to generate reference protocol. Please try again."));
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (!referenceProtocol) {
            alert("Generate a reference protocol first.");
            return;
        }
        window.print();
    };

    const handleCopy = async () => {
        if (!referenceProtocol) {
            alert("Generate a reference protocol first.");
            return;
        }

        const isPlaceholderRef = (refStr) => {
            if (!refStr) return true;
            const str = String(refStr).toLowerCase();
            return str.includes('[placeholder') ||
                   str.includes('placeholder') ||
                   str.includes('todo') ||
                   str.includes('unknown author') ||
                   str.includes('unknown journal');
        };

        const cleanRefs = (referenceProtocol.references || []).filter(r => !isPlaceholderRef(r));
        const finalRefs = cleanRefs.length > 0 ? cleanRefs : ["No verified scientific reference is available in the current knowledge base."];

        const text = `
${referenceProtocol.title}
Source: ${referenceProtocol.source || "BioInkAI Knowledge Base"}

Objective
${referenceProtocol.objective}

Required Materials
${(referenceProtocol.required_materials || []).join("\n")}

Laboratory Procedure
${(referenceProtocol.steps || []).map((step, i) => {
    const norm = normalizeProtocolStep(step, i);
    return `${norm.step_number}. ${norm.instruction}`;
}).join("\n")}

Storage
${referenceProtocol.storage}

Safety
${(referenceProtocol.safety || []).join("\n")}

References
${finalRefs.join("\n")}

Status
${referenceProtocol.status}
`;

        try {
            await navigator.clipboard.writeText(text);
            alert("Protocol copied successfully!");
        } catch {
            alert("Unable to copy protocol.");
        }
    };

    return (
        <div className="protocol">
            <div className="protocol-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <h2>🧪 Standard Laboratory Reference Protocol</h2>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Based on BioInkAI Knowledge Base</p>
                </div>
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
                        {loading ? "Generating..." : "Generate Protocol"}
                    </button>
                    <button onClick={() => downloadReferenceProtocolPDF(referenceProtocol, selectedTissue)}>
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

            {referenceProtocol ? (
                <div className="protocol-card" style={{ marginTop: '20px', padding: '25px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#ffffff', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '20px' }}>
                        <h1 style={{ color: '#0F4C81', margin: '0 0 10px 0', fontSize: '22px' }}>{referenceProtocol.title}</h1>
                        <p style={{ margin: '0 0 10px 0', color: '#475569', fontSize: '15px' }}><strong>Source:</strong> {referenceProtocol.source}</p>
                        <p style={{ margin: '0 0 10px 0', color: '#475569', fontSize: '15px' }}><strong>Objective:</strong> {referenceProtocol.objective}</p>
                        <p style={{ margin: 0, fontSize: '15px' }}>
                            <strong>Status:</strong> <span style={{ color: referenceProtocol.status?.includes('Available') ? '#f59e0b' : '#10b981', fontWeight: 'bold' }}>{referenceProtocol.status}</span>
                        </p>
                    </div>

                    <h3 style={{ color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Required Materials</h3>
                    <ul style={{ color: '#475569', marginBottom: '25px', paddingLeft: '20px' }}>
                        {(referenceProtocol.required_materials || []).map((mat, i) => (
                            <li key={i} style={{ marginBottom: '5px' }}>{mat}</li>
                        ))}
                    </ul>

                    <h3 style={{ color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Laboratory Steps</h3>
                    <div className="steps-container" style={{ marginBottom: '25px' }}>
                        {(referenceProtocol.steps || []).map((step, i) => {
                            const normStep = normalizeProtocolStep(step, i);
                            return (
                                <div key={i} className="step" style={{ marginBottom: '12px', padding: '12px 16px', background: '#f8fafc', borderLeft: '4px solid #0F4C81', borderRadius: '4px', color: '#334155' }}>
                                    <strong style={{ color: '#0F4C81', marginRight: '8px' }}>
                                        Step {normStep.step_number}{normStep.title ? ` — ${normStep.title}` : ""}:
                                    </strong>
                                    {normStep.instruction}
                                </div>
                            );
                        })}
                    </div>

                    <h3 style={{ color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Storage Conditions</h3>
                    <p style={{ color: '#475569', marginBottom: '25px', lineHeight: '1.5' }}>{referenceProtocol.storage}</p>

                    <h3 style={{ color: '#b91c1c', borderBottom: '1px solid #fecaca', paddingBottom: '5px' }}>Safety Notes</h3>
                    <ul style={{ color: '#991b1b', margin: 0, paddingLeft: '20px', marginBottom: '25px' }}>
                        {(referenceProtocol.safety || []).map((note, i) => (
                            <li key={i} style={{ marginBottom: '5px', lineHeight: '1.5' }}>{note}</li>
                        ))}
                    </ul>
                    
                    {referenceProtocol.references && referenceProtocol.references.length > 0 && (
                        <>
                            <h3 style={{ color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Scientific References</h3>
                            <ul style={{ color: '#475569', margin: 0, paddingLeft: '20px' }}>
                                {(referenceProtocol.references || []).map((ref, i) => (
                                    <li key={i} style={{ marginBottom: '5px', lineHeight: '1.5', fontSize: '14px' }}>{ref}</li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            ) : (
                !loading && (
                    <div className="protocol-card" style={{ marginTop: '20px', padding: '40px 20px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                        <p style={{ margin: 0, fontSize: '15px' }}>Click "Generate Protocol" to fetch the standard reference procedure from the knowledge base.</p>
                    </div>
                )
            )}
        </div>
    );
}

export default ReferenceProtocol;
