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
  doc.text("BIOINKAI v2.0", 105, y, { align: "center" });
  y += 10;
  
  doc.setFontSize(14);
  doc.text("Knowledge Base / Literature Reference Protocol", 105, y, { align: "center" });
  y += 10;
  
  doc.line(15, y, 195, y);
  y += 10;

  // Metadata block
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Target Tissue:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(tissue || "General", 55, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Formulation:", 15, y);
  doc.setFont("helvetica", "normal");
  const materialsStr = (protocol.required_materials || []).join(", ") || "Not specified";
  doc.text(materialsStr, 55, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Protocol Type:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(protocol.protocol_type || "Reference", 55, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Evidence Source:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(protocol.source || "BioInkAI Knowledge Base", 55, y);
  y += 10;

  doc.line(15, y, 195, y);
  y += 10;

  // Sections
  const addSectionHeader = (title) => {
    if (y + 25 > 265) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, 15, y);
    y += 7;
    doc.line(15, y, 195, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
  };

  // OBJECTIVE
  addSectionHeader("OBJECTIVE");
  const objectiveLines = doc.splitTextToSize(protocol.objective || "Not specified.", 175);
  doc.text(objectiveLines, 15, y);
  y += objectiveLines.length * 6 + 10;

  // REQUIRED MATERIALS
  addSectionHeader("REQUIRED MATERIALS");
  (protocol.required_materials || []).forEach((item) => {
    if (y + 12 > 265) { doc.addPage(); y = 20; }
    doc.text("• " + item, 20, y);
    y += 7;
  });
  y += 5;

  // EQUIPMENT
  addSectionHeader("EQUIPMENT");
  const equipmentText = "Standard extrusion bioprinting system, analytical balance, magnetic stirrer, and sterile biosafety cabinet.";
  const equipLines = doc.splitTextToSize(equipmentText, 175);
  doc.text(equipLines, 15, y);
  y += equipLines.length * 6 + 10;

  // LABORATORY PROCEDURE
  addSectionHeader("LABORATORY PROCEDURE");
  (protocol.steps || []).forEach((step, index) => {
    const norm = normalizeProtocolStep(step, index);
    const header = `Step ${norm.step_number}${norm.title ? " — " + norm.title : ""}`;
    const instrLines = doc.splitTextToSize(`Instruction:\n${norm.instruction}`, 170);
    
    const needed = (norm.title ? 12 : 6) + instrLines.length * 6 + 10;
    if (y + needed > 265) { doc.addPage(); y = 20; }
    
    doc.setFont("helvetica", "bold");
    doc.text(header, 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(instrLines, 20, y);
    y += instrLines.length * 6 + 6;
  });
  y += 5;

  // CROSSLINKING
  addSectionHeader("CROSSLINKING");
  // Find crosslinker info
  let crossMethod = "Not specified in available evidence.";
  let crossConc = "Not specified in available evidence.";
  let crossTime = "Not specified in available evidence.";
  
  if (protocol.evidence_items && protocol.evidence_items.length > 0) {
    protocol.evidence_items.forEach((item) => {
      const paramName = String(item.parameter).toLowerCase();
      if (paramName.includes("crosslink")) {
        if (item.value) {
          if (paramName.includes("time")) crossTime = item.value;
          else if (paramName.includes("concentration") || paramName.includes("method")) crossMethod = item.value;
        }
      }
    });
  }
  
  // Also check standard final mixing crosslinking
  if (crossMethod.includes("Not specified") && protocol.steps) {
    // check if any step mentions CaCl2 or crosslinker
    const lastStep = protocol.steps[protocol.steps.length - 1];
    const normLast = normalizeProtocolStep(lastStep, protocol.steps.length - 1);
    if (normLast.instruction.toLowerCase().includes("crosslink")) {
      crossMethod = normLast.instruction;
    }
  }

  doc.setFont("helvetica", "bold");
  doc.text("Method:", 15, y);
  doc.setFont("helvetica", "normal");
  const crossMethodLines = doc.splitTextToSize(crossMethod, 140);
  doc.text(crossMethodLines, 45, y);
  y += crossMethodLines.length * 6 + 2;

  if (y + 12 > 265) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.text("Concentration:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(crossConc, 45, y);
  y += 7;

  if (y + 12 > 265) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.text("Time:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(crossTime, 45, y);
  y += 10;

  // STORAGE
  addSectionHeader("STORAGE");
  const storageLines = doc.splitTextToSize(protocol.storage || "Standard 4°C storage recommended.", 175);
  doc.text(storageLines, 15, y);
  y += storageLines.length * 6 + 10;

  // SAFETY
  addSectionHeader("SAFETY");
  (protocol.safety || []).forEach((note) => {
    const lines = doc.splitTextToSize("• " + note, 170);
    if (y + lines.length * 6 + 4 > 265) { doc.addPage(); y = 20; }
    doc.text(lines, 20, y);
    y += lines.length * 6 + 4;
  });
  y += 5;

  // EVIDENCE-BACKED PARAMETERS
  if (protocol.evidence_items && protocol.evidence_items.length > 0) {
    addSectionHeader("EVIDENCE-BACKED PARAMETERS");
    protocol.evidence_items.forEach((item) => {
      const lineText = `${item.parameter}: ${item.value || "Not specified in available evidence."} [Source: ${item.source?.title || "Knowledge Base"}]`;
      const lines = doc.splitTextToSize("• " + lineText, 170);
      if (y + lines.length * 6 + 4 > 265) { doc.addPage(); y = 20; }
      doc.text(lines, 20, y);
      y += lines.length * 6 + 4;
    });
    y += 5;
  }

  // LIMITATIONS
  if (protocol.limitations && protocol.limitations.length > 0) {
    addSectionHeader("LIMITATIONS");
    protocol.limitations.forEach((limit) => {
      const lines = doc.splitTextToSize("• " + limit, 170);
      if (y + lines.length * 6 + 4 > 265) { doc.addPage(); y = 20; }
      doc.text(lines, 20, y);
      y += lines.length * 6 + 4;
    });
    y += 5;
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
            cleanRefs.push(`${authorStr}${yearStr}${titleStr}${journalStr}${doiStr}${pmidStr}`);
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
    const lines = doc.splitTextToSize("• " + note, 170);
    if (y + lines.length * 6 + 4 > 265) { doc.addPage(); y = 20; }
    doc.text(lines, 20, y);
    y += lines.length * 6 + 4;
  });

  // Status
  if (y + 15 > 265) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.text("Status:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(protocol.status || "Reference", 32, y);

  // Footer
  doc.setFontSize(10);
  doc.text("Generated automatically by BioInkAI v2.0", 105, 285, { align: "center" });

  doc.save(`BioInkAI_${tissue || "General"}_Standard_Reference_Protocol.pdf`);
}