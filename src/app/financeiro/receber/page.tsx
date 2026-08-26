"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import { formatCurrency, formatMesReferencia } from "@/lib/validation";
import { generateReciboPDF, getReciboPDFBase64 } from "@/lib/pdfGenerator";
import {
  TrendingUp,
  Plus,
  X,
  Filter,
  Edit3,
  Printer,
  Share2,
  FileText,
  CheckCircle2,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

export default function ContasReceberPage() {
  const [contas, setContas] = useState<any[]>([]);
  const [locatarios, setLocatarios] = useState<any[]>([]);
  const [empresaData, setEmpresaData] = useState<any>(null);
  const [formasPagamentoList, setFormasPagamentoList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingConta, setEditingConta] = useState<any>(null);

  // Modal de Dar Baixa
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  const [baixaConta, setBaixaConta] = useState<any>(null);

  // Form State
  const [locatarioId, setLocatarioId] = useState("");
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().split("T")[0]);
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("PENDENTE");
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [valorPago, setValorPago] = useState("");
  const [observacao, setObservacao] = useState("");

  // Filtros Dinâmicos
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [filterDateInicio, setFilterDateInicio] = useState("");
  const [filterDateFim, setFilterDateFim] = useState("");

  // Paginação Dinâmica
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [resContas, resLocatarios, resEmpresa, resFormas] = await Promise.all([
        fetch("/api/financeiro/receber").then((r) => r.json()),
        fetch("/api/locatarios").then((r) => r.json()),
        fetch("/api/empresa").then((r) => r.json()),
        fetch("/api/formas-pagamento").then((r) => r.json()).catch(() => ({ formas: [] })),
      ]);
      setContas(resContas.contas || []);
      setLocatarios(resLocatarios.locatarios || []);
      setEmpresaData(resEmpresa.empresa || null);
      if (resFormas.formas && resFormas.formas.length > 0) {
        const ativas = resFormas.formas.filter((f: any) => f.ativo);
        setFormasPagamentoList(ativas);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadRecibo = (c: any) => {
    const flatNumero = c.contrato?.flat?.numero
      ? `Flat ${c.contrato.flat.numero}`
      : c.observacao || "Receita Avulsa";
    const condominioNome = c.contrato?.flat?.local?.nome || "";
    const mesRefRaw = c.mesReferencia || (c.dataVencimento ? new Date(c.dataVencimento).toLocaleDateString("pt-BR").slice(3) : "Avulso");
    const mesRef = formatMesReferencia(mesRefRaw);

    generateReciboPDF({
      empresaNome: empresaData?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: empresaData?.cnpj || "00.000.000/0001-00",
      empresaEndereco: empresaData?.endereco || undefined,
      empresaTelefone: empresaData?.telefone || undefined,
      empresaEmail: empresaData?.email || undefined,
      empresaLogomarcaUrl: empresaData?.logomarcaUrl || undefined,
      empresaAssinaturaUrl: empresaData?.assinaturaUrl || undefined,
      locatarioNome: c.locatario?.nome || "Locatário",
      locatarioCpf: c.locatario?.cpf || "000.000.000-00",
      flatNumero,
      condominioNome,
      mesReferencia: mesRef,
      valor: Number(c.valorPago || c.valor || 0),
      dataPagamento: c.dataPagamento
        ? new Date(c.dataPagamento).toLocaleDateString("pt-BR")
        : new Date().toLocaleDateString("pt-BR"),
      formaPagamento: c.formaPagamento || "PIX",
      numeroRecibo: c.id.slice(0, 8).toUpperCase(),
    });
  };

  const handleEnviarWhatsAppRecibo = async (c: any) => {
    if (!c.locatario?.telefone) {
      alert("Locatário não possui telefone/WhatsApp cadastrado.");
      return;
    }

    const flatNumero = c.contrato?.flat?.numero
      ? `Flat ${c.contrato.flat.numero}`
      : c.observacao || "Receita Avulsa";
    const condominioNome = c.contrato?.flat?.local?.nome || "";
    const mesRefRaw = c.mesReferencia || (c.dataVencimento ? new Date(c.dataVencimento).toLocaleDateString("pt-BR").slice(3) : "Avulso");
    const mesRef = formatMesReferencia(mesRefRaw);
    const numRecibo = c.id.slice(0, 8).toUpperCase();

    const pdfBase64 = await getReciboPDFBase64({
      empresaNome: empresaData?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: empresaData?.cnpj || "00.000.000/0001-00",
      empresaEndereco: empresaData?.endereco || undefined,
      empresaTelefone: empresaData?.telefone || undefined,
      empresaEmail: empresaData?.email || undefined,
      empresaLogomarcaUrl: empresaData?.logomarcaUrl || undefined,
      empresaAssinaturaUrl: empresaData?.assinaturaUrl || undefined,
      locatarioNome: c.locatario?.nome || "Locatário",
      locatarioCpf: c.locatario?.cpf || "000.000.000-00",
      flatNumero,
      condominioNome,
      mesReferencia: mesRef,
      valor: Number(c.valorPago || c.valor || 0),
      dataPagamento: c.dataPagamento
        ? new Date(c.dataPagamento).toLocaleDateString("pt-BR")
        : new Date().toLocaleDateString("pt-BR"),
      formaPagamento: c.formaPagamento || "PIX",
      numeroRecibo: numRecibo,
    });

    const text = `*COMPROVANTE DE PAGAMENTO / RECIBO*\n\nOlá *${c.locatario?.nome}*,\nSegue em anexo o recibo de pagamento em PDF referente a *${flatNumero}* (Ref: ${mesRef}). Obrigado!`;

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: c.locatario.telefone,
          message: text,
          pdfBase64,
          fileName: `Recibo_${numRecibo}_${mesRef.replace("/", "_")}.pdf`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Recibo em PDF enviado com sucesso pelo WhatsApp!");
      } else {
        alert(`❌ Falha ao enviar pelo WhatsApp:\n${data.error || "Verifique as configurações em Parâmetros."}`);
      }
    } catch (err: any) {
      alert(`❌ Erro ao enviar recibo via WhatsApp: ${err.message || err}`);
    }
  };

  const handleOpenNewModal = () => {
    setEditingConta(null);
    setLocatarioId(locatarios[0]?.id || "");
    setValor("");
    setDataVencimento(new Date().toISOString().split("T")[0]);
    setDataPagamento(new Date().toISOString().split("T")[0]);
    setStatus("PENDENTE");
    setFormaPagamento("PIX");
    setValorPago("");
    setObservacao("");
    setShowModal(true);
  };

  const handleOpenEditModal = (conta: any) => {
    setEditingConta(conta);
    setLocatarioId(conta.locatarioId);
    setValor(conta.valor ? conta.valor.toString() : "");
    setDataVencimento(conta.dataVencimento ? new Date(conta.dataVencimento).toISOString().split("T")[0] : "");
    setDataPagamento(conta.dataPagamento ? new Date(conta.dataPagamento).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
    setStatus(conta.status || "PENDENTE");
    setFormaPagamento(conta.formaPagamento || "PIX");
    setValorPago(conta.valorPago ? conta.valorPago.toString() : (conta.valor ? conta.valor.toString() : ""));
    setObservacao(conta.observacao || "");
    setShowModal(true);
  };

  const handleOpenBaixaModal = (conta: any) => {
    setBaixaConta(conta);
    setDataPagamento(new Date().toISOString().split("T")[0]);
    setFormaPagamento(conta.formaPagamento || "PIX");
    setValorPago(conta.valor ? conta.valor.toString() : "");
    setShowBaixaModal(true);
  };

  const handleConfirmarBaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baixaConta) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/financeiro/receber", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: baixaConta.id,
          status: "PAGO",
          dataPagamento,
          formaPagamento,
          valorPago: valorPago || baixaConta.valor,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowBaixaModal(false);
        await loadData();
        alert("✅ Baixa registrada com sucesso!");
      } else {
        alert(`❌ Falha ao registrar baixa: ${data.error || "Erro desconhecido"}`);
      }
    } catch (err: any) {
      alert(`❌ Erro ao registrar baixa: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveConta = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const method = editingConta ? "PUT" : "POST";
      const res = await fetch("/api/financeiro/receber", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingConta?.id,
          locatarioId,
          valor,
          dataVencimento,
          status,
          formaPagamento,
          valorPago: status === "PAGO" ? (valorPago || valor) : null,
          dataPagamento: status === "PAGO" ? dataPagamento : null,
          observacao,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        await loadData();
      } else {
        alert(`❌ Erro ao salvar lançamento: ${data.error || "Erro no servidor"}`);
      }
    } catch (err: any) {
      alert(`❌ Erro de conexão: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtragem Dinâmica Avançada
  const contasFiltradas = contas.filter((c) => {
    if (filterStatus !== "TODOS" && c.status !== filterStatus) return false;

    if (filterDateInicio) {
      const venc = c.dataVencimento ? c.dataVencimento.split("T")[0] : "";
      if (venc < filterDateInicio) return false;
    }
    if (filterDateFim) {
      const venc = c.dataVencimento ? c.dataVencimento.split("T")[0] : "";
      if (venc > filterDateFim) return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const locNome = c.locatario?.nome?.toLowerCase() || "";
      const flatNum = c.contrato?.flat?.numero?.toString().toLowerCase() || "";
      const obs = c.observacao?.toLowerCase() || "";
      const mesRef = c.mesReferencia?.toLowerCase() || "";
      if (!locNome.includes(term) && !flatNum.includes(term) && !obs.includes(term) && !mesRef.includes(term)) {
        return false;
      }
    }

    return true;
  });

  // Cálculo da Paginação Dinâmica
  const totalPages = Math.max(1, Math.ceil(contasFiltradas.length / itemsPerPage));
  const pageValid = Math.min(currentPage, totalPages);
  const startIndex = (pageValid - 1) * itemsPerPage;
  const paginatedContas = contasFiltradas.slice(startIndex, startIndex + itemsPerPage);

  const resetFilters = () => {
    setSearchTerm("");
    setFilterStatus("TODOS");
    setFilterDateInicio("");
    setFilterDateFim("");
    setCurrentPage(1);
  };

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Contas a Receber (Receitas)</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestão e edição completa de parcelas de aluguel e receitas avulsas
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenNewModal}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-xs shadow-md flex items-center space-x-2 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Receita Avulsa</span>
          </button>
        </div>

        {/* BARRA DE FILTROS E BUSCA DINÂMICA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Busca por Texto */}
            <div className="relative">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Buscar Lançamento</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Locatário, flat, obs ou mês..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            {/* Filtro por Status */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="PAGO">Pagos</option>
                <option value="ATRASADO">Atrasados</option>
              </select>
            </div>

            {/* Período de Vencimento (Início) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Vencimento De</label>
              <input
                type="date"
                value={filterDateInicio}
                onChange={(e) => {
                  setFilterDateInicio(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Período de Vencimento (Fim) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Vencimento Até</label>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={filterDateFim}
                  onChange={(e) => {
                    setFilterDateFim(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={resetFilters}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                  title="Limpar Filtros"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TABELA DE CONTAS A RECEBER */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Locatário / Referência</th>
                  <th className="py-3.5 px-4">Flat Vinculado</th>
                  <th className="py-3.5 px-4">Vencimento</th>
                  <th className="py-3.5 px-4">Valor (R$)</th>
                  <th className="py-3.5 px-4">Status & Data da Baixa</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Carregando lançamentos...
                    </td>
                  </tr>
                ) : paginatedContas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Nenhum lançamento encontrado para os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  paginatedContas.map((c) => {
                    const isPago = c.status === "PAGO";
                    const isAtrasado = c.status === "ATRASADO";

                    return (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-200">
                          {c.locatario?.nome || "Locatário"}
                          <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400">
                            {c.observacao || `Mês Ref: ${formatMesReferencia(c.mesReferencia)}`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {c.contrato?.flat?.numero || "Receita Avulsa"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {new Date(c.dataVencimento).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(c.valorPago || c.valor)}
                        </td>
                        <td className="py-3.5 px-4">
                          {isPago ? (
                            <div>
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-[10px] font-bold inline-block">
                                PAGO ({c.formaPagamento || "PIX"})
                              </span>
                              <span className="block text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                                Baixa: {c.dataPagamento ? new Date(c.dataPagamento).toLocaleDateString("pt-BR") : "-"}
                              </span>
                            </div>
                          ) : isAtrasado ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 text-[10px] font-bold">
                              ATRASADO
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 text-[10px] font-bold">
                              PENDENTE
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {!isPago && (
                              <button
                                onClick={() => handleOpenBaixaModal(c)}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center space-x-1 shadow-sm transition"
                                title="Registrar Baixa de Pagamento"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Dar Baixa</span>
                              </button>
                            )}

                            {isPago && (
                              <>
                                <button
                                  onClick={() => handleDownloadRecibo(c)}
                                  className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition"
                                  title="Imprimir / Baixar Recibo PDF"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEnviarWhatsAppRecibo(c)}
                                  className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition"
                                  title="Enviar Recibo em PDF via WhatsApp"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleOpenEditModal(c)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Editar Conta a Receber"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* BARRA DE PAGINAÇÃO DINÂMICA */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
              <span>Exibindo</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {contasFiltradas.length > 0 ? startIndex + 1 : 0}
              </span>
              <span>até</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {Math.min(startIndex + itemsPerPage, contasFiltradas.length)}
              </span>
              <span>de</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{contasFiltradas.length}</span>
              <span>registros</span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Quantidade por Página */}
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Exibir:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 font-semibold"
                >
                  <option value={10}>10 por pg</option>
                  <option value={25}>25 por pg</option>
                  <option value={50}>50 por pg</option>
                  <option value={100}>100 por pg</option>
                </select>
              </div>

              {/* Botões de Navegação */}
              <div className="flex items-center space-x-1">
                <button
                  disabled={pageValid <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Página Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-2 font-semibold text-slate-700 dark:text-slate-300 text-xs">
                  {pageValid} / {totalPages}
                </span>

                <button
                  disabled={pageValid >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Próxima Página"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de DAR BAIXA NO PAGAMENTO */}
        {showBaixaModal && baixaConta && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Dar Baixa no Recebimento
                  </h3>
                </div>
                <button onClick={() => setShowBaixaModal(false)} className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs space-y-1">
                <p className="font-bold text-emerald-900 dark:text-emerald-200">
                  Locatário: {baixaConta.locatario?.nome || "Locatário"}
                </p>
                <p className="text-emerald-700 dark:text-emerald-300">
                  Ref: {baixaConta.mesReferencia || "Avulso"} | Flat: {baixaConta.contrato?.flat?.numero || "Geral"} | Valor Original: {formatCurrency(baixaConta.valor)}
                </p>
              </div>

              <form onSubmit={handleConfirmarBaixa} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Data da Baixa (Data do Pagamento)</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dataPagamento}
                    onChange={(e) => setDataPagamento(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Forma de Pagamento</label>
                    <select
                      value={formaPagamento}
                      onChange={(e) => setFormaPagamento(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                    >
                      {formasPagamentoList.length > 0 ? (
                        formasPagamentoList.map((f) => (
                          <option key={f.id} value={f.nome}>
                            {f.nome}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="PIX">PIX</option>
                          <option value="DINHEIRO">Dinheiro</option>
                          <option value="CARTÃO DE CRÉDITO">Cartão de Crédito</option>
                          <option value="CARTÃO DE DÉBITO">Cartão de Débito</option>
                          <option value="BOLETO BANCÁRIO">Boleto Bancário</option>
                          <option value="TRANSFERÊNCIA / TED">Transferência / TED</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Valor Recebido (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={valorPago}
                      onChange={(e) => setValorPago(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs shadow-lg transition flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Baixa e Registrar Recebimento</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Novo / Editar Lançamento a Receber */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {editingConta ? "Editar Conta a Receber" : "Nova Receita Avulsa"}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveConta} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Locatário</label>
                  <select
                    required
                    value={locatarioId}
                    onChange={(e) => setLocatarioId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Escolha o Locatário --</option>
                    {locatarios.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Vencimento</label>
                    <input
                      type="date"
                      required
                      value={dataVencimento}
                      onChange={(e) => setDataVencimento(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="PENDENTE">Pendente</option>
                      <option value="PAGO">Pago</option>
                      <option value="ATRASADO">Atrasado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Forma Pagamento</label>
                    <select
                      value={formaPagamento}
                      onChange={(e) => setFormaPagamento(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                    >
                      {formasPagamentoList.length > 0 ? (
                        formasPagamentoList.map((f) => (
                          <option key={f.id} value={f.nome}>
                            {f.nome}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="PIX">PIX</option>
                          <option value="DINHEIRO">Dinheiro</option>
                          <option value="CARTÃO DE CRÉDITO">Cartão de Crédito</option>
                          <option value="CARTÃO DE DÉBITO">Cartão de Débito</option>
                          <option value="BOLETO BANCÁRIO">Boleto Bancário</option>
                          <option value="TRANSFERÊNCIA / TED">Transferência / TED</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {status === "PAGO" && (
                  <div>
                    <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Data da Baixa (Data do Pagamento)</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={dataPagamento}
                      onChange={(e) => setDataPagamento(e.target.value)}
                      className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Observação / Descrição</label>
                  <input
                    type="text"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="ex: Taxa de limpeza extra"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-xs"
                >
                  {editingConta ? "Atualizar Lançamento" : "Salvar Receita"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
