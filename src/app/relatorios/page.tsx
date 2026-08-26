"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Shell from "@/components/layout/Shell";
import {
  BarChart3,
  ClipboardCheck,
  TrendingUp,
  DollarSign,
  FileDown,
  Printer,
  Calendar,
  User,
  Building2,
  Building,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  Truck,
  FileText,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { generateBlankChecklistPDF, defaultBlankChecklistCategories } from "@/lib/blankChecklistPdfGenerator";
import { generateContasReceberPDFReport, generateContasPagarPDFReport, generateFluxoCaixaPDFReport, generateContratosPDFReport } from "@/lib/reportsPdfGenerator";
import { formatMesReferencia } from "@/lib/validation";

function RelatoriosContent() {
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("aba") as "contratos" | "checklist" | "receber" | "pagar" | "fluxo") || "contratos";

  const [loading, setLoading] = useState(true);

  // Dados auxiliares para filtros
  const [empresa, setEmpresa] = useState<any>(null);
  const [locatarios, setLocatarios] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [locais, setLocais] = useState<any[]>([]);

  // Lançamentos Financeiros e Contratos
  const [contasReceberList, setContasReceberList] = useState<any[]>([]);
  const [contasPagarList, setContasPagarList] = useState<any[]>([]);
  const [contratosList, setContratosList] = useState<any[]>([]);

  // ESTADOS DA ABA CONTRATOS (Filtros)
  const [contratoLocatarioId, setContratoLocatarioId] = useState("");
  const [contratoLocalId, setContratoLocalId] = useState("");
  const [contratoStatus, setContratoStatus] = useState("");

  // ESTADOS DA ABA 1: Checklist em Branco
  const [selectedFlatId, setSelectedFlatId] = useState("");
  const [selectedLocatarioId, setSelectedLocatarioId] = useState("");
  const [responsavelVistoria, setResponsavelVistoria] = useState("");

  // ESTADOS DA ABA 2: Contas a Receber (Filtros)
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const [receberDataInicio, setReceberDataInicio] = useState(firstDayOfMonth);
  const [receberDataFim, setReceberDataFim] = useState(lastDayOfMonth);
  const [receberLocatarioId, setReceberLocatarioId] = useState("");
  const [receberLocalId, setReceberLocalId] = useState("");
  const [receberStatus, setReceberStatus] = useState("");

  // ESTADOS DA ABA 3: Contas a Pagar (Filtros)
  const [pagarDataInicio, setPagarDataInicio] = useState(firstDayOfMonth);
  const [pagarDataFim, setPagarDataFim] = useState(lastDayOfMonth);
  const [pagarFornecedorId, setPagarFornecedorId] = useState("");
  const [pagarFlatId, setPagarFlatId] = useState("");
  const [pagarLocalId, setPagarLocalId] = useState("");
  const [pagarStatus, setPagarStatus] = useState("");

  // ESTADOS DA ABA 4: Fluxo de Caixa Diário (Filtros)
  const [fluxoDataInicio, setFluxoDataInicio] = useState(firstDayOfMonth);
  const [fluxoDataFim, setFluxoDataFim] = useState(lastDayOfMonth);

  // Carregar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resEmpresa, resLoc, resForn, resFlats, resRec, resPag, resContratos] = await Promise.all([
          fetch("/api/empresa").then((r) => r.json()).catch(() => ({})),
          fetch("/api/locatarios").then((r) => r.json()).catch(() => ({ locatarios: [] })),
          fetch("/api/fornecedores").then((r) => r.json()).catch(() => ({ fornecedores: [] })),
          fetch("/api/flats").then((r) => r.json()).catch(() => ({ flats: [] })),
          fetch("/api/financeiro/receber").then((r) => r.json()).catch(() => ({ contas: [] })),
          fetch("/api/financeiro/pagar").then((r) => r.json()).catch(() => ({ contas: [] })),
          fetch("/api/contratos").then((r) => r.json()).catch(() => ({ contratos: [] })),
        ]);

        if (resEmpresa?.empresa) setEmpresa(resEmpresa.empresa);
        if (resLoc?.locatarios) setLocatarios(resLoc.locatarios);
        if (resForn?.fornecedores) setFornecedores(resForn.fornecedores);

        if (resFlats?.flats) {
          setFlats(resFlats.flats);
          const uniqueLocaisMap = new Map();
          resFlats.flats.forEach((f: any) => {
            if (f.local && !uniqueLocaisMap.has(f.local.id)) {
              uniqueLocaisMap.set(f.local.id, f.local);
            }
          });
          setLocais(Array.from(uniqueLocaisMap.values()));
        }

        if (resRec?.contas) setContasReceberList(resRec.contas);
        if (resPag?.contas) setContasPagarList(resPag.contas);
        if (resContratos?.contratos) setContratosList(resContratos.contratos);
      } catch (err) {
        console.error("Erro ao carregar dados dos relatórios:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handler: Imprimir Ficha de Checklist em Branco
  const handleImprimirChecklistEmBranco = () => {
    const selFlat = flats.find((f) => f.id === selectedFlatId);
    const selLoc = locatarios.find((l) => l.id === selectedLocatarioId);

    generateBlankChecklistPDF({
      empresaNome: empresa?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: empresa?.cnpj || "00.000.000/0001-00",
      empresaEndereco: empresa?.endereco,
      empresaTelefone: empresa?.telefone,
      empresaEmail: empresa?.email,
      empresaLogomarcaUrl: empresa?.logomarcaUrl,
      flatNumero: selFlat?.numero,
      condominioNome: selFlat?.local?.nome,
      locatarioNome: selLoc?.nome,
      locatarioCpf: selLoc?.cpf,
      responsavelVistoria: responsavelVistoria || undefined,
    });
  };

  // Filtragem e Totais da Aba Contratos & Blockchain
  const filteredContratos = contratosList.filter((c) => {
    if (contratoLocatarioId && c.locatarioId !== contratoLocatarioId) return false;
    if (contratoLocalId && c.flat?.localId !== contratoLocalId) return false;
    if (contratoStatus) {
      if (contratoStatus === "ASSINADO" && !c.statusAssinatura?.includes("ASSINADO")) return false;
      if (contratoStatus === "PENDENTE" && c.statusAssinatura?.includes("ASSINADO")) return false;
    }
    return true;
  });

  const contratosTotais = {
    qtdTotal: filteredContratos.length,
    qtdAssinados: filteredContratos.filter((c) => c.statusAssinatura?.includes("ASSINADO")).length,
    qtdPendentes: filteredContratos.filter((c) => !c.statusAssinatura?.includes("ASSINADO")).length,
    valorTotalMensal: filteredContratos.reduce((acc, c) => acc + (c.valorMensal || 0), 0),
  };

  const handleImprimirContratosPDF = () => {
    const selLoc = locatarios.find((l) => l.id === contratoLocatarioId);
    const selLocal = locais.find((l) => l.id === contratoLocalId);

    const filtrosArr = [];
    if (selLoc) filtrosArr.push(`Locatário: ${selLoc.nome}`);
    if (selLocal) filtrosArr.push(`Condomínio: ${selLocal.nome}`);
    if (contratoStatus) filtrosArr.push(`Status: ${contratoStatus}`);

    generateContratosPDFReport({
      empresaNome: empresa?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: empresa?.cnpj || "00.000.000/0001-00",
      empresaEndereco: empresa?.endereco,
      empresaTelefone: empresa?.telefone,
      empresaEmail: empresa?.email,
      empresaLogomarcaUrl: empresa?.logomarcaUrl,
      filtrosTexto: filtrosArr.length > 0 ? filtrosArr.join(" | ") : "Todos os Contratos",
      totais: contratosTotais,
      itens: filteredContratos.map((c) => ({
        locatarioNome: c.locatario?.nome || "Locatário Não Informado",
        locatarioCpf: c.locatario?.cpf || "-",
        flatNumero: c.flat?.numero || "-",
        condominioNome: c.flat?.local?.nome || "",
        valorMensal: c.valorMensal || 0,
        dataEmissao: c.dataEmissao ? new Date(c.dataEmissao).toLocaleDateString("pt-BR") : "-",
        dataFinal: c.dataFinal ? new Date(c.dataFinal).toLocaleDateString("pt-BR") : "-",
        status: c.status || "ATIVO",
        statusAssinatura: c.statusAssinatura || "PENDENTE",
        documentoHashSha256: c.documentoHashSha256 || undefined,
        blockchainProtocol: c.blockchainProtocol || "OpenTimestamps / Bitcoin",
      })),
    });
  };

  // Filtragem de Contas a Receber
  const filteredReceber = contasReceberList.filter((c) => {
    if (receberDataInicio) {
      const venc = c.dataVencimento ? c.dataVencimento.split("T")[0] : "";
      if (venc < receberDataInicio) return false;
    }
    if (receberDataFim) {
      const venc = c.dataVencimento ? c.dataVencimento.split("T")[0] : "";
      if (venc > receberDataFim) return false;
    }
    if (receberLocatarioId && c.locatarioId !== receberLocatarioId) return false;
    if (receberLocalId && c.contrato?.flat?.localId !== receberLocalId) return false;
    if (receberStatus && c.status !== receberStatus) return false;
    return true;
  });

  // Totais de Contas a Receber
  const receberTotais = {
    totalGeral: filteredReceber.reduce((acc, c) => acc + (c.valor || 0), 0),
    totalRecebido: filteredReceber.filter((c) => c.status === "PAGO").reduce((acc, c) => acc + (c.valorPago || c.valor || 0), 0),
    totalPendente: filteredReceber.filter((c) => c.status === "PENDENTE").reduce((acc, c) => acc + (c.valor || 0), 0),
    totalAtrasado: filteredReceber.filter((c) => c.status === "ATRASADO").reduce((acc, c) => acc + (c.valor || 0), 0),
    qtdTotal: filteredReceber.length,
  };

  // Imprimir Relatório de Contas a Receber PDF
  const handleImprimirReceberPDF = () => {
    const selLoc = locatarios.find((l) => l.id === receberLocatarioId);
    const selLocal = locais.find((l) => l.id === receberLocalId);

    const filtrosArr = [];
    if (selLoc) filtrosArr.push(`Locatário: ${selLoc.nome}`);
    if (selLocal) filtrosArr.push(`Condomínio: ${selLocal.nome}`);
    if (receberStatus) filtrosArr.push(`Status: ${receberStatus}`);
    const filtrosTexto = filtrosArr.length > 0 ? filtrosArr.join(" | ") : "Todos os Lançamentos";

    generateContasReceberPDFReport({
      empresaNome: empresa?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: empresa?.cnpj || "00.000.000/0001-00",
      empresaEndereco: empresa?.endereco,
      empresaTelefone: empresa?.telefone,
      empresaEmail: empresa?.email,
      empresaLogomarcaUrl: empresa?.logomarcaUrl,
      dataInicio: receberDataInicio ? new Date(receberDataInicio).toLocaleDateString("pt-BR") : "Início",
      dataFim: receberDataFim ? new Date(receberDataFim).toLocaleDateString("pt-BR") : "Fim",
      filtrosTexto,
      totais: receberTotais,
      itens: filteredReceber.map((c) => ({
        locatarioNome: c.locatario?.nome || "Locatário Não Informado",
        flatNumero: c.contrato?.flat?.numero || "-",
        condominioNome: c.contrato?.flat?.local?.nome || "",
        mesReferencia: formatMesReferencia(c.mesReferencia),
        numeroParcela: c.numeroParcela || 1,
        dataVencimento: c.dataVencimento ? new Date(c.dataVencimento).toLocaleDateString("pt-BR") : "-",
        dataPagamento: c.dataPagamento ? new Date(c.dataPagamento).toLocaleDateString("pt-BR") : undefined,
        valor: c.valor || 0,
        valorPago: c.valorPago || undefined,
        status: c.status,
      })),
    });
  };

  // Filtragem de Contas a Pagar
  const filteredPagar = contasPagarList.filter((c) => {
    if (pagarDataInicio) {
      const venc = c.dataVencimento ? c.dataVencimento.split("T")[0] : "";
      if (venc < pagarDataInicio) return false;
    }
    if (pagarDataFim) {
      const venc = c.dataVencimento ? c.dataVencimento.split("T")[0] : "";
      if (venc > pagarDataFim) return false;
    }
    if (pagarFornecedorId && c.fornecedorId !== pagarFornecedorId) return false;
    if (pagarFlatId && c.flatId !== pagarFlatId) return false;
    if (pagarLocalId && c.localId !== pagarLocalId) return false;
    if (pagarStatus && c.status !== pagarStatus) return false;
    return true;
  });

  // Totais de Contas a Pagar
  const pagarTotais = {
    totalGeral: filteredPagar.reduce((acc, c) => acc + (c.valor || 0), 0),
    totalPago: filteredPagar.filter((c) => c.status === "PAGO").reduce((acc, c) => acc + (c.valor || 0), 0),
    totalPendente: filteredPagar.filter((c) => c.status === "PENDENTE").reduce((acc, c) => acc + (c.valor || 0), 0),
    totalAtrasado: filteredPagar.filter((c) => c.status === "ATRASADO").reduce((acc, c) => acc + (c.valor || 0), 0),
    qtdTotal: filteredPagar.length,
  };

  // Imprimir Relatório de Contas a Pagar PDF
  const handleImprimirPagarPDF = () => {
    const selForn = fornecedores.find((f) => f.id === pagarFornecedorId);
    const selFlat = flats.find((f) => f.id === pagarFlatId);
    const selLocal = locais.find((l) => l.id === pagarLocalId);

    const filtrosArr = [];
    if (selForn) filtrosArr.push(`Fornecedor: ${selForn.nome}`);
    if (selFlat) filtrosArr.push(`Flat: ${selFlat.numero}`);
    if (selLocal) filtrosArr.push(`Condomínio: ${selLocal.nome}`);
    if (pagarStatus) filtrosArr.push(`Status: ${pagarStatus}`);
    const filtrosTexto = filtrosArr.length > 0 ? filtrosArr.join(" | ") : "Todos os Lançamentos";

    generateContasPagarPDFReport({
      empresaNome: empresa?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: empresa?.cnpj || "00.000.000/0001-00",
      empresaEndereco: empresa?.endereco,
      empresaTelefone: empresa?.telefone,
      empresaEmail: empresa?.email,
      empresaLogomarcaUrl: empresa?.logomarcaUrl,
      dataInicio: pagarDataInicio ? new Date(pagarDataInicio).toLocaleDateString("pt-BR") : "Início",
      dataFim: pagarDataFim ? new Date(pagarDataFim).toLocaleDateString("pt-BR") : "Fim",
      filtrosTexto,
      totais: pagarTotais,
      itens: filteredPagar.map((c) => ({
        descricao: c.descricao || "Conta a Pagar",
        fornecedorNome: c.fornecedor?.nome || "-",
        flatNumero: c.flat?.numero || "",
        condominioNome: c.local?.nome || c.flat?.local?.nome || "",
        dataVencimento: c.dataVencimento ? new Date(c.dataVencimento).toLocaleDateString("pt-BR") : "-",
        dataPagamento: c.dataPagamento ? new Date(c.dataPagamento).toLocaleDateString("pt-BR") : undefined,
        valor: c.valor || 0,
        status: c.status,
      })),
    });
  };

  // =========================================================================
  // ABA 4: FLUXO DE CAIXA DIÁRIO (CÁLCULO E LÓGICA)
  // =========================================================================
  const filteredFluxoDiario = React.useMemo(() => {
    const dailyMap = new Map<string, { entradas: number; saidas: number; detalhes: any[] }>();

    // 1. Processar Contas a Receber Pagas
    contasReceberList.forEach((c) => {
      if (c.status !== "PAGO") return;
      const dateStr = c.dataPagamento ? c.dataPagamento.split("T")[0] : (c.dataVencimento ? c.dataVencimento.split("T")[0] : "");
      if (!dateStr) return;

      if (fluxoDataInicio && dateStr < fluxoDataInicio) return;
      if (fluxoDataFim && dateStr > fluxoDataFim) return;

      const val = c.valorPago || c.valor || 0;
      const existing = dailyMap.get(dateStr) || { entradas: 0, saidas: 0, detalhes: [] };
      existing.entradas += val;
      existing.detalhes.push({
        tipo: "ENTRADA",
        descricao: c.locatario?.nome ? `Aluguel / Receita - ${c.locatario.nome}` : c.observacao || "Receita",
        valor: val,
        referencia: c.contrato?.flat?.numero ? `Flat ${c.contrato.flat.numero}` : "-",
      });
      dailyMap.set(dateStr, existing);
    });

    // 2. Processar Contas a Pagar Pagas
    contasPagarList.forEach((c) => {
      if (c.status !== "PAGO") return;
      const dateStr = c.dataPagamento ? c.dataPagamento.split("T")[0] : (c.dataVencimento ? c.dataVencimento.split("T")[0] : "");
      if (!dateStr) return;

      if (fluxoDataInicio && dateStr < fluxoDataInicio) return;
      if (fluxoDataFim && dateStr > fluxoDataFim) return;

      const val = c.valor || 0;
      const existing = dailyMap.get(dateStr) || { entradas: 0, saidas: 0, detalhes: [] };
      existing.saidas += val;
      existing.detalhes.push({
        tipo: "SAIDA",
        descricao: c.descricao || "Despesa",
        valor: val,
        referencia: c.fornecedor?.razaoSocial || (c.flat?.numero ? `Flat ${c.flat.numero}` : (c.local?.nome ? `Prédio ${c.local.nome}` : "-")),
      });
      dailyMap.set(dateStr, existing);
    });

    // 3. Ordenar por data cronológica crescente
    const sortedDates = Array.from(dailyMap.keys()).sort();

    let acumulado = 0;
    return sortedDates.map((dateKey) => {
      const item = dailyMap.get(dateKey)!;
      const saldoDia = item.entradas - item.saidas;
      acumulado += saldoDia;
      const dateParts = dateKey.split("-");
      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : dateKey;

      return {
        dateISO: dateKey,
        data: formattedDate,
        totalEntradas: item.entradas,
        totalSaidas: item.saidas,
        saldoDia,
        saldoAcumulado: acumulado,
        detalhes: item.detalhes,
      };
    });
  }, [contasReceberList, contasPagarList, fluxoDataInicio, fluxoDataFim]);

  const fluxoTotais = React.useMemo(() => {
    const totalEntradas = filteredFluxoDiario.reduce((acc, d) => acc + d.totalEntradas, 0);
    const totalSaidas = filteredFluxoDiario.reduce((acc, d) => acc + d.totalSaidas, 0);
    const saldoPeriodo = totalEntradas - totalSaidas;
    return { totalEntradas, totalSaidas, saldoPeriodo, qtdDias: filteredFluxoDiario.length };
  }, [filteredFluxoDiario]);

  // Handler Imprimir PDF do Fluxo de Caixa Diário
  const handleImprimirFluxoCaixaPDF = () => {
    generateFluxoCaixaPDFReport({
      empresaNome: empresa?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: empresa?.cnpj || "00.000.000/0001-00",
      empresaEndereco: empresa?.endereco,
      empresaTelefone: empresa?.telefone,
      empresaEmail: empresa?.email,
      empresaLogomarcaUrl: empresa?.logomarcaUrl,
      dataInicio: fluxoDataInicio ? new Date(fluxoDataInicio + "T00:00:00").toLocaleDateString("pt-BR") : "Início",
      dataFim: fluxoDataFim ? new Date(fluxoDataFim + "T00:00:00").toLocaleDateString("pt-BR") : "Fim",
      filtrosTexto: "Lançamentos Efetivados/Pagos",
      totais: fluxoTotais,
      itens: filteredFluxoDiario.map((d) => ({
        data: d.data,
        totalEntradas: d.totalEntradas,
        totalSaidas: d.totalSaidas,
        saldoDia: d.saldoDia,
        saldoAcumulado: d.saldoAcumulado,
        detalhes: d.detalhes || [],
      })),
    });
  };

  return (
    <Shell>
      <div className="space-y-6">
        {/* Cabeçalho do Módulo de Relatórios */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              {activeTab === "contratos" ? (
                <ShieldCheck className="w-7 h-7" />
              ) : activeTab === "checklist" ? (
                <ClipboardCheck className="w-7 h-7" />
              ) : activeTab === "receber" ? (
                <TrendingUp className="w-7 h-7" />
              ) : activeTab === "pagar" ? (
                <DollarSign className="w-7 h-7" />
              ) : (
                <BarChart3 className="w-7 h-7" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {activeTab === "contratos"
                  ? "Relatório de Contratos & Auditoria Blockchain"
                  : activeTab === "checklist"
                  ? "Ficha de Checklist (Em Branco)"
                  : activeTab === "receber"
                  ? "Relatório - Contas a Receber"
                  : activeTab === "pagar"
                  ? "Relatório - Contas a Pagar"
                  : "Relatório - Fluxo de Caixa Diário"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeTab === "contratos"
                  ? "Relatório geral de contratos com hashes SHA-256, prova de imutabilidade Bitcoin (OpenTimestamps) e status de assinatura"
                  : activeTab === "checklist"
                  ? "Ficha impressa por tópicos com marcação e observação manual para vistorias"
                  : activeTab === "receber"
                  ? "Relatório financeiro de recebimentos filtrado por período, locatário e condomínio"
                  : activeTab === "pagar"
                  ? "Relatório financeiro de contas a pagar filtrado por período, fornecedor, flat e condomínio"
                  : "Demonstrativo diário de entradas (recebimentos) x saídas (despesas) com apuração de saldo e acumulado"}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ABA CONTRATOS & BLOCKCHAIN                                                */}
        {/* ========================================================================= */}
        {activeTab === "contratos" && (
          <div className="space-y-6 animate-in fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Contratos</span>
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{contratosTotais.qtdTotal}</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <FileText className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Selo Bitcoin (Assinados)</span>
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{contratosTotais.qtdAssinados}</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Assinatura Pendente</span>
                  <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{contratosTotais.qtdPendentes}</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Receita Mensal</span>
                  <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">R$ {contratosTotais.valorTotalMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Painel de Filtros e Tabela */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                    <Lock className="w-5 h-5 text-blue-600" />
                    <span>Relatório Geral de Contratos e Hashes de Auditoria</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Consulte os contratos ativos, status de assinatura digital e a chave hash SHA-256 de imutabilidade vinculada à Blockchain do Bitcoin.
                  </p>
                </div>

                <button
                  onClick={handleImprimirContratosPDF}
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 transition"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Imprimir / Baixar Relatório PDF</span>
                </button>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Locatário</label>
                  <select
                    value={contratoLocatarioId}
                    onChange={(e) => setContratoLocatarioId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Todos os Locatários --</option>
                    {locatarios.map((l) => (
                      <option key={l.id} value={l.id}>{l.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Condomínio / Prédio</label>
                  <select
                    value={contratoLocalId}
                    onChange={(e) => setContratoLocalId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Todos os Prédios --</option>
                    {locais.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status da Assinatura</label>
                  <select
                    value={contratoStatus}
                    onChange={(e) => setContratoStatus(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Todos os Status --</option>
                    <option value="ASSINADO">✅ Assinado (Com Selo Bitcoin)</option>
                    <option value="PENDENTE">⏳ Assinatura Pendente</option>
                  </select>
                </div>
              </div>

              {/* Tabela de Contratos & Blockchain */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-800/60 uppercase font-bold text-[10px] text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Locatário</th>
                      <th className="py-3 px-4">Flat / Prédio</th>
                      <th className="py-3 px-4">Vigência</th>
                      <th className="py-3 px-4">Valor Mensal</th>
                      <th className="py-3 px-4">Status Assinatura</th>
                      <th className="py-3 px-4">Hash Blockchain (SHA-256)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredContratos.map((c, i) => {
                      const hash = c.documentoHashSha256 || "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
                      const isAssinado = c.statusAssinatura?.includes("ASSINADO");
                      return (
                        <tr key={c.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                            {c.locatario?.nome || "Locatário Não Informado"}
                            <span className="block text-[10px] font-normal text-slate-400">CPF: {c.locatario?.cpf || "-"}</span>
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            Flat {c.flat?.numero}
                            {c.flat?.local?.nome && <span className="block text-[10px] font-normal text-slate-400">{c.flat.local.nome}</span>}
                          </td>
                          <td className="py-3 px-4">
                            {c.dataEmissao ? new Date(c.dataEmissao).toLocaleDateString("pt-BR") : "-"} a {c.dataFinal ? new Date(c.dataFinal).toLocaleDateString("pt-BR") : "-"}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                            R$ {(c.valorMensal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4">
                            {isAssinado ? (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold inline-flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Assinado</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold inline-flex items-center space-x-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Pendente</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            <div className="flex items-center space-x-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-900 w-fit">
                              <Lock className="w-3 h-3 text-blue-500 flex-shrink-0" />
                              <span className="truncate max-w-[140px]" title={hash}>{hash}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 1: FICHA DE CHECKLIST EM BRANCO (PREENCHIMENTO A MÃO)                 */}
        {/* ========================================================================= */}
        {activeTab === "checklist" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                    <Printer className="w-5 h-5 text-blue-500" />
                    <span>Emissão de Ficha de Vistoria / Checklist em Branco</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Gera um PDF formatado por tópicos de categorias com caixas de marcação manual [  ] OK  [  ] Atenção  [  ] Avaria e linhas pontilhadas de observações para preenchimento no papel.
                  </p>
                </div>

                <button
                  onClick={handleImprimirChecklistEmBranco}
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 transition"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Imprimir / Baixar Ficha PDF</span>
                </button>
              </div>

              {/* Formulário Opcional de Pré-preenchimento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Selecionar Flat (Opcional)
                  </label>
                  <select
                    value={selectedFlatId}
                    onChange={(e) => setSelectedFlatId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Deixar campo em branco --</option>
                    {flats.map((f) => (
                      <option key={f.id} value={f.id}>
                        Flat {f.numero} {f.local?.nome ? `(${f.local.nome})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Locatário (Opcional)
                  </label>
                  <select
                    value={selectedLocatarioId}
                    onChange={(e) => setSelectedLocatarioId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Deixar campo em branco --</option>
                    {locatarios.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nome} ({l.cpf || "Sem CPF"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vistoriador Responsável (Opcional)
                  </label>
                  <input
                    type="text"
                    value={responsavelVistoria}
                    onChange={(e) => setResponsavelVistoria(e.target.value)}
                    placeholder="Digite o nome do vistoriador..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Pré-visualização da Estrutura por Tópicos */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Prévia da Estrutura dos Tópicos no Documento Impresso:
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {defaultBlankChecklistCategories.map((group, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">
                          {group.categoria}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {group.itens.length} itens
                        </span>
                      </div>

                      <ul className="space-y-2">
                        {group.itens.map((it, itemIdx) => (
                          <li key={itemIdx} className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{it}</span>
                              <span className="text-[10px] font-mono text-slate-400">
                                [ ] OK  [ ] Atenção  [ ] Avaria
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono italic">
                              Obs: ............................................................................
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: RELATÓRIO DE CONTAS A RECEBER                                      */}
        {/* ========================================================================= */}
        {activeTab === "receber" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Painel de Filtros */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Filtros de Contas a Receber
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleImprimirReceberPDF}
                    disabled={filteredReceber.length === 0}
                    className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 transition disabled:opacity-50"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>🖨️ Imprimir Relatório PDF</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data Inicial (Vencimento)
                  </label>
                  <input
                    type="date"
                    value={receberDataInicio}
                    onChange={(e) => setReceberDataInicio(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data Final (Vencimento)
                  </label>
                  <input
                    type="date"
                    value={receberDataFim}
                    onChange={(e) => setReceberDataFim(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Locatário
                  </label>
                  <select
                    value={receberLocatarioId}
                    onChange={(e) => setReceberLocatarioId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Todos os Locatários --</option>
                    {locatarios.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Condomínio (Local)
                  </label>
                  <select
                    value={receberLocalId}
                    onChange={(e) => setReceberLocalId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Todos os Condomínios --</option>
                    {locais.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={receberStatus}
                    onChange={(e) => setReceberStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Todos os Status --</option>
                    <option value="PENDENTE">Pendente</option>
                    <option value="PAGO">Pago</option>
                    <option value="ATRASADO">Atrasado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cards KPI Totais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total a Receber</span>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  R$ {receberTotais.totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[11px] text-slate-500">{receberTotais.qtdTotal} títulos encontrados</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-950/60 rounded-2xl p-4 shadow-lg space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Recebido (Pago)</span>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  R$ {receberTotais.totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-950/60 rounded-2xl p-4 shadow-lg space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Total Pendente</span>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  R$ {receberTotais.totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/60 rounded-2xl p-4 shadow-lg space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Total Atrasado</span>
                <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                  R$ {receberTotais.totalAtrasado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Tabela de Lançamentos a Receber */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-2.5 px-3">Locatário</th>
                      <th className="py-2.5 px-3">Flat / Condomínio</th>
                      <th className="py-2.5 px-3">Ref. / Parcela</th>
                      <th className="py-2.5 px-3">Vencimento</th>
                      <th className="py-2.5 px-3">Pagamento</th>
                      <th className="py-2.5 px-3 text-right">Valor (R$)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredReceber.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-slate-400 italic">
                          Nenhum lançamento de contas a receber encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredReceber.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-950 transition">
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                            {item.locatario?.nome || "Locatário Não Informado"}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            Flat {item.contrato?.flat?.numero || "-"}{" "}
                            {item.contrato?.flat?.local?.nome ? `(${item.contrato.flat.local.nome})` : ""}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {formatMesReferencia(item.mesReferencia)} (Parc. {item.numeroParcela})
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {item.dataVencimento ? new Date(item.dataVencimento).toLocaleDateString("pt-BR") : "-"}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {item.dataPagamento ? new Date(item.dataPagamento).toLocaleDateString("pt-BR") : "-"}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                            R$ {(item.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === "PAGO"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : item.status === "ATRASADO"
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 3: RELATÓRIO DE CONTAS A PAGAR                                        */}
        {/* ========================================================================= */}
        {activeTab === "pagar" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Painel de Filtros */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-rose-500" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Filtros de Contas a Pagar
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleImprimirPagarPDF}
                    disabled={filteredPagar.length === 0}
                    className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 transition disabled:opacity-50"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>🖨️ Imprimir Relatório PDF</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data Inicial (Vencimento)
                  </label>
                  <input
                    type="date"
                    value={pagarDataInicio}
                    onChange={(e) => setPagarDataInicio(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data Final (Vencimento)
                  </label>
                  <input
                    type="date"
                    value={pagarDataFim}
                    onChange={(e) => setPagarDataFim(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fornecedor
                  </label>
                  <select
                    value={pagarFornecedorId}
                    onChange={(e) => setPagarFornecedorId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Todos os Fornecedores --</option>
                    {fornecedores.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Flat
                  </label>
                  <select
                    value={pagarFlatId}
                    onChange={(e) => setPagarFlatId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Todos os Flats --</option>
                    {flats.map((f) => (
                      <option key={f.id} value={f.id}>
                        Flat {f.numero}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Condomínio (Local)
                  </label>
                  <select
                    value={pagarLocalId}
                    onChange={(e) => setPagarLocalId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Todos os Condomínios --</option>
                    {locais.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={pagarStatus}
                    onChange={(e) => setPagarStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Todos os Status --</option>
                    <option value="PENDENTE">Pendente</option>
                    <option value="PAGO">Pago</option>
                    <option value="ATRASADO">Atrasado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cards KPI Totais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total a Pagar</span>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  R$ {pagarTotais.totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[11px] text-slate-500">{pagarTotais.qtdTotal} contas encontradas</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-950/60 rounded-2xl p-4 shadow-lg space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Pago</span>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  R$ {pagarTotais.totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-950/60 rounded-2xl p-4 shadow-lg space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Total Pendente</span>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  R$ {pagarTotais.totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/60 rounded-2xl p-4 shadow-lg space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Total Atrasado</span>
                <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                  R$ {pagarTotais.totalAtrasado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Tabela de Lançamentos a Pagar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-2.5 px-3">Descrição</th>
                      <th className="py-2.5 px-3">Fornecedor / Flat</th>
                      <th className="py-2.5 px-3">Condomínio</th>
                      <th className="py-2.5 px-3">Vencimento</th>
                      <th className="py-2.5 px-3">Pagamento</th>
                      <th className="py-2.5 px-3 text-right">Valor (R$)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredPagar.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-slate-400 italic">
                          Nenhum lançamento de contas a pagar encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredPagar.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-950 transition">
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                            {item.descricao || "Conta a Pagar"}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {item.fornecedor?.nome || "Sem Fornecedor"}{" "}
                            {item.flat?.numero ? `(Flat ${item.flat.numero})` : ""}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {item.local?.nome || "-"}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {item.dataVencimento ? new Date(item.dataVencimento).toLocaleDateString("pt-BR") : "-"}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {item.dataPagamento ? new Date(item.dataPagamento).toLocaleDateString("pt-BR") : "-"}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                            R$ {(item.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === "PAGO"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : item.status === "ATRASADO"
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 4: FLUXO DE CAIXA DIÁRIO (ENTRADAS X SAÍDAS DIA A DIA)                */}
        {/* ========================================================================= */}
        {activeTab === "fluxo" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Barra de Filtro de Período e Ação PDF */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    <span>Filtros do Fluxo de Caixa Diário</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Selecione o período desejado para apuração diária de recebimentos e pagamentos efetivados.
                  </p>
                </div>

                <button
                  onClick={handleImprimirFluxoCaixaPDF}
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 transition self-start sm:self-auto"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Imprimir / Baixar Relatório PDF</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data Inicial (De)
                  </label>
                  <input
                    type="date"
                    value={fluxoDataInicio}
                    onChange={(e) => setFluxoDataInicio(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data Final (Até)
                  </label>
                  <input
                    type="date"
                    value={fluxoDataFim}
                    onChange={(e) => setFluxoDataFim(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Quadro Resumo KPIs do Período */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-950/60 rounded-2xl p-4 shadow-lg space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Entradas (Recebidos)</span>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  + R$ {fluxoTotais.totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/60 rounded-2xl p-4 shadow-lg space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Total Saídas (Pagos)</span>
                <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                  - R$ {fluxoTotais.totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-950/60 rounded-2xl p-4 shadow-lg space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Resultado do Período</span>
                <p className={`text-lg font-bold ${fluxoTotais.saldoPeriodo >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  R$ {fluxoTotais.saldoPeriodo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Dias com Movimento</span>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {fluxoTotais.qtdDias} {fluxoTotais.qtdDias === 1 ? "dia" : "dias"}
                </p>
              </div>
            </div>

            {/* Tabela Demonstrativa do Fluxo de Caixa Diário */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-2.5 px-3">Data do Fluxo</th>
                      <th className="py-2.5 px-3">Entradas (R$)</th>
                      <th className="py-2.5 px-3">Saídas (R$)</th>
                      <th className="py-2.5 px-3">Resultado do Dia (R$)</th>
                      <th className="py-2.5 px-3 text-right">Saldo Acumulado (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredFluxoDiario.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-slate-400 italic">
                          Nenhuma movimentação financeira efetivada no período selecionado.
                        </td>
                      </tr>
                    ) : (
                      filteredFluxoDiario.map((item) => (
                        <tr key={item.dateISO} className="hover:bg-slate-50 dark:hover:bg-slate-950 transition">
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            <span>{item.data}</span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                            {item.totalEntradas > 0 ? `+ R$ ${item.totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-"}
                          </td>
                          <td className="py-3 px-3 font-semibold text-rose-600 dark:text-rose-400">
                            {item.totalSaidas > 0 ? `- R$ ${item.totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-"}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${item.saldoDia >= 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400" : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"}`}>
                              R$ {item.saldoDia.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-blue-600 dark:text-blue-400 text-sm">
                            R$ {item.saldoAcumulado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}

export default function RelatoriosPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500 font-semibold">Carregando Módulo de Relatórios...</div>}>
      <RelatoriosContent />
    </Suspense>
  );
}
