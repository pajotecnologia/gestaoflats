import jsPDF from "jspdf";
import { drawStandardPDFHeader } from "./pdfHeaderBuilder";

export interface ReportItemReceber {
  locatarioNome: string;
  flatNumero: string;
  condominioNome: string;
  mesReferencia: string;
  numeroParcela: number;
  dataVencimento: string;
  dataPagamento?: string;
  valor: number;
  valorPago?: number;
  status: "PENDENTE" | "PAGO" | "ATRASADO";
}

export interface ContasReceberReportData {
  empresaNome: string;
  empresaCnpj: string;
  empresaEndereco?: string;
  empresaTelefone?: string;
  empresaEmail?: string;
  empresaLogomarcaUrl?: string;
  dataInicio: string;
  dataFim: string;
  filtrosTexto: string;
  totais: {
    totalGeral: number;
    totalRecebido: number;
    totalPendente: number;
    totalAtrasado: number;
    qtdTotal: number;
  };
  itens: ReportItemReceber[];
}

export interface ReportItemPagar {
  descricao: string;
  fornecedorNome: string;
  flatNumero: string;
  condominioNome: string;
  dataVencimento: string;
  dataPagamento?: string;
  valor: number;
  status: "PENDENTE" | "PAGO" | "ATRASADO";
}

export interface ContasPagarReportData {
  empresaNome: string;
  empresaCnpj: string;
  empresaEndereco?: string;
  empresaTelefone?: string;
  empresaEmail?: string;
  empresaLogomarcaUrl?: string;
  dataInicio: string;
  dataFim: string;
  filtrosTexto: string;
  totais: {
    totalGeral: number;
    totalPago: number;
    totalPendente: number;
    totalAtrasado: number;
    qtdTotal: number;
  };
  itens: ReportItemPagar[];
}

export interface ReportItemContrato {
  locatarioNome: string;
  locatarioCpf: string;
  flatNumero: string;
  condominioNome: string;
  valorMensal: number;
  dataEmissao: string;
  dataFinal: string;
  status: string;
  statusAssinatura: string;
  documentoHashSha256?: string;
  blockchainProtocol?: string;
}

export interface ContratosReportData {
  empresaNome: string;
  empresaCnpj: string;
  empresaEndereco?: string;
  empresaTelefone?: string;
  empresaEmail?: string;
  empresaLogomarcaUrl?: string;
  filtrosTexto: string;
  totais: {
    qtdTotal: number;
    qtdAssinados: number;
    qtdPendentes: number;
    valorTotalMensal: number;
  };
  itens: ReportItemContrato[];
}

