import { jsPDF } from "jspdf";

export function downloadProtocolPDF(protocol, tissue = "General") {

  if (!protocol) {
    alert("Please generate a protocol first.");
    return;
  }

  const doc = new jsPDF();

  let y = 20;

  // ==========================================
  // Title
  // ==========================================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("BioInkAI v2.0", 105, y, { align: "center" });

  y += 10;

  doc.setFontSize(16);
  doc.text("Laboratory Standard Operating Procedure", 105, y, {
    align: "center",
  });

  y += 15;

  doc.line(15, y, 195, y);

  y += 10;

  // ==========================================
  // Tissue
  // ==========================================

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Target Tissue", 15, y);

  doc.setFont("helvetica", "normal");
  doc.text(tissue || "General", 70, y);

  y += 10;

  // ==========================================
  // Objective
  // ==========================================

  doc.setFont("helvetica", "bold");
  doc.text("Objective", 15, y);

  y += 7;

  doc.setFont("helvetica", "normal");

  const objective = doc.splitTextToSize(
    protocol.objective,
    175
  );

  doc.text(objective, 15, y);

  y += objective.length * 7 + 8;

  // ==========================================
  // Required Materials
  // ==========================================

  doc.setFont("helvetica", "bold");
  doc.text("Required Materials", 15, y);

  y += 8;

  doc.setFont("helvetica", "normal");

  protocol.required_materials.forEach((item) => {
    doc.text("• " + item, 20, y);
    y += 7;
  });

  y += 5;

  // ==========================================
  // Laboratory Steps
  // ==========================================

  doc.setFont("helvetica", "bold");
  doc.text("Laboratory Procedure", 15, y);

  y += 8;

  doc.setFont("helvetica", "normal");

  protocol.steps.forEach((step, index) => {

    const lines = doc.splitTextToSize(
      `${index + 1}. ${step}`,
      170
    );

    doc.text(lines, 20, y);

    y += lines.length * 7 + 4;

    if (y > 260) {
      doc.addPage();
      y = 20;
    }

  });

  // ==========================================
  // Storage
  // ==========================================

  y += 5;

  doc.setFont("helvetica", "bold");
  doc.text("Storage", 15, y);

  y += 7;

  doc.setFont("helvetica", "normal");

  const storage = doc.splitTextToSize(
    protocol.storage,
    175
  );

  doc.text(storage, 15, y);

  y += storage.length * 7 + 8;

  // ==========================================
  // Safety
  // ==========================================

  doc.setFont("helvetica", "bold");
  doc.text("Safety Notes", 15, y);

  y += 8;

  doc.setFont("helvetica", "normal");

  protocol.safety.forEach((note) => {
    const lines = doc.splitTextToSize(
      "• " + note,
      170
    );

    doc.text(lines, 20, y);

    y += lines.length * 7 + 4;
  });

  y += 8;

  // ==========================================
  // Status
  // ==========================================

  doc.setFont("helvetica", "bold");
  doc.text("Status :", 15, y);

  doc.setFont("helvetica", "normal");
  doc.text(protocol.status, 45, y);

  // ==========================================
  // Footer
  // ==========================================

  doc.setFontSize(10);

  doc.text(
    "Generated automatically by BioInkAI v2.0",
    105,
    285,
    {
      align: "center",
    }
  );

  doc.save(
    `BioInkAI_${tissue || "General"}_Protocol.pdf`
  );

}


export function normalizeProtocolStep(step, index) {
  if (typeof step === 'string') {
    return {
      step_number: index + 1,
      title: "",
      instruction: step,
      parameters: [],
      evidence: [],
      source: null
    };
  }
  if (step && typeof step === 'object') {
    if ('instruction' in step && 'step_number' in step) {
      return {
        step_number: step.step_number || index + 1,
        title: step.title || "",
        instruction: step.instruction || "",
        // Always normalize to arrays -- never raw dicts
        parameters: Array.isArray(step.parameters) ? step.parameters : [],
        evidence: Array.isArray(step.evidence) ? step.evidence : [],
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
        parameters: [],
        evidence: [],
        source: null
      };
    }
  }
  return {
    step_number: index + 1,
    title: "",
    instruction: String(step),
    parameters: [],
    evidence: [],
    source: null
  };
}

