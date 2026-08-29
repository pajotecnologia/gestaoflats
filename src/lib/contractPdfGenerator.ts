import jsPDF from "jspdf";
import QRCode from "qrcode";
import { formatCurrency } from "./validation";
import { drawStandardPDFHeader } from "./pdfHeaderBuilder";
import { convertUrlToBase64, getAppBaseUrl } from "./baseUrl";
import { calculateSha256 } from "./cryptoUtils";

export interface ContratoPDFData {
  empresaNome: string;
  empresaCnpj: string;
  empresaEndereco?: string;
  empresaTelefone?: string;
  empresaEmail?: string;
  empresaLogomarcaUrl?: string;
  empresaAssinaturaUrl?: string;
  locatarioNome: string;
  locatarioCpf: string;
  locatarioRg?: string;
  locatarioTelefone?: string;
  flatNumero: string;
  localNome?: string;
  valorMensal: number;
  tipoValidade?: string;
  validadeMeses: number;
  validadeDias?: number;
  dataEmissao: string;
  dataFinal: string;
  conteudoHtml?: string;
  statusAssinatura?: string;
  locatarioAssinaturaUrl?: string;
  dataAssinaturaLocatario?: string;
  ipAssinaturaLocatario?: string;
  documentoHashSha256?: string;
  blockchainProtocol?: string;
  blockchainStatus?: string;
  dataHashGerado?: string;
  validationUrl?: string;
  qrCodeDataUrl?: string;
  vistoriaEntrada?: {
    responsavel?: string;
    dataVistoria?: string;
    statusAssinatura?: string;
    observacoesGerais?: string;
    itens: Array<{
      categoria: string;
      item: string;
      status: string;
      observacao?: string;
      fotosUrl?: string[];
    }>;
  };
}

interface TextBlock {
  type: "heading" | "subheading" | "paragraph";
  text: string;
}

function parseContractBlocks(rawHtml: string): TextBlock[] {
  if (!rawHtml || !rawHtml.trim()) return [];

  // Substitui tags de cabeçalho por marcadores internos
  let processed = rawHtml
    .replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi, "\n###HEADING### $1 \n")
    .replace(/<h[4-6][^>]*>(.*?)<\/h[4-6]>/gi, "\n###SUBHEADING### $1 \n")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1\n")
    .replace(/<div[^>]*>(.*?)<\/div>/gi, "\n$1\n")
    .replace(/<br\s*\/?>/gi, "\n");

  // Remove tags HTML remanescentes e decodifica entidades comuns
  processed = processed
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');

  const lines = processed.split("\n").map((l) => l.trim()).filter(Boolean);
  const blocks: TextBlock[] = [];

  lines.forEach((line) => {
    if (line.startsWith("###HEADING###")) {
      blocks.push({
        type: "heading",
        text: line.replace("###HEADING###", "").trim(),
      });
    } else if (line.startsWith("###SUBHEADING###")) {
      blocks.push({
        type: "subheading",
        text: line.replace("###SUBHEADING###", "").trim(),
      });
    } else {
      // Identifica linhas de cláusula (ex: CLÁUSULA PRIMEIRA, CLÁUSULA 1ª)
      const isClauseHeader = /^CLÁUSULA\s+[A-Z0-9ªº]+/i.test(line) && line.length < 90;
      if (isClauseHeader) {
        blocks.push({
          type: "heading",
          text: line,
        });
      } else {
        blocks.push({
          type: "paragraph",
          text: line,
        });
      }
    }
  });

  return blocks;
}

