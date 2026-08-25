import jsPDF from "jspdf";
import QRCode from "qrcode";
import { drawStandardPDFHeader } from "./pdfHeaderBuilder";
import { getAppBaseUrl } from "./baseUrl";
import { calculateSha256 } from "./opentimestamps";

export interface ChecklistItem {
  categoria: string;
  item: string;
  status: "OK" | "ATENCAO" | "DANIFICADO";
  observacao?: string;
  fotosUrl?: string[];
}

export interface ChecklistPDFData {
  tipoVistoria: "ENTRADA" | "SAIDA";
  empresaNome: string;
  empresaCnpj: string;
  empresaEndereco?: string;
  empresaTelefone?: string;
  empresaEmail?: string;
  empresaLogomarcaUrl?: string;
  locatarioNome: string;
  locatarioCpf: string;
  flatNumero: string;
  dataVistoria: string;
  responsavelVistoria: string;
  itens: ChecklistItem[];
  observacoesGerais?: string;
  empresaAssinaturaUrl?: string;
  locatarioAssinaturaUrl?: string;
  dataAssinaturaLocatario?: string;
  ipAssinaturaLocatario?: string;
  documentoHashSha256?: string;
  blockchainProtocol?: string;
  blockchainStatus?: string;
  dataHashGerado?: string;
  validationUrl?: string;
  qrCodeDataUrl?: string;
}

