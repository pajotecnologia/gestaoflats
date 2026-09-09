import jsPDF from "jspdf";
import { drawStandardPDFHeader } from "./pdfHeaderBuilder";
import { convertUrlToBase64 } from "./baseUrl";
import { formatMesReferencia } from "./validation";

export interface RepassePDFData {
  empresa: {
    nomeFantasia: string;
    razaoSocial: string;
    cnpj: string;
    endereco: string;
    telefone: string;
    email: string;
    logomarcaUrl?: string;
  };
  repasse: {
    id: string;
    mesReferencia: string;
    valorBrutoAluguel: number;
    taxaAdminPercentual: number;
    valorTaxaAdmin: number;
    valorDescontos?: number;
    valorLiquidoRepasse: number;
    dataVencimento: string;
    dataPagamento?: string | null;
    status: string;
    formaPagamento?: string | null;
    observacoes?: string | null;
    createdAt: string;
  };
  proprietario: {
    nome: string;
    cpfCnpj: string;
    telefone: string;
    email?: string | null;
    chavePix?: string | null;
    tipoChavePix?: string | null;
    banco?: string | null;
    agencia?: string | null;
    conta?: string | null;
  };
  flat?: {
    numero: string;
    localNome: string;
  };
  locatarioNome?: string;
}