export function downloadReferenceProtocolPDF(protocol, tissue = "General") {
  if (!protocol) {
    alert("Please generate a reference protocol first.");
    return;
  }

  const doc = new jsPDF();
  let y = 20;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("BioInkAI v2.0", 105, y, { align: "center" });
  y += 9;
  
  doc.setFontSize(14);
  doc.text("Evidence-Based Laboratory Reference Protocol", 105, y, { align: "center" });
  y += 7;

  // LLM / Source metadata
  const llmStatus = protocol.llm?.used 
    ? `Gemini 2.5 Flash (${protocol.llm.status})`
    : `AI evidence extraction unavailable (${protocol.llm?.status || "Fallback Mode"})`;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text(`Source: ${protocol.source || "BioInkAI KB + Literature"} | LLM Status: ${llmStatus}`, 105, y, { align: "center" });
  y += 5;

  doc.line(15, y, 195, y);
  y += 10;

  // Metadata block
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Target Tissue:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(tissue || "General", 45, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.text("Formulation:", 15, y);
  doc.setFont("helvetica", "normal");
  const materialsStr = (protocol.required_materials || []).join(", ") || "Not specified";
  const materialsLines = doc.splitTextToSize(materialsStr, 140);
  doc.text(materialsLines, 45, y);
  y += materialsLines.length * 6 + 1;

  // Evidence summary
  if (protocol.evidence_summary) {
    const es = protocol.evidence_summary;
    const summaryText = `Processed: ${es.papers_processed} papers | Experimental: ${es.experimental_parameters} | KB: ${es.knowledge_base_parameters} | Not Available: ${es.not_available_parameters}`;
    doc.setFont("helvetica", "bold");
    doc.text("Evidence Sum:", 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(summaryText, 45, y);
    y += 7;
  }

  doc.line(15, y, 195, y);
  y += 10;

  // Sections helper
  const addSectionHeader = (title) => {
    if (y + 25 > 270) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, 15, y);
    y += 5;
    doc.line(15, y, 195, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  // OBJECTIVE
  addSectionHeader("OBJECTIVE");
  const objectiveLines = doc.splitTextToSize(protocol.objective || "Not specified.", 175);
  doc.text(objectiveLines, 15, y);
  y += objectiveLines.length * 6 + 8;

  // REQUIRED MATERIALS
  addSectionHeader("REQUIRED MATERIALS");
  (protocol.required_materials || []).forEach((item) => {
    if (y + 10 > 270) { doc.addPage(); y = 20; }
    doc.text("• " + item, 20, y);
    y += 6;
  });
  y += 4;

  // LABORATORY PROCEDURE
  addSectionHeader("LABORATORY PROCEDURE");
  (protocol.steps || []).forEach((step, index) => {
    const norm = normalizeProtocolStep(step, index);
    const header = `Step ${norm.step_number}${norm.title ? " — " + norm.title : ""}`;
    const instrLines = doc.splitTextToSize(norm.instruction, 170);
    
    // Calculate space needed for this step
    const needed = (norm.title ? 10 : 5) + instrLines.length * 6 + 6;
    if (y + needed > 270) { doc.addPage(); y = 20; }
    
    doc.setFont("helvetica", "bold");
    doc.text(header, 15, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(instrLines, 20, y);
    y += instrLines.length * 6 + 5;
  });
  y += 4;

  // STORAGE
  addSectionHeader("STORAGE CONDITIONS");
  const storageLines = doc.splitTextToSize(protocol.storage || "Standard 4°C storage recommended.", 175);
  doc.text(storageLines, 15, y);
  y += storageLines.length * 6 + 8;

  // SAFETY
  addSectionHeader("SAFETY NOTES");
  (protocol.safety || []).forEach((note) => {
    const lines = doc.splitTextToSize(note, 170);
    if (y + lines.length * 6 + 4 > 270) { doc.addPage(); y = 20; }
    doc.text("• ", 15, y);
    doc.text(lines, 20, y);
    y += lines.length * 6 + 4;
  });
  y += 4;

  // EVIDENCE-BACKED PARAMETERS
  if (protocol.evidence_items && protocol.evidence_items.length > 0) {
    addSectionHeader("EVIDENCE-BACKED PARAMETERS");
    protocol.evidence_items.forEach((item) => {
      const sourceDb = item.source?.database || "Literature";
      const sourceId = item.source?.pmid ? `PMID:${item.source.pmid}` : (item.source?.doi ? `DOI:${item.source.doi}` : "");
      const sourceStr = sourceId ? `${sourceDb} (${sourceId})` : sourceDb;
      const lineText = `${item.parameter}: ${item.value || "Not specified"} [Type: ${item.evidence_type} | Source: ${sourceStr}]`;
      
      const lines = doc.splitTextToSize(lineText, 170);
      if (y + lines.length * 6 + 4 > 270) { doc.addPage(); y = 20; }
      doc.text("• ", 15, y);
      doc.text(lines, 20, y);
      y += lines.length * 6 + 4;
    });
    y += 4;
  }

  // LIMITATIONS
  if (protocol.limitations && protocol.limitations.length > 0) {
    addSectionHeader("LIMITATIONS");
    protocol.limitations.forEach((limit) => {
      const lines = doc.splitTextToSize(limit, 170);
      if (y + lines.length * 6 + 4 > 270) { doc.addPage(); y = 20; }
      doc.text("• ", 15, y);
      doc.text(lines, 20, y);
      y += lines.length * 6 + 4;
    });
    y += 4;
  }

  // SCIENTIFIC REFERENCES
  const isPlaceholderRef = (refStr) => {
    if (!refStr) return true;
    const str = String(refStr).toLowerCase();
    return str.includes('[placeholder') ||
           str.includes('placeholder') ||
           str.includes('todo') ||
           str.includes('unknown author') ||
           str.includes('unknown journal');
  };

  let cleanRefs = [];
  if (protocol.references && protocol.references.length > 0) {
    protocol.references.forEach((ref) => {
      if (typeof ref === 'string') {
        if (!isPlaceholderRef(ref)) {
          cleanRefs.push(ref);
        }
      } else if (ref && typeof ref === 'object') {
        if (!isPlaceholderRef(ref.title) && !isPlaceholderRef(ref.authors)) {
          if (!ref.authors && !ref.year && !ref.journal) {
            cleanRefs.push(ref.title);
          } else {
            const authorStr = ref.authors || "Unknown authors";
            const yearStr = ref.year ? ` (${ref.year})` : "";
            const titleStr = ref.title ? `. ${ref.title}` : "";
            const journalStr = ref.journal ? `. ${ref.journal}` : "";
            const doiStr = ref.doi ? ` [DOI: ${ref.doi}]` : "";
            const pmidStr = ref.pmid ? ` [PMID: ${ref.pmid}]` : "";
            const pmcidStr = ref.pmcid ? ` [PMCID: ${ref.pmcid}]` : "";
            cleanRefs.push(`${authorStr}${yearStr}${titleStr}${journalStr}${doiStr}${pmidStr}${pmcidStr}`);
          }
        }
      }
    });
  }

  if (cleanRefs.length === 0) {
    cleanRefs.push("No verified scientific reference is available in the current knowledge base.");
  }

  addSectionHeader("SCIENTIFIC REFERENCES");
  cleanRefs.forEach((note) => {
    const lines = doc.splitTextToSize(note, 170);
    if (y + lines.length * 6 + 4 > 270) { doc.addPage(); y = 20; }
    doc.text("• ", 15, y);
    doc.text(lines, 20, y);
    y += lines.length * 6 + 4;
  });
  y += 4;

  // RESEARCH-USE ONLY DISCLAIMER
  if (y + 20 > 270) { doc.addPage(); y = 20; }
  doc.line(15, y, 195, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Research-Use Only Disclaimer:", 15, y);
  doc.setFont("helvetica", "normal");
  const disclaimerText = "This protocol is generated automatically for research use only. It has not been approved for clinical diagnostic or therapeutic procedures. The values extracted are subject to experimental validation.";
  const disclaimerLines = doc.splitTextToSize(disclaimerText, 175);
  y += 4;
  doc.text(disclaimerLines, 15, y);
  y += disclaimerLines.length * 5 + 6;

  // Status
  if (y + 10 > 270) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.text("Status:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(protocol.status || "Reference", 32, y);

  // Footer
  doc.setFontSize(8);
  doc.text("Generated automatically by BioInkAI v2.0", 105, 285, { align: "center" });

  doc.save(`BioInkAI_${tissue || "General"}_Literature_Reference_Protocol.pdf`);
}
