import jsPDF from "jspdf";
import { drawStandardPDFHeader } from "./pdfHeaderBuilder";
import { convertUrlToBase64 } from "./baseUrl";
import { formatMesReferencia } from "./validation";

export interface ReciboPDFData {
  empresaNome: string;
  empresaCnpj: string;
  empresaEndereco?: string;
  empresaTelefone?: string;
  empresaEmail?: string;
  empresaLogomarcaUrl?: string;
  empresaAssinaturaUrl?: string;
  locatarioNome: string;
  locatarioCpf: string;
  flatNumero: string;
  condominioNome?: string;
  mesReferencia: string;
  valor: number;
  dataPagamento: string;
  formaPagamento: string;
  numeroRecibo: string;
}

export async function prepareReciboDataWithBase64Images(data: ReciboPDFData): Promise<ReciboPDFData> {
  let logoUrl = data.empresaLogomarcaUrl;
  if (logoUrl && !logoUrl.startsWith("data:image")) {
    logoUrl = await convertUrlToBase64(logoUrl);
  }
  let sigUrl = data.empresaAssinaturaUrl;
  if (sigUrl && !sigUrl.startsWith("data:image")) {
    sigUrl = await convertUrlToBase64(sigUrl);
  }
  return {
    ...data,
    empresaLogomarcaUrl: logoUrl,
    empresaAssinaturaUrl: sigUrl,
  };
}

export function buildReciboPDFDoc(data: ReciboPDFData): jsPDF {
  const doc = new jsPDF();

  // Cabeçalho Padrão com Logomarca e Dados da Empresa
  drawStandardPDFHeader(doc, {
    empresaNome: data.empresaNome,
    empresaCnpj: data.empresaCnpj,
    empresaEndereco: data.empresaEndereco,
    empresaTelefone: data.empresaTelefone,
    empresaEmail: data.empresaEmail,
    empresaLogomarcaUrl: data.empresaLogomarcaUrl,
    tituloDocumento: "RECIBO DE PAGAMENTO DE ALUGUEL",
    subtituloDocumento: `Nº #${data.numeroRecibo}`,
  });

  // Dados do Pagamento
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text("DADOS DO PAGAMENTO:", 14, 60);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Recebemos de: ${data.locatarioNome}`, 14, 68);
  doc.text(`CPF do Locatário: ${data.locatarioCpf}`, 14, 74);

  // Tratamento do Prédio / Condomínio e Flat / Apartamento Lado a Lado
  let predio = (data.condominioNome || "").trim();
  let flat = (data.flatNumero || "").trim();

  if (!predio && flat.includes(" - ")) {
    const parts = flat.split(" - ");
    predio = parts[0].trim();
    flat = parts.slice(1).join(" - ").trim();
  }

  if (predio) {
    const flatDisplay = flat.toLowerCase().startsWith("flat") || flat.toLowerCase().startsWith("ap") ? flat : `Flat ${flat}`;
    doc.text(`Prédio / Condomínio: ${predio}`, 14, 80);
    doc.text(`Apartamento / Flat: ${flatDisplay}`, 115, 80);
  } else {
    doc.text(`Imóvel / Flat: ${flat}`, 14, 80);
  }

  const mesRefFormatado = formatMesReferencia(data.mesReferencia);
  doc.text(`Mês de Referência: ${mesRefFormatado}`, 14, 86);
  doc.text(`Data do Pagamento: ${data.dataPagamento}`, 14, 92);
  doc.text(`Forma de Pagamento: ${data.formaPagamento}`, 14, 98);

  // Caixas Destacada de Valor
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(14, 126, 182, 22, 3, 3, "F");

  doc.setTextColor(16, 185, 129); // Verde Sucesso
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`VALOR PAGO: R$ ${data.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 105, 140, { align: "center" });

  // Declaração de Quitação
  doc.setTextColor(75, 85, 99);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const declaracao = `Declaramos para os devidos fins de direito que recebemos da pessoa acima identificada a quantia supra discriminada, referente ao aluguel da unidade habitacional indicada, dando-lhe plena, geral e irrevogável quitação referente ao mês citado.`;
  doc.text(doc.splitTextToSize(declaracao, 182), 14, 160);

  // Imagem da Assinatura / Carimbo da Empresa
  if (data.empresaAssinaturaUrl && data.empresaAssinaturaUrl.trim()) {
    try {
      const sigUrl = data.empresaAssinaturaUrl.trim();
      let format = "PNG";
      if (sigUrl.toLowerCase().includes(".jpg") || sigUrl.toLowerCase().includes(".jpeg") || sigUrl.includes("image/jpeg")) {
        format = "JPEG";
      }
      doc.addImage(sigUrl, format, 80, 185, 50, 23);
    } catch (e) {
      console.error("Erro ao desenhar imagem da assinatura da empresa no recibo:", e);
    }
  }

  // Linha de Assinatura
  doc.setDrawColor(156, 163, 175);
  doc.line(60, 210, 150, 210);

  doc.setTextColor(31, 41, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(data.empresaNome, 105, 216, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Assinatura do Responsável / Administração", 105, 221, { align: "center" });

  // RODAPÉ DO DESENVOLVEDOR NO PDF
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 275, 196, 275);
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.text("Desenvolvimento: pajotecnologia.com.br (87)996540551", 105, 282, { align: "center" });

  return doc;
}

export async function generateReciboPDF(data: ReciboPDFData) {
  try {
    const preparedData = await prepareReciboDataWithBase64Images(data);
    const doc = buildReciboPDFDoc(preparedData);

    // Garantir download e abertura confiável
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);
    const fileName = `Recibo_${data.numeroRecibo}_${data.mesReferencia.replace("-", "_")}.pdf`;

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
    console.error("Erro ao gerar PDF do Recibo:", err);
  }
}

export async function getReciboPDFBase64(data: ReciboPDFData): Promise<string> {
  const preparedData = await prepareReciboDataWithBase64Images(data);
  const doc = buildReciboPDFDoc(preparedData);
  return doc.output("datauristring");
}