export async function generateRepassePDF(data: RepassePDFData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // 1. Converter Logomarca
  let logoBase64 = "";
  if (data.empresa.logomarcaUrl) {
    try {
      logoBase64 = await convertUrlToBase64(data.empresa.logomarcaUrl);
    } catch {
      logoBase64 = "";
    }
  }

  // 2. Cabeçalho Padronizado White Clean
  drawStandardPDFHeader(doc, {
    empresaNome: data.empresa.nomeFantasia || data.empresa.razaoSocial,
    empresaCnpj: data.empresa.cnpj,
    empresaEndereco: data.empresa.endereco,
    empresaTelefone: data.empresa.telefone,
    empresaEmail: data.empresa.email,
    empresaLogomarcaUrl: logoBase64,
    tituloDocumento: "EXTRATO DE REPASSE DE ALUGUEL",
    subtituloDocumento: `Demonstrativo Financeiro Oficial • Referência: ${formatMesReferencia(data.repasse.mesReferencia)}`,
    variant: "white",
  });

  let currentY = 56;

  // Box 1: Dados do Proprietário (Locador)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, currentY, 186, 28, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(12, currentY, 186, 28, 2, 2, "D");

  doc.setTextColor(30, 58, 138);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DADOS DO PROPRIETÁRIO (LOCADOR)", 16, currentY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Nome: ${data.proprietario.nome}`, 16, currentY + 12);
  doc.text(`CPF/CNPJ: ${data.proprietario.cpfCnpj}`, 16, currentY + 17);
  doc.text(`Telefone/WhatsApp: ${data.proprietario.telefone}`, 16, currentY + 22);

  const chavePixStr = data.proprietario.chavePix
    ? `${data.proprietario.chavePix} (${data.proprietario.tipoChavePix || "PIX"})`
    : "Não informada";
  doc.text(`Chave PIX: ${chavePixStr}`, 105, currentY + 12);
  const bancoStr = data.proprietario.banco
    ? `${data.proprietario.banco} • Ag: ${data.proprietario.agencia || "-"} • Conta: ${data.proprietario.conta || "-"}`
    : "PIX Direto";
  doc.text(`Dados Bancários: ${bancoStr}`, 105, currentY + 17);

  currentY += 34;

  // Box 2: Dados do Imóvel e Locatário
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, currentY, 186, 22, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(12, currentY, 186, 22, 2, 2, "D");

  doc.setTextColor(30, 58, 138);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DADOS DO IMÓVEL & LOCAÇÃO", 16, currentY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const imovelStr = data.flat
    ? `Flat / Unidade ${data.flat.numero} - ${data.flat.localNome}`
    : "Imóvel Administrado";
  doc.text(`Imóvel: ${imovelStr}`, 16, currentY + 13);
  doc.text(`Locatário(a): ${data.locatarioNome || "Contrato em vigor"}`, 16, currentY + 18);
  doc.text(`Mês de Referência: ${formatMesReferencia(data.repasse.mesReferencia)}`, 120, currentY + 13);
  doc.text(
    `Vencimento do Repasse: ${new Date(data.repasse.dataVencimento).toLocaleDateString("pt-BR")}`,
    120,
    currentY + 18
  );

  currentY += 28;

  // Box 3: Demonstrativo Financeiro Detalhado
  doc.setFillColor(30, 58, 138);
  doc.rect(12, currentY, 186, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DISCRIMINAÇÃO FINANCEIRA DO REPASSE", 16, currentY + 5);

  currentY += 7;

  const linhas = [
    {
      item: "1. Valor Bruto do Aluguel Recebido",
      tipo: "CREDITO",
      valor: `R$ ${data.repasse.valorBrutoAluguel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      destaque: false,
    },
    {
      item: `2. (-) Taxa de Administração da Imobiliária (${data.repasse.taxaAdminPercentual.toFixed(1)}%)`,
      tipo: "DEBITO",
      valor: `- R$ ${data.repasse.valorTaxaAdmin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      destaque: false,
    },
    {
      item: "3. (-) Descontos Extras (Manutenção / Taxas Autorizadas)",
      tipo: "DEBITO",
      valor: `- R$ ${(data.repasse.valorDescontos || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      destaque: false,
    },
    {
      item: "VALOR LÍQUIDO DO REPASSE AO PROPRIETÁRIO",
      tipo: "TOTAL",
      valor: `R$ ${data.repasse.valorLiquidoRepasse.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      destaque: true,
    },
  ];

  linhas.forEach((linha, idx) => {
    const isTotal = linha.destaque;
    const bgFill = isTotal ? [240, 253, 244] : idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(bgFill[0], bgFill[1], bgFill[2]);
    doc.rect(12, currentY, 186, isTotal ? 11 : 9, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(12, currentY, 186, isTotal ? 11 : 9, "D");

    doc.setFont("helvetica", isTotal ? "bold" : "normal");
    doc.setFontSize(isTotal ? 10 : 8.5);
    if (isTotal) {
      doc.setTextColor(22, 101, 52);
    } else {
      doc.setTextColor(30, 41, 59);
    }
    doc.text(linha.item, 16, currentY + (isTotal ? 7 : 6));

    doc.setFont("helvetica", "bold");
    doc.text(linha.valor, 194, currentY + (isTotal ? 7 : 6), { align: "right" });

    currentY += isTotal ? 11 : 9;
  });

  currentY += 8;

  // Status de Quitação
  const isPago = data.repasse.status === "PAGO";
  if (isPago) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(12, currentY, 186, 18, 2, 2, "F");
    doc.roundedRect(12, currentY, 186, 18, 2, 2, "D");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(22, 101, 52);
    doc.text("✓ REPASSE QUITADO COM SUCESSO", 16, currentY + 7);
  } else {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(252, 211, 77);
    doc.roundedRect(12, currentY, 186, 18, 2, 2, "F");
    doc.roundedRect(12, currentY, 186, 18, 2, 2, "D");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(180, 83, 9);
    doc.text("⏳ REPASSE PENDENTE DE LIQUIDAÇÃO", 16, currentY + 7);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const infoPagamento = isPago
    ? `Data do Pagamento: ${
        data.repasse.dataPagamento
          ? new Date(data.repasse.dataPagamento).toLocaleDateString("pt-BR")
          : "Hoje"
      } • Forma: ${data.repasse.formaPagamento || "PIX"}`
    : `Previsão de Pagamento: ${new Date(data.repasse.dataVencimento).toLocaleDateString("pt-BR")} via Chave PIX cadastrada.`;
  doc.text(infoPagamento, 16, currentY + 13);

  if (data.repasse.observacoes) {
    currentY += 24;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Observações:", 12, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(data.repasse.observacoes.slice(0, 150), 12, currentY + 5);
  }

  // Rodapé Obrigatório
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")} • IMOB by PAJO Tecnologia`,
    12,
    285
  );
  doc.text("Desenvolvimento: pajotecnologia.com.br (87)996540551", 198, 285, { align: "right" });

  return doc;
}

export async function getRepassePDFBase64(data: RepassePDFData): Promise<string> {
  const doc = await generateRepassePDF(data);
  return doc.output("datauristring");
}
