/**
 * LiteratureReferenceProtocol.jsx
 * Evidence-Based Laboratory Reference Protocol component.
 *
 * This is SEPARATE from ReferenceProtocol.jsx (KB-only reference).
 * It retrieves real scientific literature from PubMed, Europe PMC, Crossref
 * and builds a protocol with traceable bibliographic evidence.
 *
 * No LLM is used yet. Evidence type is clearly labelled per item.
 */

import { useState } from "react";
import "../styles/protocolGenerator.css";
import {
  searchLiterature,
  generateLiteratureReferenceProtocol,
} from "../services/protocolApi";
import { parseError } from "../utils/errorHandler";
import { jsPDF } from "jspdf";

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

const SOURCE_COLORS = {
  PubMed: "#2563EB",
  EuropePMC: "#059669",
  Crossref: "#7C3AED",
};

const EVIDENCE_COLORS = {
  kb_derived: "#0F4C81",
  bibliographic: "#7C3AED",
  abstract: "#D97706",
  not_available: "#94A3B8",
  unavailable: "#94A3B8",
};

function buildPayload(materials, finalMixing, selectedTissue) {
  return {
    tissue: selectedTissue || "General",
    materials: (materials || []).map((mat) => ({
      biomaterial: mat.biomaterial || "Unknown Material",
      concentration: parseFloat(mat.concentration) || 0,
      temperature: parseFloat(mat.temperature) || 25,
      rpm: parseFloat(mat.rpm) || 100,
      time: parseFloat(mat.time) || 10,
      method: mat.method || "Standard mixing",
    })),
    finalMixing: {
      temperature: parseFloat(finalMixing?.temperature) || 25,
      rpm: parseFloat(finalMixing?.rpm) || 100,
      time: parseFloat(finalMixing?.time) || 10,
      crosslinking: finalMixing?.crosslinking || "None",
    },
  };
}

