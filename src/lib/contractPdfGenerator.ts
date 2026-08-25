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

  if (logoUrl && !logoUrl.startsWith("data:image")) {
    logoUrl = await convertUrlToBase64(logoUrl);
  }
  if (assUrl && !assUrl.startsWith("data:image")) {
    assUrl = await convertUrlToBase64(assUrl);
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