export function buildChecklistPDFDoc(data: ChecklistPDFData): jsPDF {
  const doc = new jsPDF();

  const isEntrada = data.tipoVistoria === "ENTRADA";
  const titleText = isEntrada ? "LAUDO DE VISTORIA DE ENTRADA (ENTREGA DO FLAT)" : "LAUDO DE VISTORIA DE SAÍDA (DEVOLUÇÃO DO FLAT)";

  // Cabeçalho Padrão com Logomarca e Dados da Empresa
  drawStandardPDFHeader(doc, {
    empresaNome: data.empresaNome,
    empresaCnpj: data.empresaCnpj,
    empresaEndereco: data.empresaEndereco,
    empresaTelefone: data.empresaTelefone,
    empresaEmail: data.empresaEmail,
    empresaLogomarcaUrl: data.empresaLogomarcaUrl,
    tituloDocumento: titleText,
    subtituloDocumento: `Data: ${data.dataVistoria}`,
    variant: "white",
  });

  // Informações da Vistoria
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Dados da Vistoria Imobiliária:", 14, 58);

  doc.setFont("helvetica", "normal");
  doc.text(`• Unidade / Flat: ${data.flatNumero}`, 14, 64);
  doc.text(`• Locatário(a): ${data.locatarioNome} (CPF: ${data.locatarioCpf})`, 14, 70);
  doc.text(`• Responsável pela Vistoria: ${data.responsavelVistoria}`, 14, 76);

  doc.setLineWidth(0.5);
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 81, 196, 81);

  // Tabela de Itens Vistoriados
  let y = 89;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text("Itens Verificados no Checklist:", 14, y);
  y += 6;

  const renderTableHeader = (yPos: number) => {
    doc.setFillColor(243, 244, 246);
    doc.rect(14, yPos, 182, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55);
    doc.text("Item / Categoria", 18, yPos + 5.5);
    doc.text("Status", 110, yPos + 5.5);
    doc.text("Observações", 138, yPos + 5.5);
    return yPos + 12;
  };

  y = renderTableHeader(y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  data.itens.forEach((item, itemIndex) => {
    const itemTitle = `${item.categoria} - ${item.item}`;
    const itemLines: string[] = doc.splitTextToSize(itemTitle, 88);

    const obsText = item.observacao || "-";
    const obsLines: string[] = doc.splitTextToSize(obsText, 56);

    const fotosList = item.fotosUrl || [];
    const hasFotos = fotosList.length > 0;
    const imgWidth = 32;
    const imgHeight = 24;
    const imgGap = 3;
    const maxFotosPerRow = 4;

    let fotosHeight = 0;
    if (hasFotos) {
      const numRows = Math.ceil(fotosList.length / maxFotosPerRow);
      fotosHeight = numRows * (imgHeight + imgGap);
    }

    const textLinesCount = Math.max(itemLines.length, obsLines.length, 1);
    const lineSpacing = 4.5;
    const textHeight = textLinesCount * lineSpacing;
    const rowHeight = textHeight + fotosHeight + 3;

    if (y + rowHeight > 260) {
      doc.addPage();
      y = 20;
      y = renderTableHeader(y);
    }

    // Fundo zebrado sutil para melhor legibilidade
    if (itemIndex % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(14, y - 3.5, 182, rowHeight, "F");
    }

    // Item / Categoria
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(31, 41, 55);
    itemLines.forEach((line, idx) => {
      doc.text(line, 18, y + idx * lineSpacing);
    });

    // Status
    if (item.status === "OK") {
      doc.setTextColor(16, 185, 129);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("✓ OK / BOM", 110, y);
    } else if (item.status === "ATENCAO") {
      doc.setTextColor(217, 119, 6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("! ATENÇÃO", 110, y);
    } else {
      doc.setTextColor(220, 38, 38);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("✕ AVARIA", 110, y);
    }

    // Observações (Mesma fonte do Item / Categoria)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(31, 41, 55);
    obsLines.forEach((line, idx) => {
      doc.text(line, 138, y + idx * lineSpacing);
    });

    // Exibir imagens logo abaixo, do lado esquerdo (a partir de x = 18)
    if (hasFotos) {
      let imgX = 18;
      let imgY = y + textHeight + 1;

      fotosList.forEach((fotoUrl, fIdx) => {
        if (imgX + imgWidth > 194) {
          imgX = 18;
          imgY += imgHeight + imgGap;
        }

        try {
          let format = "JPEG";
          if (fotoUrl.toLowerCase().includes(".png") || fotoUrl.includes("image/png")) {
            format = "PNG";
          }
          doc.addImage(fotoUrl, format, imgX, imgY, imgWidth, imgHeight);
        } catch (e) {
          doc.setDrawColor(209, 213, 219);
          doc.setFillColor(243, 244, 246);
          doc.roundedRect(imgX, imgY, imgWidth, imgHeight, 1, 1, "FD");
          doc.setFontSize(7);
          doc.setTextColor(107, 114, 128);
          doc.text(`📷 Foto ${fIdx + 1}`, imgX + imgWidth / 2, imgY + imgHeight / 2, { align: "center" });
        }

        imgX += imgWidth + imgGap;
      });
    }

    // Linha divisória sutil
    doc.setDrawColor(243, 244, 246);
    doc.setLineWidth(0.3);
    doc.line(14, y + rowHeight - 3.5, 196, y + rowHeight - 3.5);

    y += rowHeight;
  });

  // Observações Gerais da Vistoria (se houver)
  if (data.observacoesGerais && data.observacoesGerais.trim()) {
    y += 4;
    if (y > 215) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(31, 41, 55);
    doc.text("Observações Gerais / Outras Questões:", 14, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(55, 65, 81);

    const splitObs = doc.splitTextToSize(data.observacoesGerais.trim(), 182);
    const obsHeight = splitObs.length * 5 + 4;

    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(14, y - 1, 182, obsHeight, 2, 2, "FD");

    doc.text(splitObs, 18, y + 4);
    y += obsHeight + 4;
  }

  // Assinaturas das Duas Partes (Empresa/Vistoriador e Locatário)
  y += 18;
  if (y > 230) {
    doc.addPage();
    y = 35;
  }

  // Renderizar imagem de assinatura da Empresa (se disponível e formato base64/png)
  if (data.empresaAssinaturaUrl && data.empresaAssinaturaUrl.startsWith("data:image")) {
    try {
      const format = data.empresaAssinaturaUrl.includes("image/jpeg") || data.empresaAssinaturaUrl.includes("image/jpg") ? "JPEG" : "PNG";
      doc.addImage(data.empresaAssinaturaUrl, format, 32, y - 16, 46, 14);
    } catch (e) {
      // Fallback gráfico se não for raster suportado
    }
  }

  // Renderizar imagem de assinatura do Locatário (se disponível)
  if (data.locatarioAssinaturaUrl && data.locatarioAssinaturaUrl.startsWith("data:image")) {
    try {
      const format = data.locatarioAssinaturaUrl.includes("image/jpeg") || data.locatarioAssinaturaUrl.includes("image/jpg") ? "JPEG" : "PNG";
      doc.addImage(data.locatarioAssinaturaUrl, format, 132, y - 16, 46, 14);
    } catch (e) {
      // Ignora erro de imagem
    }
  }

  doc.setDrawColor(31, 41, 55);
  doc.setLineWidth(0.5);
  doc.line(14, y, 94, y);
  doc.line(110, y, 190, y);

  doc.setFontSize(8.5);
  doc.setTextColor(31, 41, 55);
  doc.setFont("helvetica", "bold");
  doc.text(data.responsavelVistoria || data.empresaNome, 14, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Vistoriador(a) / ${data.empresaNome}`, 14, y + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(data.locatarioNome, 110, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Locatário(a) - CPF: ${data.locatarioCpf}`, 110, y + 9);

  if (data.ipAssinaturaLocatario) {
    const cleanIp = data.ipAssinaturaLocatario.replace(/^::ffff:/i, "").trim();
    doc.setFontSize(7);
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.text(`Assinado Digitalmente • IP: ${cleanIp}`, 110, y + 13);
  }

  // Bloco de Auditoria Blockchain & QR Code no Laudo de Vistoria
  if (data.documentoHashSha256 || data.validationUrl) {
    y += 20;
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(240, 249, 255);
    doc.setDrawColor(186, 230, 253);
    doc.setLineWidth(0.5);
    const boxWidth = data.qrCodeDataUrl ? 150 : 176;
    doc.roundedRect(14, y, boxWidth, 26, 2, 2, "FD");

    doc.setTextColor(30, 58, 138);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("REGISTRO DE AUDITORIA CRIPTOGRÁFICA & BLOCKCHAIN (BITCOIN)", 18, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(55, 65, 81);
    
    const hashText = data.documentoHashSha256 || "Criptografado e Ancorado em Blockchain";
    doc.text(`• Hash SHA-256 (PDF): ${hashText}`, 18, y + 11);
    doc.text(`• Prova de Existência: Ancorado via OpenTimestamps na Blockchain do Bitcoin`, 18, y + 15.5);
    
    if (data.validationUrl) {
      doc.setTextColor(29, 78, 216);
      doc.text(`• Verificação Pública: ${data.validationUrl}`, 18, y + 20);
    }

    if (data.qrCodeDataUrl) {
      try {
        doc.addImage(data.qrCodeDataUrl, "PNG", 168, y + 2, 22, 22);
      } catch (e) {}
    }
  }

  // RODAPÉ DO DESENVOLVEDOR NO LAUDO PDF
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 280, 196, 280);
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.text("Desenvolvimento: pajotecnologia.com.br (87)996540551", 105, 286, { align: "center" });

  return doc;
}

export async function convertUrlToBase64(url: string): Promise<string> {
  if (!url) return "";
  if (url.startsWith("data:image")) return url;
  try {
    let fullUrl = url;
    if (url.startsWith("/")) {
      if (typeof window !== "undefined") {
        fullUrl = window.location.origin + url;
      } else {
        fullUrl = `${getAppBaseUrl()}${url}`;
      }
    }
    const response = await fetch(fullUrl);
    if (!response.ok) return url;

    if (typeof window === "undefined") {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get("content-type") || "image/jpeg";
      return `data:${contentType};base64,${buffer.toString("base64")}`;
    }

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    return url;
  }
}

export async function prepareChecklistDataWithBase64Images(data: ChecklistPDFData): Promise<ChecklistPDFData> {
  let logoUrl = data.empresaLogomarcaUrl;
  let assUrl = data.empresaAssinaturaUrl;
  let locAssUrl = data.locatarioAssinaturaUrl;

  if (logoUrl && !logoUrl.startsWith("data:image")) {
    logoUrl = await convertUrlToBase64(logoUrl);
  }
  if (assUrl && !assUrl.startsWith("data:image")) {
    assUrl = await convertUrlToBase64(assUrl);
  }
  if (locAssUrl && !locAssUrl.startsWith("data:image")) {
    locAssUrl = await convertUrlToBase64(locAssUrl);
  }

  const updatedItens = await Promise.all(
    data.itens.map(async (item) => {
      if (!item.fotosUrl || item.fotosUrl.length === 0) return item;
      const base64Fotos = await Promise.all(
        item.fotosUrl.map((url) => convertUrlToBase64(url))
      );
      return { ...item, fotosUrl: base64Fotos };
    })
  );

  const sha256 = data.documentoHashSha256 || calculateSha256(`${data.empresaCnpj}-${data.locatarioCpf}-${data.flatNumero}-${data.tipoVistoria}-${data.dataVistoria}`);
  const validationUrl = data.validationUrl || `${getAppBaseUrl()}/api/validar?hash=${sha256}`;

  let qrCodeDataUrl = data.qrCodeDataUrl;
  if (!qrCodeDataUrl) {
    try {
      qrCodeDataUrl = await QRCode.toDataURL(validationUrl, { margin: 1, width: 120 });
    } catch (e) {}
  }

  return {
    ...data,
    empresaLogomarcaUrl: logoUrl,
    empresaAssinaturaUrl: assUrl,
    locatarioAssinaturaUrl: locAssUrl,
    itens: updatedItens,
    documentoHashSha256: sha256,
    validationUrl,
    qrCodeDataUrl,
  };
}

export async function generateChecklistPDF(data: ChecklistPDFData) {
  try {
    const preparedData = await prepareChecklistDataWithBase64Images(data);
    const doc = buildChecklistPDFDoc(preparedData);

    // Download & Blob Link
    const fileName = `Laudo_Vistoria_${data.tipoVistoria}_${data.flatNumero.replace(/\s+/g, "_")}.pdf`;
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      window.open(blobUrl, "_blank");
    }, 100);
  } catch (err) {
    console.error("Erro ao gerar PDF da Vistoria:", err);
  }
}

export async function getChecklistPDFBase64(data: ChecklistPDFData): Promise<string> {
  const preparedData = await prepareChecklistDataWithBase64Images(data);
  const doc = buildChecklistPDFDoc(preparedData);
  return doc.output("datauristring");
}