// ── Literature Results Panel ─────────────────────────────────────────────────
function LiteratureResultCard({ record, index }) {
  const dbColor = SOURCE_COLORS[record.source_database] || "#475569";
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "12px 16px",
        marginBottom: "10px",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <p
          style={{
            margin: 0,
            fontWeight: 600,
            color: "#1e293b",
            fontSize: "14px",
            flex: 1,
          }}
        >
          {index + 1}. {record.title}
        </p>
        <span
          style={{
            background: dbColor,
            color: "white",
            borderRadius: "4px",
            padding: "2px 8px",
            fontSize: "11px",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {record.source_database}
        </span>
      </div>

      <p style={{ margin: "6px 0 4px", color: "#475569", fontSize: "13px" }}>
        {record.authors?.slice(0, 3).join(", ")}
        {record.authors?.length > 3 ? " et al." : ""}{" "}
        {record.year ? `(${record.year})` : ""}
        {record.journal ? ` — ${record.journal}` : ""}
      </p>

      {record.abstract && (
        <p
          style={{
            margin: "6px 0 4px",
            color: "#64748b",
            fontSize: "12px",
            lineHeight: "1.5",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {record.abstract}
        </p>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: "6px",
          fontSize: "12px",
        }}
      >
        {record.doi && (
          <a
            href={`https://doi.org/${record.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#2563EB" }}
          >
            DOI: {record.doi}
          </a>
        )}
        {record.pmid && (
          <a
            href={`https://pubmed.ncbi.nlm.nih.gov/${record.pmid}/`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#2563EB" }}
          >
            PMID: {record.pmid}
          </a>
        )}
        {record.pmcid && (
          <a
            href={`https://www.ncbi.nlm.nih.gov/pmc/articles/${record.pmcid}/`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#059669" }}
          >
            {record.pmcid}
          </a>
        )}
        {record.full_text_available && (
          <span
            style={{
              color: "#059669",
              fontWeight: 600,
            }}
          >
            ✓ Open Access
          </span>
        )}
        <span
          style={{
            background: "#f1f5f9",
            borderRadius: "4px",
            padding: "1px 6px",
            color: "#64748b",
          }}
        >
          Relevance: {record.relevance_score}
        </span>
      </div>
    </div>
  );
}

// ── Evidence Table ────────────────────────────────────────────────────────────
function EvidenceTable({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ overflowX: "auto", marginBottom: "25px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: "#f1f5f9" }}>
            <th style={thStyle}>Parameter</th>
            <th style={thStyle}>Value</th>
            <th style={thStyle}>Evidence Type</th>
            <th style={thStyle}>Source</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const eColor = EVIDENCE_COLORS[item.evidence_type] || "#94A3B8";
            return (
              <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={tdStyle}>{item.parameter}</td>
                <td style={tdStyle}>{item.value || "—"}</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      background: eColor + "22",
                      color: eColor,
                      borderRadius: "4px",
                      padding: "2px 6px",
                      fontWeight: 600,
                      fontSize: "11px",
                    }}
                  >
                    {item.evidence_type}
                  </span>
                </td>
                <td style={tdStyle}>
                  {item.source?.title ? (
                    <span style={{ color: "#475569" }}>
                      {item.source.pmid
                        ? `PMID: ${item.source.pmid}`
                        : item.source.doi
                        ? `DOI: ${item.source.doi}`
                        : item.source.database || item.source.title}
                    </span>
                  ) : (
                    <span style={{ color: "#94A3B8" }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = {
  padding: "8px 12px",
  textAlign: "left",
  fontWeight: 700,
  color: "#334155",
  borderBottom: "2px solid #e2e8f0",
};
const tdStyle = {
  padding: "8px 12px",
  color: "#475569",
  verticalAlign: "top",
};

// ── PDF Download ──────────────────────────────────────────────────────────────
function downloadLitRefPDF(protocol, tissue) {
  if (!protocol) {
    alert("Generate a protocol first.");
    return;
  }
  const doc = new jsPDF();
  let y = 20;
  const addPage = () => { doc.addPage(); y = 20; };
  const checkY = (needed = 15) => { if (y + needed > 270) addPage(); };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("BioInkAI v2.0", 105, y, { align: "center" });
  y += 9;
  doc.setFontSize(14);
  doc.text("Evidence-Based Laboratory Reference Protocol", 105, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text(`Source: ${protocol.source || "BioInkAI KB + Scientific Literature"}`, 105, y, { align: "center" });
  y += 5;
  doc.line(15, y, 195, y);
  y += 10;

  const section = (label) => {
    checkY(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(label, 15, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
  };

  const paragraph = (text) => {
    const lines = doc.splitTextToSize(text || "", 175);
    checkY(lines.length * 6 + 4);
    doc.text(lines, 15, y);
    y += lines.length * 6 + 4;
  };

  const bullet = (text) => {
    const lines = doc.splitTextToSize("• " + text, 170);
    checkY(lines.length * 6 + 3);
    doc.text(lines, 20, y);
    y += lines.length * 6 + 3;
  };

  section("Target Tissue");
  paragraph(tissue || "General");
  section("Objective");
  paragraph(protocol.objective || "");
  section("Required Materials");
  (protocol.required_materials || []).forEach(bullet);
  section("Laboratory Procedure");
  (protocol.steps || []).forEach((s, i) => bullet(`${i + 1}. ${s}`));
  section("Storage Conditions");
  paragraph(protocol.storage || "");
  section("Safety Notes");
  (protocol.safety || []).forEach(bullet);

  if (protocol.evidence_items?.length > 0) {
    section("Evidence-Backed Parameters");
    (protocol.evidence_items || []).forEach((item) => {
      bullet(`${item.parameter}: ${item.value || "not available"} [${item.evidence_type}]`);
    });
  }

  if (protocol.references?.length > 0) {
    section("Scientific References");
    (protocol.references || []).forEach((ref, i) => {
      const line = `${i + 1}. ${ref.authors || ""} (${ref.year || ""}). ${ref.title || ""}. ${ref.journal || ""}. ${ref.doi ? "DOI: " + ref.doi : ""} ${ref.pmid ? "PMID: " + ref.pmid : ""}`.trim();
      bullet(line);
    });
  }

  checkY(12);
  doc.setFont("helvetica", "bold");
  doc.text("Status:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(protocol.status || "Reference", 45, y);
  y += 10;

  doc.setFontSize(9);
  doc.text("Generated by BioInkAI v2.0 — Evidence-Based Literature Reference", 105, 285, { align: "center" });
  doc.save(`BioInkAI_${tissue || "General"}_Literature_Reference_Protocol.pdf`);
}

// ── Main Component ────────────────────────────────────────────────────────────
function LiteratureReferenceProtocol({
  materials,
  finalMixing,
  selectedTissue,
  litProtocol,
  setLitProtocol,
}) {
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingProtocol, setLoadingProtocol] = useState(false);
  const [searchStatus, setSearchStatus] = useState([]);
  const [literatureResults, setLiteratureResults] = useState(null);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(false);

  const buildFormPayload = () => buildPayload(materials, finalMixing, selectedTissue);

  const handleSearchLiterature = async () => {
    if (!selectedTissue) { setError("Please select a target tissue first."); return; }
    if (!materials?.length) { setError("Please add at least one biomaterial."); return; }
    setError("");
    setLoadingSearch(true);
    setSearchStatus(["Searching PubMed...", "Searching Europe PMC...", "Searching Crossref..."]);
    setLiteratureResults(null);
    setShowResults(false);

    try {
      const result = await searchLiterature(buildFormPayload());
      setLiteratureResults(result);
      setShowResults(true);
      setSearchStatus([]);
    } catch (err) {
      setError(parseError(err, "Literature retrieval failed. Check your connection."));
      setSearchStatus([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleGenerateProtocol = async () => {
    if (!selectedTissue) { setError("Please select a target tissue first."); return; }
    if (!materials?.length) { setError("Please add at least one biomaterial."); return; }
    
    try {
      setError("");
      setLoadingProtocol(true);

      const payload = buildFormPayload();
      const result = await generateLiteratureReferenceProtocol(payload);
      
      console.log("[BioInkAI] Literature protocol response:", result);
      
      setLitProtocol(result);
    } catch (error) {
      console.error("[BioInkAI] Literature protocol generation failed:", error);
      setError(
        "Literature protocol generation failed: " + 
        (error?.detail || error?.message || "Unknown error")
      );
    } finally {
      setLoadingProtocol(false);
    }
  };

  const handlePrint = () => {
    if (!litProtocol) { alert("Generate a protocol first."); return; }
    window.print();
  };

  const handleCopy = async () => {
    if (!litProtocol) { alert("Generate a protocol first."); return; }

    const isPlaceholderRef = (refStr) => {
        if (!refStr) return true;
        const str = String(refStr).toLowerCase();
        return str.includes('[placeholder') ||
               str.includes('placeholder') ||
               str.includes('todo') ||
               str.includes('unknown author') ||
               str.includes('unknown journal');
    };

    const cleanRefs = (litProtocol.references || []).filter(r => !isPlaceholderRef(r?.title) && !isPlaceholderRef(r?.authors));
    const finalRefs = cleanRefs.length > 0 ? cleanRefs : [{ title: "No verified scientific reference is available in the current knowledge base." }];

    const refs = finalRefs
      .map((r, i) => {
        if (!r.authors && !r.year && !r.journal) {
          return `${i + 1}. ${r.title}`;
        }
        return `${i + 1}. ${r.authors || ""} (${r.year || ""}). ${r.title}. ${r.journal || ""}. ${r.doi ? "DOI: " + r.doi : ""} ${r.pmid ? "PMID: " + r.pmid : ""}`.trim();
      })
      .join("\n");

    const text = `${litProtocol.title}\nSource: ${litProtocol.source}\n\nObjective\n${litProtocol.objective}\n\nRequired Materials\n${(litProtocol.required_materials || []).join("\n")}\n\nLaboratory Procedure\n${(litProtocol.steps || []).map((s, i) => {
      const norm = normalizeProtocolStep(s, i);
      return `${norm.step_number}. ${norm.instruction}`;
    }).join("\n")}\n\nStorage\n${litProtocol.storage}\n\nSafety\n${(litProtocol.safety || []).join("\n")}\n\nReferences\n${refs}\n\nStatus\n${litProtocol.status}`;

    try {
      await navigator.clipboard.writeText(text);
      alert("Protocol copied successfully!");
    } catch {
      alert("Unable to copy protocol.");
    }
  };

  return (
    <div className="protocol">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="protocol-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div>
          <h2>📚 Evidence-Based Literature Reference Protocol</h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            PubMed · Europe PMC · Crossref — real literature, real citations
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={handleSearchLiterature}
            disabled={loadingSearch || loadingProtocol}
            style={{
              background: "#2563EB",
              color: "white",
              border: "none",
              padding: "8px 14px",
              borderRadius: "6px",
              cursor: loadingSearch ? "not-allowed" : "pointer",
              fontWeight: "bold",
              opacity: loadingSearch ? 0.7 : 1,
              fontSize: "13px",
            }}
          >
            {loadingSearch ? "Searching..." : "🔍 Search Literature"}
          </button>
          <button
            onClick={handleGenerateProtocol}
            disabled={loadingSearch || loadingProtocol}
            style={{
              background: "#0F4C81",
              color: "white",
              border: "none",
              padding: "8px 14px",
              borderRadius: "6px",
              cursor: loadingProtocol ? "not-allowed" : "pointer",
              fontWeight: "bold",
              opacity: loadingProtocol ? 0.7 : 1,
              fontSize: "13px",
            }}
          >
            {loadingProtocol ? "Building..." : "📋 Generate Protocol"}
          </button>
          <button onClick={() => downloadLitRefPDF(litProtocol, selectedTissue)}>📄 PDF</button>
          <button onClick={handlePrint}>🖨 Print</button>
          <button onClick={handleCopy}>📋 Copy</button>
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            color: "#ef4444",
            marginTop: "12px",
            padding: "12px",
            background: "#fef2f2",
            borderRadius: "6px",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {/* ── Search status indicators ─────────────────────────────────────── */}
      {loadingSearch && searchStatus.length > 0 && (
        <div
          style={{
            marginTop: "14px",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {searchStatus.map((s, i) => (
            <span
              key={i}
              style={{
                background: "#EFF6FF",
                color: "#2563EB",
                border: "1px solid #BFDBFE",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              ⏳ {s}
            </span>
          ))}
        </div>
      )}

      {/* ── Literature Results ────────────────────────────────────────────── */}
      {showResults && literatureResults && (
        <div
          style={{
            marginTop: "18px",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "18px",
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h3 style={{ margin: 0, color: "#1e293b" }}>
              Literature Results ({literatureResults.total_results} records found)
            </h3>
            <button
              onClick={() => setShowResults(false)}
              style={{
                background: "none",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                padding: "2px 8px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Hide
            </button>
          </div>
          <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#64748b" }}>
            Query: <em>{literatureResults.query}</em>
          </p>
          {(literatureResults.results || []).map((rec, i) => (
            <LiteratureResultCard key={i} record={rec} index={i} />
          ))}
          {literatureResults.results?.length === 0 && (
            <p style={{ color: "#64748b", textAlign: "center" }}>
              No results found. Try broadening your formulation or check your connection.
            </p>
          )}
        </div>
      )}

      {/* ── Protocol Content ─────────────────────────────────────────────── */}
      {litProtocol ? (
        <div
          style={{
            marginTop: "20px",
            padding: "25px",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            background: "#ffffff",
            boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
          }}
        >
          {/* Header */}
          <div
            style={{
              borderBottom: "2px solid #f1f5f9",
              paddingBottom: "15px",
              marginBottom: "20px",
            }}
          >
            <h1 style={{ color: "#0F4C81", margin: "0 0 8px", fontSize: "20px" }}>
              {litProtocol.title}
            </h1>
            <p style={{ margin: "0 0 6px", color: "#475569", fontSize: "13px" }}>
              <strong>Source:</strong> {litProtocol.source}
            </p>
            <p style={{ margin: "0 0 6px", color: "#475569", fontSize: "14px" }}>
              <strong>Objective:</strong> {litProtocol.objective}
            </p>
            <p style={{ margin: 0, fontSize: "14px" }}>
              <strong>Status:</strong>{" "}
              <span style={{ color: "#10b981", fontWeight: 600 }}>{litProtocol.status}</span>
            </p>
          </div>

          {/* Required Materials */}
          <h3 style={{ color: "#334155", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px" }}>
            Required Materials
          </h3>
          <ul style={{ color: "#475569", marginBottom: "20px", paddingLeft: "20px" }}>
            {(litProtocol.required_materials || []).map((m, i) => (
              <li key={i} style={{ marginBottom: "4px" }}>
                {m}
              </li>
            ))}
          </ul>

          {/* Steps */}
          <h3 style={{ color: "#334155", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px" }}>
            Laboratory Procedure
          </h3>
          <div style={{ marginBottom: "20px" }}>
            {(litProtocol.steps || []).map((step, i) => {
              const normStep = normalizeProtocolStep(step, i);
              return (
                <div
                  key={i}
                  style={{
                    marginBottom: "10px",
                    padding: "10px 14px",
                    background: "#f8fafc",
                    borderLeft: "4px solid #0F4C81",
                    borderRadius: "4px",
                    color: "#334155",
                    fontSize: "14px",
                  }}
                >
                  <strong style={{ color: "#0F4C81", marginRight: "6px" }}>
                    Step {normStep.step_number}{normStep.title ? ` — ${normStep.title}` : ""}:
                  </strong>
                  {normStep.instruction}
                </div>
              );
            })}
          </div>

          {/* Storage */}
          <h3 style={{ color: "#334155", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px" }}>
            Storage Conditions
          </h3>
          <p style={{ color: "#475569", marginBottom: "20px", lineHeight: "1.5", fontSize: "14px" }}>
            {litProtocol.storage}
          </p>

          {/* Safety */}
          <h3 style={{ color: "#b91c1c", borderBottom: "1px solid #fecaca", paddingBottom: "5px" }}>
            Safety Notes
          </h3>
          <ul style={{ color: "#991b1b", marginBottom: "20px", paddingLeft: "20px" }}>
            {(litProtocol.safety || []).map((note, i) => (
              <li key={i} style={{ marginBottom: "4px", lineHeight: "1.5", fontSize: "14px" }}>
                {note}
              </li>
            ))}
          </ul>

          {/* Evidence Table */}
          {litProtocol.evidence_items?.length > 0 && (
            <>
              <h3
                style={{ color: "#334155", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px" }}
              >
                Evidence-Backed Parameters
              </h3>
              <p style={{ color: "#64748b", fontSize: "12px", marginBottom: "8px" }}>
                <strong>Legend:</strong>{" "}
                <span style={{ color: "#0F4C81" }}>kb_derived</span> = from local knowledge base ·{" "}
                <span style={{ color: "#7C3AED" }}>bibliographic</span> = paper confirms topic ·{" "}
                <span style={{ color: "#94A3B8" }}>not_available</span> = not in available sources
              </p>
              <EvidenceTable items={litProtocol.evidence_items} />
            </>
          )}

          {/* Limitations */}
          {litProtocol.limitations?.length > 0 && (
            <>
              <h3
                style={{ color: "#b45309", borderBottom: "1px solid #fed7aa", paddingBottom: "5px" }}
              >
                Limitations
              </h3>
              <ul style={{ color: "#92400e", marginBottom: "20px", paddingLeft: "20px" }}>
                {(litProtocol.limitations || []).map((l, i) => (
                  <li key={i} style={{ marginBottom: "5px", lineHeight: "1.5", fontSize: "13px" }}>
                    {l}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* References */}
          {litProtocol.references?.length > 0 && (
            <>
              <h3
                style={{ color: "#334155", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px" }}
              >
                Scientific References
              </h3>
              <ol style={{ color: "#475569", paddingLeft: "20px" }}>
                {(litProtocol.references || []).map((ref, i) => (
                  <li key={i} style={{ marginBottom: "8px", fontSize: "13px", lineHeight: "1.6" }}>
                    <strong>{ref.authors}</strong>
                    {ref.year ? ` (${ref.year})` : ""}. {ref.title}.
                    {ref.journal ? <em> {ref.journal}.</em> : ""}
                    <span style={{ marginLeft: "6px" }}>
                      {ref.doi && (
                        <a
                          href={`https://doi.org/${ref.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#2563EB", marginRight: "6px" }}
                        >
                          DOI
                        </a>
                      )}
                      {ref.pmid && (
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#2563EB", marginRight: "6px" }}
                        >
                          PubMed
                        </a>
                      )}
                      {ref.pmcid && (
                        <a
                          href={`https://www.ncbi.nlm.nih.gov/pmc/articles/${ref.pmcid}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#059669" }}
                        >
                          PMC
                        </a>
                      )}
                    </span>
                    <span
                      style={{
                        background: (SOURCE_COLORS[ref.database] || "#94A3B8") + "22",
                        color: SOURCE_COLORS[ref.database] || "#94A3B8",
                        borderRadius: "4px",
                        padding: "1px 5px",
                        fontSize: "11px",
                        fontWeight: 600,
                        marginLeft: "4px",
                      }}
                    >
                      {ref.database}
                    </span>
                    {ref.full_text_available && (
                      <span style={{ color: "#059669", marginLeft: "6px", fontSize: "11px" }}>
                        ✓ Open Access
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      ) : (
        !loadingProtocol && (
          <div
            style={{
              marginTop: "20px",
              padding: "40px 20px",
              textAlign: "center",
              color: "#64748b",
              background: "#f8fafc",
              borderRadius: "12px",
              border: "1px dashed #cbd5e1",
            }}
          >
            <p style={{ margin: "0 0 8px", fontSize: "15px" }}>
              Click <strong>"Search Literature"</strong> to retrieve real publications from PubMed,
              Europe PMC, and Crossref.
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "#94A3B8" }}>
              Then click <strong>"Generate Protocol"</strong> to build an evidence-based reference
              protocol with traceable citations.
            </p>
          </div>
        )
      )}
    </div>
  );
}

export default LiteratureReferenceProtocol;