// ----------------------------------------------------
// GERADOR DE RELATÓRIO DE CONTRATOS & BLOCKCHAIN
// ----------------------------------------------------
export function generateContratosPDFReport(data: ContratosReportData) {
  const doc = new jsPDF();

  drawStandardPDFHeader(doc, {
    empresaNome: data.empresaNome,
    empresaCnpj: data.empresaCnpj,
    empresaEndereco: data.empresaEndereco,
    empresaTelefone: data.empresaTelefone,
    empresaEmail: data.empresaEmail,
    empresaLogomarcaUrl: data.empresaLogomarcaUrl,
    tituloDocumento: "RELATÓRIO DE CONTRATOS & AUDITORIA BLOCKCHAIN",
    subtituloDocumento: `Filtro: ${data.filtrosTexto || "Todos os Contratos"} • Selo Bitcoin OpenTimestamps`,
    variant: "white",
  });

  let y = 54;

  // Cabeçalho da Tabela
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 6.5, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, y, 182, 6.5, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(30, 58, 138);

  doc.text("LOCATÁRIO", 18, y + 4.5);
  doc.text("FLAT", 65, y + 4.5);
  doc.text("VIGÊNCIA", 100, y + 4.5);
  doc.text("ALUGUEL", 132, y + 4.5);
  doc.text("STATUS", 152, y + 4.5);
  doc.text("HASH BLOCKCHAIN (SHA-256)", 170, y + 4.5);

  y += 6.5;

  data.itens.forEach((item, index) => {
    if (y > 255) {
      doc.addPage();
      y = 15;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 6.5, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, y, 182, 6.5, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(30, 58, 138);
      doc.text("LOCATÁRIO", 18, y + 4.5);
      doc.text("FLAT", 65, y + 4.5);
      doc.text("VIGÊNCIA", 100, y + 4.5);
      doc.text("ALUGUEL", 132, y + 4.5);
      doc.text("STATUS", 152, y + 4.5);
      doc.text("HASH BLOCKCHAIN (SHA-256)", 170, y + 4.5);
      y += 6.5;
    }

    if (index % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(14, y, 182, 6.5, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(31, 41, 55);

    const locNome = item.locatarioNome.length > 22 ? item.locatarioNome.substring(0, 20) + ".." : item.locatarioNome;
    const flatCond = `${item.flatNumero}`;

    doc.text(locNome, 18, y + 4.2);
    doc.text(flatCond, 65, y + 4.2);
    doc.text(`${item.dataEmissao} - ${item.dataFinal}`, 100, y + 4.2);
    doc.text(`R$ ${item.valorMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 132, y + 4.2);

    if (item.statusAssinatura?.includes("ASSINADO")) {
      doc.setTextColor(16, 185, 129);
      doc.setFont("helvetica", "bold");
      doc.text("ASSINADO", 152, y + 4.2);
    } else {
      doc.setTextColor(245, 158, 11);
      doc.setFont("helvetica", "normal");
      doc.text("PENDENTE", 152, y + 4.2);
    }

    doc.setFont("courier", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(71, 85, 105);
    const hash = item.documentoHashSha256 || "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
    doc.text(hash.substring(0, 16) + "...", 170, y + 4.2);

    y += 6.5;
  });

  // Caixa de Totais
  if (y > 250) {
    doc.addPage();
    y = 15;
  } else {
    y += 4;
  }

  doc.setFillColor(243, 244, 246);
  doc.rect(14, y, 182, 14, "F");
  doc.setDrawColor(209, 213, 219);
  doc.rect(14, y, 182, 14, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);

  doc.setTextColor(31, 41, 55);
  doc.text(`CONTRATOS: ${data.totais.qtdTotal}`, 18, y + 8.5);

  doc.setTextColor(16, 185, 129);
  doc.text(`ASSINADOS: ${data.totais.qtdAssinados}`, 60, y + 8.5);

  doc.setTextColor(245, 158, 11);
  doc.text(`PENDENTES: ${data.totais.qtdPendentes}`, 105, y + 8.5);

  doc.setTextColor(30, 58, 138);
  doc.text(`RECEITA MENSAL: R$ ${data.totais.valorTotalMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 145, y + 8.5);

  // Rodapé do Desenvolvedor
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 280, 196, 280);
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.text("Desenvolvimento: pajotecnologia.com.br (87)996540551", 105, 286, { align: "center" });

  doc.save(`Relatorio_Contratos_Blockchain.pdf`);
}

// ----------------------------------------------------
// GERADOR DE RELATÓRIO DE CONTAS A RECEBER
// ----------------------------------------------------
export function generateContasReceberPDFReport(data: ContasReceberReportData) {
  const doc = new jsPDF();

  drawStandardPDFHeader(doc, {
    empresaNome: data.empresaNome,
    empresaCnpj: data.empresaCnpj,
    empresaEndereco: data.empresaEndereco,
    empresaTelefone: data.empresaTelefone,
    empresaEmail: data.empresaEmail,
    empresaLogomarcaUrl: data.empresaLogomarcaUrl,
    tituloDocumento: "RELATÓRIO FINANCEIRO - CONTAS A RECEBER",
    subtituloDocumento: `Período: ${data.dataInicio} a ${data.dataFim} • Filtro: ${data.filtrosTexto}`,
    variant: "white",
  });

  let y = 54;

  // Cabeçalho da Tabela (Cinza Claro Clean sem Fundo Azul)
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 6.5, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, y, 182, 6.5, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);

  doc.text("LOCATÁRIO", 18, y + 4.5);
  doc.text("FLAT / COND.", 75, y + 4.5);
  doc.text("VENCIMENTO", 115, y + 4.5);
  doc.text("PAGAMENTO", 142, y + 4.5);
  doc.text("VALOR (R$)", 168, y + 4.5);
  doc.text("STATUS", 185, y + 4.5);

  y += 6.5;

  // Linhas da Tabela
  data.itens.forEach((item, index) => {
    if (y > 255) {
      doc.addPage();
      y = 15;

      // Redesenha cabeçalho da tabela na nova página
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 6.5, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, y, 182, 6.5, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(30, 58, 138);
      doc.text("LOCATÁRIO", 18, y + 4.5);
      doc.text("FLAT / COND.", 75, y + 4.5);
      doc.text("VENCIMENTO", 115, y + 4.5);
      doc.text("PAGAMENTO", 142, y + 4.5);
      doc.text("VALOR (R$)", 168, y + 4.5);
      doc.text("STATUS", 185, y + 4.5);
      y += 6.5;
    }

    if (index % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(14, y, 182, 6, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(31, 41, 55);

    const locNome = item.locatarioNome.length > 28 ? item.locatarioNome.substring(0, 26) + ".." : item.locatarioNome;
    const flatCond = `${item.flatNumero}${item.condominioNome ? " (" + item.condominioNome + ")" : ""}`;
    const flatCondTrunc = flatCond.length > 22 ? flatCond.substring(0, 20) + ".." : flatCond;

    doc.text(locNome, 18, y + 4.2);
    doc.text(flatCondTrunc, 75, y + 4.2);
    doc.text(item.dataVencimento, 115, y + 4.2);
    doc.text(item.dataPagamento || "-", 142, y + 4.2);
    doc.text(item.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }), 168, y + 4.2);

    // Status Badge
    if (item.status === "PAGO") {
      doc.setTextColor(16, 185, 129);
      doc.text("PAGO", 185, y + 4.2);
    } else if (item.status === "ATRASADO") {
      doc.setTextColor(239, 68, 68);
      doc.text("ATRASADO", 185, y + 4.2);
    } else {
      doc.setTextColor(245, 158, 11);
      doc.text("PENDENTE", 185, y + 4.2);
    }

    y += 6;
  });

  // Caixa de Totais e KPIs (NO FINAL DO RELATÓRIO / EMBAIXO)
  if (y > 250) {
    doc.addPage();
    y = 15;
  } else {
    y += 4;
  }

  doc.setFillColor(243, 244, 246);
  doc.rect(14, y, 182, 14, "F");
  doc.setDrawColor(209, 213, 219);
  doc.rect(14, y, 182, 14, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);

  doc.setTextColor(31, 41, 55);
  doc.text(`TÍTULOS: ${data.totais.qtdTotal}`, 18, y + 8.5);

  doc.setTextColor(30, 58, 138);
  doc.text(`TOTAL GERAL: R$ ${data.totais.totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 50, y + 8.5);

  doc.setTextColor(16, 185, 129);
  doc.text(`RECEBIDO: R$ ${data.totais.totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 105, y + 8.5);

  doc.setTextColor(239, 68, 68);
  doc.text(`PENDENTE/ATRAS.: R$ ${(data.totais.totalPendente + data.totais.totalAtrasado).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 150, y + 8.5);

  // Rodapé do Desenvolvedor
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 280, 196, 280);
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.text("Desenvolvimento: pajotecnologia.com.br (87)996540551", 105, 286, { align: "center" });

  doc.save(`Relatorio_Contas_a_Receber_${data.dataInicio}_a_${data.dataFim}.pdf`);
}

// ----------------------------------------------------
// GERADOR DE RELATÓRIO DE CONTAS A PAGAR
// ----------------------------------------------------
export function generateContasPagarPDFReport(data: ContasPagarReportData) {
  const doc = new jsPDF();

  drawStandardPDFHeader(doc, {
    empresaNome: data.empresaNome,
    empresaCnpj: data.empresaCnpj,
    empresaEndereco: data.empresaEndereco,
    empresaTelefone: data.empresaTelefone,
    empresaEmail: data.empresaEmail,
    empresaLogomarcaUrl: data.empresaLogomarcaUrl,
    tituloDocumento: "RELATÓRIO FINANCEIRO - CONTAS A PAGAR",
    subtituloDocumento: `Período: ${data.dataInicio} a ${data.dataFim} • Filtro: ${data.filtrosTexto}`,
    variant: "white",
  });

  let y = 54;

  // Cabeçalho da Tabela (Cinza Claro Clean sem Fundo Azul)
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 6.5, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, y, 182, 6.5, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);

  doc.text("DESCRIÇÃO", 18, y + 4.5);
  doc.text("FORNECEDOR / FLAT", 75, y + 4.5);
  doc.text("VENCIMENTO", 120, y + 4.5);
  doc.text("PAGAMENTO", 145, y + 4.5);
  doc.text("VALOR (R$)", 168, y + 4.5);
  doc.text("STATUS", 185, y + 4.5);

  y += 6.5;

  // Linhas da Tabela
  data.itens.forEach((item, index) => {
    if (y > 255) {
      doc.addPage();
      y = 15;

      // Redesenha cabeçalho da tabela na nova página
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 6.5, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, y, 182, 6.5, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(30, 58, 138);
      doc.text("DESCRIÇÃO", 18, y + 4.5);
      doc.text("FORNECEDOR / FLAT", 75, y + 4.5);
      doc.text("VENCIMENTO", 120, y + 4.5);
      doc.text("PAGAMENTO", 145, y + 4.5);
      doc.text("VALOR (R$)", 168, y + 4.5);
      doc.text("STATUS", 185, y + 4.5);
      y += 6.5;
    }

    if (index % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(14, y, 182, 6, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(31, 41, 55);

    const descTxt = item.descricao.length > 26 ? item.descricao.substring(0, 24) + ".." : item.descricao;
    const origTxt = `${item.fornecedorNome || "-"}${item.flatNumero ? " (" + item.flatNumero + ")" : ""}`;
    const origTrunc = origTxt.length > 22 ? origTxt.substring(0, 20) + ".." : origTxt;

    doc.text(descTxt, 18, y + 4.2);
    doc.text(origTrunc, 75, y + 4.2);
    doc.text(item.dataVencimento, 120, y + 4.2);
    doc.text(item.dataPagamento || "-", 145, y + 4.2);
    doc.text(item.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }), 168, y + 4.2);

    // Status Badge
    if (item.status === "PAGO") {
      doc.setTextColor(16, 185, 129);
      doc.text("PAGO", 185, y + 4.2);
    } else if (item.status === "ATRASADO") {
      doc.setTextColor(239, 68, 68);
      doc.text("ATRASADO", 185, y + 4.2);
    } else {
      doc.setTextColor(245, 158, 11);
      doc.text("PENDENTE", 185, y + 4.2);
    }

    y += 6;
  });

  // Caixa de Totais e KPIs (NO FINAL DO RELATÓRIO / EMBAIXO)
  if (y > 250) {
    doc.addPage();
    y = 15;
  } else {
    y += 4;
  }

  doc.setFillColor(243, 244, 246);
  doc.rect(14, y, 182, 14, "F");
  doc.setDrawColor(209, 213, 219);
  doc.rect(14, y, 182, 14, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);

  doc.setTextColor(31, 41, 55);
  doc.text(`LANCAMENTOS: ${data.totais.qtdTotal}`, 18, y + 8.5);

  doc.setTextColor(30, 58, 138);
  doc.text(`TOTAL GERAL: R$ ${data.totais.totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 55, y + 8.5);

  doc.setTextColor(16, 185, 129);
  doc.text(`PAGO: R$ ${data.totais.totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 110, y + 8.5);

  doc.setTextColor(239, 68, 68);
  doc.text(`PENDENTE/ATRAS.: R$ ${(data.totais.totalPendente + data.totais.totalAtrasado).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 150, y + 8.5);

  // Rodapé do Desenvolvedor
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 280, 196, 280);
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.text("Desenvolvimento: pajotecnologia.com.br (87)996540551", 105, 286, { align: "center" });

  doc.save(`Relatorio_Contas_a_Pagar_${data.dataInicio}_a_${data.dataFim}.pdf`);
}

export interface ReportItemFluxoDetalhe {
  tipo: "ENTRADA" | "SAIDA";
  descricao: string;
  referencia: string;
  valor: number;
}

export interface ReportItemFluxoDiario {
  data: string; // DD/MM/AAAA
  totalEntradas: number;
  totalSaidas: number;
  saldoDia: number;
  saldoAcumulado: number;
  detalhes?: ReportItemFluxoDetalhe[];
}

export interface FluxoCaixaReportData {
  empresaNome: string;
  empresaCnpj: string;
  empresaEndereco?: string;
  empresaTelefone?: string;
  empresaEmail?: string;
  empresaLogomarcaUrl?: string;
  dataInicio: string;
  dataFim: string;
  filtrosTexto: string;
  totais: {
    totalEntradas: number;
    totalSaidas: number;
    saldoPeriodo: number;
  };
  itens: ReportItemFluxoDiario[];
}

export function generateFluxoCaixaPDFReport(data: FluxoCaixaReportData) {
  const doc = new jsPDF();

  // 1. Cabeçalho Padronizado (Com Fundo Branco)
  drawStandardPDFHeader(doc, {
    empresaNome: data.empresaNome,
    empresaCnpj: data.empresaCnpj,
    empresaEndereco: data.empresaEndereco,
    empresaTelefone: data.empresaTelefone,
    empresaEmail: data.empresaEmail,
    empresaLogomarcaUrl: data.empresaLogomarcaUrl,
    tituloDocumento: "RELATÓRIO FINANCEIRO - FLUXO DE CAIXA DIÁRIO",
    subtituloDocumento: `Período: ${data.dataInicio} a ${data.dataFim} ${data.filtrosTexto ? "(" + data.filtrosTexto + ")" : ""}`,
    variant: "white",
  });

  let y = 54;

  // 2. Cabeçalho da Tabela (Cinza Claro Clean sem Fundo Azul)
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, y, 182, 7, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);
  doc.text("DATA DO FLUXO / LANÇAMENTO", 18, y + 4.8);
  doc.text("ORIGEM / VÍNCULO", 90, y + 4.8);
  doc.text("CRÉDITO (R$)", 140, y + 4.8);
  doc.text("DÉBITO (R$)", 168, y + 4.8);

  y += 7;

  // Renderizar Dias e Lançamentos Detalhados
  data.itens.forEach((item) => {
    // Checar quebra de página para o bloco do dia
    if (y > 255) {
      doc.addPage();
      y = 15;

      // Re-desenhar cabeçalho da tabela
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 7, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, y, 182, 7, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(30, 58, 138);
      doc.text("DATA DO FLUXO / LANÇAMENTO", 18, y + 4.8);
      doc.text("ORIGEM / VÍNCULO", 90, y + 4.8);
      doc.text("CRÉDITO (R$)", 140, y + 4.8);
      doc.text("DÉBITO (R$)", 168, y + 4.8);
      y += 7;
    }

    // Cabecalho do Dia
    doc.setFillColor(248, 250, 252);
    doc.rect(14, y, 182, 6.5, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, y, 182, 6.5, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text(`DIA: ${item.data}`, 18, y + 4.5);

    // Entradas do Dia
    doc.setTextColor(16, 185, 129);
    doc.text(item.totalEntradas > 0 ? `+ R$ ${item.totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-", 140, y + 4.5);

    // Saídas do Dia
    doc.setTextColor(239, 68, 68);
    doc.text(item.totalSaidas > 0 ? `- R$ ${item.totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-", 168, y + 4.5);

    y += 6.5;

    // Lançamentos Detalhados do Dia (Créditos e Débitos)
    if (item.detalhes && item.detalhes.length > 0) {
      item.detalhes.forEach((det, dIdx) => {
        if (y > 265) {
          doc.addPage();
          y = 15;
          doc.setFillColor(241, 245, 249);
          doc.rect(14, y, 182, 7, "F");
          doc.setDrawColor(226, 232, 240);
          doc.rect(14, y, 182, 7, "S");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(30, 58, 138);
          doc.text("DATA DO FLUXO / LANÇAMENTO", 18, y + 4.8);
          doc.text("ORIGEM / VÍNCULO", 90, y + 4.8);
          doc.text("CRÉDITO (R$)", 140, y + 4.8);
          doc.text("DÉBITO (R$)", 168, y + 4.8);
          y += 7;
        }

        if (dIdx % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(14, y, 182, 6, "F");
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);

        // Indicador de Crédito (+) ou Débito (-)
        const isEntrada = det.tipo === "ENTRADA";
        if (isEntrada) {
          doc.setTextColor(16, 185, 129);
        } else {
          doc.setTextColor(239, 68, 68);
        }

        const badgeTipo = isEntrada ? "[CRÉDITO]" : "[DÉBITO]";
        doc.setFont("helvetica", "bold");
        doc.text(badgeTipo, 22, y + 4.2);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(31, 41, 55);

        const descText = det.descricao.length > 36 ? det.descricao.substring(0, 34) + ".." : det.descricao;
        const refText = det.referencia.length > 28 ? det.referencia.substring(0, 26) + ".." : det.referencia;

        doc.text(descText, 40, y + 4.2);
        doc.text(refText, 90, y + 4.2);

        if (isEntrada) {
          doc.setTextColor(16, 185, 129);
          doc.setFont("helvetica", "bold");
          doc.text(det.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }), 140, y + 4.2);
        } else {
          doc.setTextColor(239, 68, 68);
          doc.setFont("helvetica", "bold");
          doc.text(det.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }), 168, y + 4.2);
        }

        y += 6;
      });
    }

    // Linha de Saldo Acumulado ao final do dia
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Saldo do Dia: R$ ${item.saldoDia.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}   |   Saldo Acumulado: R$ ${item.saldoAcumulado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 22, y + 3.5);
    y += 5.5;
  });

  // Quadro Resumo dos Totais (KPIs) NO FINAL DO RELATÓRIO (EMBAIXO)
  if (y > 250) {
    doc.addPage();
    y = 15;
  } else {
    y += 4;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 16, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  // Entradas (Crédito)
  doc.setTextColor(16, 185, 129);
  doc.text("TOTAL ENTRADAS (CRÉDITO):", 18, y + 6);
  doc.setFontSize(9);
  doc.text(`R$ ${data.totais.totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 18, y + 12);

  // Saídas (Débito)
  doc.setFontSize(8);
  doc.setTextColor(239, 68, 68);
  doc.text("TOTAL SAÍDAS (DÉBITO):", 80, y + 6);
  doc.setFontSize(9);
  doc.text(`R$ ${data.totais.totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 80, y + 12);

  // Saldo Líquido
  doc.setFontSize(8);
  const saldoCor = data.totais.saldoPeriodo >= 0 ? [30, 58, 138] : [239, 68, 68];
  doc.setTextColor(saldoCor[0], saldoCor[1], saldoCor[2]);
  doc.text("SALDO DO PERÍODO:", 140, y + 6);
  doc.setFontSize(9);
  doc.text(`R$ ${data.totais.saldoPeriodo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 140, y + 12);

  // Rodapé do Desenvolvedor
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 280, 196, 280);
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.text("Desenvolvimento: pajotecnologia.com.br (87)996540551", 105, 286, { align: "center" });

  doc.save(`Relatorio_Fluxo_Caixa_Diario_${data.dataInicio}_a_${data.dataFim}.pdf`);
}
