import jsPDF from "jspdf";

export interface PDFDocumentHeaderData {
  empresaNome: string;
  empresaCnpj: string;
  empresaEndereco?: string;
  empresaTelefone?: string;
  empresaEmail?: string;
  empresaLogomarcaUrl?: string;
  tituloDocumento: string;
  subtituloDocumento?: string;
  variant?: "blue" | "white";
}

/**
 * Desenha o Cabeçalho Padrão Unificado com Logomarca e Dados da Empresa
 * Utilizado em Recibos, Contratos e Laudos de Vistoria (Checklist)
 */
export function drawStandardPDFHeader(doc: jsPDF, data: PDFDocumentHeaderData) {
  const isWhite = data.variant === "white";

  // 1. Banner Principal (Azul Marinho ou Branco)
  if (isWhite) {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 36, "F");
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(0, 36, 210, 36);
  } else {
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 36, "F");
  }

  // 2. Logomarca da Empresa ou Emblema com Inicial
  let hasLogo = false;
  if (data.empresaLogomarcaUrl && data.empresaLogomarcaUrl.trim()) {
    try {
      const logoUrl = data.empresaLogomarcaUrl.trim();
      let format = "PNG";
      if (logoUrl.toLowerCase().includes(".jpg") || logoUrl.toLowerCase().includes(".jpeg") || logoUrl.includes("image/jpeg")) {
        format = "JPEG";
      }
      doc.addImage(logoUrl, format, 12, 5, 26, 26);
      hasLogo = true;
    } catch (e) {
      hasLogo = false;
    }
  }

  if (!hasLogo) {
    // Emblema da Empresa com a Inicial do Nome
    if (isWhite) {
      doc.setFillColor(30, 58, 138);
      doc.roundedRect(12, 6, 24, 24, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, 6, 24, 24, 2, 2, "F");
      doc.setTextColor(30, 58, 138);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const initial = (data.empresaNome || "P").trim().charAt(0).toUpperCase();
    doc.text(initial, 24, 22, { align: "center" });
  }

  // 3. Informações da Empresa (Adaptadas ao Fundo)
  if (isWhite) {
    doc.setTextColor(30, 58, 138);
  } else {
    doc.setTextColor(255, 255, 255);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text((data.empresaNome || "EMPRESA").toUpperCase(), 42, 14);

  if (isWhite) {
    doc.setTextColor(75, 85, 99);
  } else {
    doc.setTextColor(255, 255, 255);
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const cnpjStr = data.empresaCnpj ? `CNPJ: ${data.empresaCnpj}` : "";
  const telStr = data.empresaTelefone ? `Tel: ${data.empresaTelefone}` : "";
  const infoLinha1 = [cnpjStr, telStr].filter(Boolean).join("  •  ");
  doc.text(infoLinha1, 42, 20);

  const emailStr = data.empresaEmail ? `E-mail: ${data.empresaEmail}` : "";
  const endStr = data.empresaEndereco || "";
  const infoLinha2 = [emailStr, endStr].filter(Boolean).join("  •  ");
  doc.text(infoLinha2.slice(0, 85), 42, 26);

  // 4. Faixa Secundária do Título do Documento (Sub-header)
  const hasSub = Boolean(data.subtituloDocumento && data.subtituloDocumento.trim());
  const subHeaderHeight = hasSub ? 15 : 13;

  doc.setFillColor(243, 244, 246);
  doc.rect(0, 36, 210, subHeaderHeight, "F");

  doc.setTextColor(30, 58, 138);
  doc.setFont("helvetica", "bold");

  const titleText = (data.tituloDocumento || "DOCUMENTO").toUpperCase();
  const fontSize = titleText.length > 50 ? 9 : titleText.length > 38 ? 9.5 : 10.5;
  doc.setFontSize(fontSize);

  if (hasSub) {
    doc.text(titleText, 105, 42.5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(data.subtituloDocumento!.trim(), 105, 48, { align: "center" });
  } else {
    doc.text(titleText, 105, 44.5, { align: "center" });
  }

  // Linha Divisória de Acabamento
  doc.setLineWidth(0.5);
  doc.setDrawColor(209, 213, 219);
  doc.line(0, 36 + subHeaderHeight, 210, 36 + subHeaderHeight);
}
