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

  // Caixa de Totais e KPIs
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

  y += 18;

  // Cabeçalho da Tabela
  doc.setFillColor(30, 58, 138);
  doc.rect(14, y, 182, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  doc.text("LOCATÁRIO", 18, y + 4.2);
  doc.text("FLAT / COND.", 75, y + 4.2);
  doc.text("VENCIMENTO", 115, y + 4.2);
  doc.text("PAGAMENTO", 142, y + 4.2);
  doc.text("VALOR (R$)", 168, y + 4.2);
  doc.text("STATUS", 185, y + 4.2);

  y += 6;

  // Linhas da Tabela
  data.itens.forEach((item, index) => {
    if (y > 265) {
      doc.addPage();
      y = 15;

      // Redesenha cabeçalho da tabela na nova página
      doc.setFillColor(30, 58, 138);
      doc.rect(14, y, 182, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text("LOCATÁRIO", 18, y + 4.2);
      doc.text("FLAT / COND.", 75, y + 4.2);
      doc.text("VENCIMENTO", 115, y + 4.2);
      doc.text("PAGAMENTO", 142, y + 4.2);
      doc.text("VALOR (R$)", 168, y + 4.2);
      doc.text("STATUS", 185, y + 4.2);
      y += 6;
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

  // Caixa de Totais e KPIs
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

  y += 18;

  // Cabeçalho da Tabela
  doc.setFillColor(30, 58, 138);
  doc.rect(14, y, 182, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  doc.text("DESCRIÇÃO", 18, y + 4.2);
  doc.text("FORNECEDOR / FLAT", 75, y + 4.2);
  doc.text("VENCIMENTO", 120, y + 4.2);
  doc.text("PAGAMENTO", 145, y + 4.2);
  doc.text("VALOR (R$)", 168, y + 4.2);
  doc.text("STATUS", 185, y + 4.2);

  y += 6;

  // Linhas da Tabela
  data.itens.forEach((item, index) => {
    if (y > 265) {
      doc.addPage();
      y = 15;

      // Redesenha cabeçalho da tabela na nova página
      doc.setFillColor(30, 58, 138);
      doc.rect(14, y, 182, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text("DESCRIÇÃO", 18, y + 4.2);
      doc.text("FORNECEDOR / FLAT", 75, y + 4.2);
      doc.text("VENCIMENTO", 120, y + 4.2);
      doc.text("PAGAMENTO", 145, y + 4.2);
      doc.text("VALOR (R$)", 168, y + 4.2);
      doc.text("STATUS", 185, y + 4.2);
      y += 6;
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

  // Rodapé do Desenvolvedor
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 280, 196, 280);
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.text("Desenvolvimento: pajotecnologia.com.br (87)996540551", 105, 286, { align: "center" });

  doc.save(`Relatorio_Contas_a_Pagar_${data.dataInicio}_a_${data.dataFim}.pdf`);
}

export interface ReportItemFluxoDiario {
  data: string; // DD/MM/AAAA
  totalEntradas: number;
  totalSaidas: number;
  saldoDia: number;
  saldoAcumulado: number;
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

  // 1. Cabeçalho Padronizado
  drawStandardPDFHeader(doc, {
    empresaNome: data.empresaNome,
    empresaCnpj: data.empresaCnpj,
    empresaEndereco: data.empresaEndereco,
    empresaTelefone: data.empresaTelefone,
    empresaEmail: data.empresaEmail,
    empresaLogomarcaUrl: data.empresaLogomarcaUrl,
    tituloDocumento: "RELATÓRIO FINANCEIRO - FLUXO DE CAIXA DIÁRIO",
    subtituloDocumento: `Período: ${data.dataInicio} a ${data.dataFim} ${data.filtrosTexto ? "(" + data.filtrosTexto + ")" : ""}`,
  });

  let y = 58;

  // 2. Quadro Resumo dos Totais (KPIs)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 16, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  // Entradas
  doc.setTextColor(16, 185, 129);
  doc.text("TOTAL ENTRADAS:", 18, y + 6);
  doc.setFontSize(9);
  doc.text(`R$ ${data.totais.totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 18, y + 12);

  // Saídas
  doc.setFontSize(8);
  doc.setTextColor(239, 68, 68);
  doc.text("TOTAL SAÍDAS:", 80, y + 6);
  doc.setFontSize(9);
  doc.text(`R$ ${data.totais.totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 80, y + 12);

  // Saldo Líquido
  doc.setFontSize(8);
  const saldoCor = data.totais.saldoPeriodo >= 0 ? [30, 58, 138] : [239, 68, 68];
  doc.setTextColor(saldoCor[0], saldoCor[1], saldoCor[2]);
  doc.text("SALDO DO PERÍODO:", 140, y + 6);
  doc.setFontSize(9);
  doc.text(`R$ ${data.totais.saldoPeriodo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 140, y + 12);

  y += 22;

  // 3. Cabeçalho da Tabela
  doc.setFillColor(30, 58, 138); // Azul Marinho
  doc.rect(14, y, 182, 7, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("DATA DO FLUXO", 18, y + 4.8);
  doc.text("ENTRADAS (R$)", 65, y + 4.8);
  doc.text("SAÍDAS (R$)", 105, y + 4.8);
  doc.text("SALDO DO DIA (R$)", 140, y + 4.8);
  doc.text("SALDO ACUMULADO (R$)", 172, y + 4.8);

  y += 7;

  // Linhas da Tabela
  data.itens.forEach((item, index) => {
    if (y > 265) {
      doc.addPage();
      y = 15;

      // Redesenha cabeçalho da tabela na nova página
      doc.setFillColor(30, 58, 138);
      doc.rect(14, y, 182, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text("DATA DO FLUXO", 18, y + 4.8);
      doc.text("ENTRADAS (R$)", 65, y + 4.8);
      doc.text("SAÍDAS (R$)", 105, y + 4.8);
      doc.text("SALDO DO DIA (R$)", 140, y + 4.8);
      doc.text("SALDO ACUMULADO (R$)", 172, y + 4.8);
      y += 7;
    }

    if (index % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(14, y, 182, 6.5, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(31, 41, 55);

    doc.text(item.data, 18, y + 4.5);

    // Entradas
    doc.setTextColor(16, 185, 129);
    doc.text(item.totalEntradas > 0 ? `+ ${item.totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-", 65, y + 4.5);

    // Saídas
    doc.setTextColor(239, 68, 68);
    doc.text(item.totalSaidas > 0 ? `- ${item.totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-", 105, y + 4.5);

    // Saldo do dia
    if (item.saldoDia >= 0) {
      doc.setTextColor(16, 185, 129);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(item.saldoDia.toLocaleString("pt-BR", { minimumFractionDigits: 2 }), 140, y + 4.5);

    // Saldo Acumulado
    if (item.saldoAcumulado >= 0) {
      doc.setTextColor(30, 58, 138);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.setFont("helvetica", "bold");
    doc.text(item.saldoAcumulado.toLocaleString("pt-BR", { minimumFractionDigits: 2 }), 172, y + 4.5);

    y += 6.5;
  });

  // Rodapé do Desenvolvedor
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 280, 196, 280);
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.text("Desenvolvimento: pajotecnologia.com.br (87)996540551", 105, 286, { align: "center" });

  doc.save(`Relatorio_Fluxo_Caixa_Diario_${data.dataInicio}_a_${data.dataFim}.pdf`);
}