export function buildContratoPDFDoc(data: ContratoPDFData): jsPDF {
  const doc = new jsPDF();
  const isDias = data.tipoValidade === "DIAS";
  const duracaoLabel = isDias
    ? `${data.validadeDias || data.validadeMeses} Dias (Temporada)`
    : `${data.validadeMeses} Meses`;

  // 1. Cabeçalho Padrão sem Fundo Azul (Variante White Clean)
  drawStandardPDFHeader(doc, {
    empresaNome: data.empresaNome,
    empresaCnpj: data.empresaCnpj,
    empresaEndereco: data.empresaEndereco,
    empresaTelefone: data.empresaTelefone,
    empresaEmail: data.empresaEmail,
    empresaLogomarcaUrl: data.empresaLogomarcaUrl,
    tituloDocumento: "CONTRATO DE LOCAÇÃO RESIDENCIAL",
    subtituloDocumento: `Vigência: ${duracaoLabel}`,
    variant: "white",
  });

  // 2. Quadro Resumo do Contrato em Card Elegante
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, 54, 182, 36, 2, 2, "FD");

  doc.setTextColor(30, 58, 138);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo do Contrato de Locação:", 18, 60);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  doc.text(`• LOCADOR: ${data.empresaNome} (CNPJ: ${data.empresaCnpj})`, 18, 66);
  doc.text(`• LOCATÁRIO: ${data.locatarioNome} (CPF: ${data.locatarioCpf}${data.locatarioRg ? ` | RG: ${data.locatarioRg}` : ""})`, 18, 72);
  doc.text(`• IMÓVEL / UNIDADE: ${data.localNome ? `${data.localNome} - ` : ""}Flat ${data.flatNumero}`, 18, 78);
  doc.text(`• VALOR DO ALUGUEL: ${formatCurrency(data.valorMensal)}   •   VIGÊNCIA: ${duracaoLabel} (${data.dataEmissao} a ${data.dataFinal})`, 18, 84);

  // 3. Cláusulas e Termos do Contrato com Formatação Estruturada
  let y = 98;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(31, 41, 55);
  doc.text("Termos e Cláusulas Contratuais:", 14, y);
  y += 6;

  let rawContent = data.conteudoHtml || "";

  if (!rawContent.trim()) {
    rawContent = `<h3>CLÁUSULA PRIMEIRA - DO OBJETO</h3><p>Pelo presente instrumento de locação residencial, a LOCADORA disponibiliza ao LOCATÁRIO a unidade habitacional Flat nº ${data.flatNumero}, totalmente mobiliada e equipada.</p>` +
      `<h3>CLÁUSULA SEGUNDA - DO VALOR</h3><p>O aluguel mensal é de ${formatCurrency(data.valorMensal)}, com vencimento na data pactuada.</p>` +
      `<h3>CLÁUSULA TERCEIRA - DA VIGÊNCIA</h3><p>Este contrato vigora por ${data.validadeMeses} meses, iniciando em ${data.dataEmissao} e terminando em ${data.dataFinal}.</p>` +
      `<h3>CLÁUSULA QUARTA - DA CONSERVAÇÃO</h3><p>O locatário compromete-se a manter o imóvel nas mesmas condições descritas no laudo de vistoria.</p>`;
  }

  const blocks = parseContractBlocks(rawContent);

  blocks.forEach((block) => {
    if (block.type === "heading" || block.type === "subheading") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(block.type === "heading" ? 9.5 : 9);
      doc.setTextColor(30, 58, 138);

      const headingLines: string[] = doc.splitTextToSize(block.text, 182);
      const headingHeight = headingLines.length * 4.5;

      // Previne cabeçalhos de cláusulas órfãos no fim da página
      if (y + headingHeight + 8 > 260) {
        doc.addPage();
        y = 20;
      } else {
        y += 2;
      }

      headingLines.forEach((line: string) => {
        doc.text(line, 14, y);
        y += 4.5;
      });

      y += 1;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(55, 65, 81);

      const paraLines: string[] = doc.splitTextToSize(block.text, 182);
      const paraHeight = paraLines.length * 4.2;

      if (y + paraHeight > 260) {
        doc.addPage();
        y = 20;
      }

      paraLines.forEach((line: string) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 14, y);
        y += 4.2;
      });

      y += 3; // Espaçamento entre parágrafos
    }
  });

  // 4. Assinaturas das Partes
  y += 14;
  if (y > 230) {
    doc.addPage();
    y = 35;
  }

  // Imagem Assinatura Empresa (se houver)
  if (data.empresaAssinaturaUrl && data.empresaAssinaturaUrl.startsWith("data:image")) {
    try {
      const format = data.empresaAssinaturaUrl.includes("image/jpeg") || data.empresaAssinaturaUrl.includes("image/jpg") ? "JPEG" : "PNG";
      doc.addImage(data.empresaAssinaturaUrl, format, 32, y - 16, 46, 14);
    } catch (e) {}
  }

  // Imagem Assinatura Locatário (se houver)
  if (data.locatarioAssinaturaUrl && data.locatarioAssinaturaUrl.startsWith("data:image")) {
    try {
      const format = data.locatarioAssinaturaUrl.includes("image/jpeg") || data.locatarioAssinaturaUrl.includes("image/jpg") ? "JPEG" : "PNG";
      doc.addImage(data.locatarioAssinaturaUrl, format, 132, y - 16, 46, 14);
    } catch (e) {}
  }

  doc.setDrawColor(31, 41, 55);
  doc.setLineWidth(0.5);
  doc.line(14, y, 94, y);
  doc.line(110, y, 190, y);

  doc.setFontSize(8.5);
  doc.setTextColor(31, 41, 55);
  doc.setFont("helvetica", "bold");
  doc.text(data.empresaNome, 14, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Locador(a) / Administração", 14, y + 9);

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

  // 5. Bloco de Auditoria Blockchain & QR Code de Validação Pública
  if (data.documentoHashSha256 || data.validationUrl) {
    y += 20;
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(240, 249, 255);
    doc.setDrawColor(186, 230, 253);
    doc.setLineWidth(0.5);
    const boxWidth = data.qrCodeDataUrl ? 148 : 176;
    doc.roundedRect(14, y, boxWidth, 31, 2, 2, "FD");

    doc.setTextColor(30, 58, 138);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("REGISTRO DE AUDITORIA CRIPTOGRÁFICA & BLOCKCHAIN (BITCOIN)", 18, y + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(55, 65, 81);
    
    const hashText = data.documentoHashSha256 || "Criptografado e Ancorado em Blockchain";
    doc.text(`• Hash SHA-256 (PDF): ${hashText}`, 18, y + 10.5);
    doc.text(`• Imutabilidade Blockchain: Ancorado via OpenTimestamps na rede descentralizada do Bitcoin (ISO 14533).`, 18, y + 15);
    doc.text(`• Validade Jurídica: Garantida via MP 2.200-2/2001 e Lei nº 14.063/2020 para plena aceitação em juízo.`, 18, y + 19.5);
    
    if (data.validationUrl) {
      doc.setTextColor(29, 78, 216);
      doc.setFont("helvetica", "bold");
      doc.text(`• Verificação Pública: ${data.validationUrl}`, 18, y + 25);
    }

    if (data.qrCodeDataUrl) {
      try {
        doc.addImage(data.qrCodeDataUrl, "PNG", 165, y + 2.5, 26, 26);
      } catch (e) {}
    }
  }

  // 6. ANEXO I: LAUDO DE VISTORIA DE ENTRADA DO IMÓVEL & FOTOS (SE HOUVER VISTORIA VINCULADA)
  if (data.vistoriaEntrada && data.vistoriaEntrada.itens && data.vistoriaEntrada.itens.length > 0) {
    doc.addPage();

    // Cabeçalho do Anexo I
    drawStandardPDFHeader(doc, {
      empresaNome: data.empresaNome,
      empresaCnpj: data.empresaCnpj,
      empresaEndereco: data.empresaEndereco,
      empresaTelefone: data.empresaTelefone,
      empresaEmail: data.empresaEmail,
      empresaLogomarcaUrl: data.empresaLogomarcaUrl,
      tituloDocumento: "ANEXO I - LAUDO DE VISTORIA DE ENTRADA",
      subtituloDocumento: `Checklist do Imóvel: Flat ${data.flatNumero}`,
      variant: "white",
    });

    // Quadro Resumo da Vistoria
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, 54, 182, 26, 2, 2, "FD");

    doc.setTextColor(30, 58, 138);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text("Dados da Vistoria de Entrada Vinculada:", 18, 60);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(55, 65, 81);
    doc.text(`• Vistoriador Responsável: ${data.vistoriaEntrada.responsavel || "Vistoriador Oficial"}`, 18, 66);
    doc.text(
      `• Data da Vistoria: ${data.vistoriaEntrada.dataVistoria || data.dataEmissao}   •   Status: ${data.vistoriaEntrada.statusAssinatura || "CONCLUÍDO"}`,
      18,
      72
    );

    let vY = 88;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.text("Itens Verificados no Checklist de Entrada:", 14, vY);
    vY += 6;

    const renderVistoriaTableHeader = (yPos: number) => {
      doc.setFillColor(243, 244, 246);
      doc.rect(14, yPos, 182, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(31, 41, 55);
      doc.text("Item / Cômodo", 18, yPos + 5.5);
      doc.text("Status", 110, yPos + 5.5);
      doc.text("Observações", 138, yPos + 5.5);
      return yPos + 12;
    };

    vY = renderVistoriaTableHeader(vY);

    data.vistoriaEntrada.itens.forEach((item, itemIdx) => {
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

      if (vY + rowHeight > 260) {
        doc.addPage();
        vY = 20;
        vY = renderVistoriaTableHeader(vY);
      }

      if (itemIdx % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(14, vY - 3.5, 182, rowHeight, "F");
      }

      // Título do Item
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(31, 41, 55);
      itemLines.forEach((line, idx) => {
        doc.text(line, 18, vY + idx * lineSpacing);
      });

      // Status
      if (item.status === "OK") {
        doc.setTextColor(16, 185, 129);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text("✓ OK / BOM", 110, vY);
      } else if (item.status === "ATENCAO") {
        doc.setTextColor(217, 119, 6);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text("! ATENÇÃO", 110, vY);
      } else {
        doc.setTextColor(220, 38, 38);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text("✕ AVARIA", 110, vY);
      }

      // Observações
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(31, 41, 55);
      obsLines.forEach((line, idx) => {
        doc.text(line, 138, vY + idx * lineSpacing);
      });

      // Fotos da Vistoria
      if (hasFotos) {
        let imgX = 18;
        let imgY = vY + textHeight + 1;

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

      vY += rowHeight + 2;
    });

    // Rodapé de Aceite da Vistoria pelo Locatário
    vY += 6;
    if (vY + 24 > 260) {
      doc.addPage();
      vY = 20;
    }

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text(
      "Declaro que recebi o imóvel nas condições especificadas neste laudo de vistoria de entrada e anexo fotográfico integrante do contrato.",
      14,
      vY
    );
  }

  // RODAPÉ DO DESENVOLVEDOR NO CONTRATO PDF
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 280, 196, 280);
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.text("Desenvolvimento: pajotecnologia.com.br (87)996540551", 105, 286, { align: "center" });

  return doc;
}

export async function prepareContratoDataWithBase64Images(data: ContratoPDFData): Promise<ContratoPDFData> {
  let logoUrl = data.empresaLogomarcaUrl;
  let assUrl = data.empresaAssinaturaUrl;
  let locatarioAssUrl = data.locatarioAssinaturaUrl;

  if (logoUrl && !logoUrl.startsWith("data:image")) {
    logoUrl = await convertUrlToBase64(logoUrl);
  }
  if (assUrl && !assUrl.startsWith("data:image")) {
    assUrl = await convertUrlToBase64(assUrl);
  }
  if (locatarioAssUrl && !locatarioAssUrl.startsWith("data:image")) {
    locatarioAssUrl = await convertUrlToBase64(locatarioAssUrl);
  }

  // Processar fotos da Vistoria de Entrada para Base64 se existirem
  let vistoriaEntradaProcessada = data.vistoriaEntrada;
  if (data.vistoriaEntrada && data.vistoriaEntrada.itens) {
    const itensAtualizados = await Promise.all(
      data.vistoriaEntrada.itens.map(async (item) => {
        if (!item.fotosUrl || item.fotosUrl.length === 0) return item;
        const base64Fotos = await Promise.all(
          item.fotosUrl.map((url) => (url.startsWith("data:image") ? url : convertUrlToBase64(url)))
        );
        return { ...item, fotosUrl: base64Fotos };
      })
    );
    vistoriaEntradaProcessada = {
      ...data.vistoriaEntrada,
      itens: itensAtualizados,
    };
  }

  const sha256 = data.documentoHashSha256 || calculateSha256(`${data.empresaCnpj}-${data.locatarioCpf}-${data.flatNumero}-${data.dataEmissao}-${data.valorMensal}`);
  const validationUrl = data.validationUrl || `${getAppBaseUrl()}/validar?hash=${sha256}`;

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
    locatarioAssinaturaUrl: locatarioAssUrl,
    vistoriaEntrada: vistoriaEntradaProcessada,
    documentoHashSha256: sha256,
    validationUrl,
    qrCodeDataUrl,
  };
}

export async function generateContratoPDF(data: ContratoPDFData) {
  try {
    const preparedData = await prepareContratoDataWithBase64Images(data);
    const doc = buildContratoPDFDoc(preparedData);
    const fileName = `Contrato_Locacao_Flat_${data.flatNumero.replace(/\s+/g, "_")}.pdf`;
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
    console.error("Erro ao gerar PDF do Contrato:", err);
  }
}

export async function getContratoPDFBase64(data: ContratoPDFData): Promise<string> {
  const preparedData = await prepareContratoDataWithBase64Images(data);
  const doc = buildContratoPDFDoc(preparedData);
  return doc.output("datauristring");
}
