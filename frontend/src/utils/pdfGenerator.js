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