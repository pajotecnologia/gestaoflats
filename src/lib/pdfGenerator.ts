import jsPDF from "jspdf";
import { drawStandardPDFHeader } from "./pdfHeaderBuilder";
import { convertUrlToBase64 } from "./baseUrl";

export interface ReciboPDFData {
  empresaNome: string;
  empresaCnpj: string;
  empresaEndereco?: string;
  empresaTelefone?: string;
  empresaEmail?: string;
  empresaLogomarcaUrl?: string;
  locatarioNome: string;
  locatarioCpf: string;
  flatNumero: string;
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
  return {
    ...data,
    empresaLogomarcaUrl: logoUrl,
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
  doc.text(`Imóvel / Flat: ${data.flatNumero}`, 14, 80);
  doc.text(`Mês de Referência: ${data.mesReferencia}`, 14, 86);
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
