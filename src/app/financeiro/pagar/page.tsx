"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import { formatCurrency } from "@/lib/validation";
import {
  DollarSign,
  Plus,
  X,
  Edit3,
  Building,
  Building2,
  CheckCircle2,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Filter,
} from "lucide-react";

export default function ContasPagarPage() {
  const [contas, setContas] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [locais, setLocais] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingConta, setEditingConta] = useState<any>(null);

  // Modal de Dar Baixa
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  const [baixaConta, setBaixaConta] = useState<any>(null);

  // Form State
  const [fornecedorId, setFornecedorId] = useState("");
  const [localId, setLocalId] = useState("");
  const [flatId, setFlatId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().split("T")[0]);
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("PENDENTE");

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
      const [resContas, resFornecedores, resFlats] = await Promise.all([
        fetch("/api/financeiro/pagar").then((r) => r.json()),
        fetch("/api/fornecedores").then((r) => r.json()),
        fetch("/api/flats").then((r) => r.json()),
      ]);
      setContas(resContas.contas || []);
      setFornecedores(resFornecedores.fornecedores || []);
      setLocais(resFlats.locais || []);
      setFlats(resFlats.flats || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenNewModal = () => {
    setEditingConta(null);
    setFornecedorId("");
    setLocalId("");
    setFlatId("");
    setDescricao("");
    setValor("");
    setDataVencimento(new Date().toISOString().split("T")[0]);
    setDataPagamento(new Date().toISOString().split("T")[0]);
    setStatus("PENDENTE");
    setShowModal(true);
  };

  const handleOpenEditModal = (c: any) => {
    setEditingConta(c);
    setFornecedorId(c.fornecedorId || "");
    setLocalId(c.localId || "");
    setFlatId(c.flatId || "");
    setDescricao(c.descricao || "");
    setValor(c.valor ? c.valor.toString() : "");
    setDataVencimento(c.dataVencimento ? new Date(c.dataVencimento).toISOString().split("T")[0] : "");
    setDataPagamento(c.dataPagamento ? new Date(c.dataPagamento).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
    setStatus(c.status || "PENDENTE");
    setShowModal(true);
  };

  const handleOpenBaixaModal = (c: any) => {
    setBaixaConta(c);
    setDataPagamento(new Date().toISOString().split("T")[0]);
    setShowBaixaModal(true);
  };

  const handleConfirmarBaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baixaConta) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/financeiro/pagar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: baixaConta.id,
          status: "PAGO",
          dataPagamento,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowBaixaModal(false);
        await loadData();
        alert("✅ Baixa de despesa registrada com sucesso!");
      } else {
        alert(`❌ Falha ao registrar baixa: ${data.error || "Erro desconhecido"}`);
      }
    } catch (err: any) {
      alert(`❌ Erro ao registrar baixa: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const method = editingConta ? "PUT" : "POST";
      const res = await fetch("/api/financeiro/pagar", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingConta?.id,
          fornecedorId,
          localId,
          flatId,
          descricao,
          valor,
          dataVencimento,
          status,
          dataPagamento: status === "PAGO" ? dataPagamento : null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        await loadData();
      } else {
        alert(`❌ Erro ao salvar despesa: ${data.error || "Erro no servidor"}`);
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
      const desc = c.descricao?.toLowerCase() || "";
      const forn = c.fornecedor?.razaoSocial?.toLowerCase() || "";
      const local = c.local?.nome?.toLowerCase() || "";
      const flatNum = c.flat?.numero?.toString().toLowerCase() || "";
      if (!desc.includes(term) && !forn.includes(term) && !local.includes(term) && !flatNum.includes(term)) {
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
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-600/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Contas a Pagar (Despesas)</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lançamento e edição de despesas do prédio/condomínio, flats ou gerais da empresa
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenNewModal}
            className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 font-semibold text-white text-xs shadow-md flex items-center space-x-2 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Nova Despesa</span>
          </button>
        </div>

        {/* BARRA DE FILTROS E BUSCA DINÂMICA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Busca por Texto */}
            <div className="relative">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Buscar Despesa</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Descrição, fornecedor ou flat..."
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

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Descrição da Despesa</th>
                  <th className="py-3.5 px-4">Fornecedor</th>
                  <th className="py-3.5 px-4">Vínculo Imobiliário</th>
                  <th className="py-3.5 px-4">Vencimento</th>
                  <th className="py-3.5 px-4">Valor (R$)</th>
                  <th className="py-3.5 px-4">Status & Data da Baixa</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Carregando despesas...
                    </td>
                  </tr>
                ) : paginatedContas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Nenhuma despesa encontrada para os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  paginatedContas.map((c) => {
                    const isPago = c.status === "PAGO";

                    return (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-200">{c.descricao}</td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {c.fornecedor?.razaoSocial || "Despesa Direta"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {c.local ? (
                            <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 text-[11px] inline-flex items-center space-x-1">
                              <Building className="w-3 h-3" />
                              <span>{c.local.nome} (Prédio)</span>
                            </span>
                          ) : c.flat ? (
                            <span className="px-2 py-0.5 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-semibold border border-cyan-200 dark:border-cyan-800 text-[11px] inline-flex items-center space-x-1">
                              <Building2 className="w-3 h-3" />
                              <span>Flat {c.flat.numero}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Geral / Empresa</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {new Date(c.dataVencimento).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-rose-600 dark:text-rose-400">
                          {formatCurrency(c.valor)}
                        </td>
                        <td className="py-3.5 px-4">
                          {isPago ? (
                            <div>
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-[10px] font-bold inline-block">
                                PAGO
                              </span>
                              <span className="block text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                                Baixa: {c.dataPagamento ? new Date(c.dataPagamento).toLocaleDateString("pt-BR") : "-"}
                              </span>
                            </div>
                          ) : (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                c.status === "ATRASADO"
                                  ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50"
                                  : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50"
                              }`}
                            >
                              {c.status || "PENDENTE"}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {!isPago && (
                              <button
                                onClick={() => handleOpenBaixaModal(c)}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center space-x-1 shadow-sm transition"
                                title="Registrar Baixa do Pagamento"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Dar Baixa</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenEditModal(c)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Editar Despesa"
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

        {/* Modal de DAR BAIXA EM DESPESA */}
        {showBaixaModal && baixaConta && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Dar Baixa em Conta a Pagar
                  </h3>
                </div>
                <button onClick={() => setShowBaixaModal(false)} className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs space-y-1">
                <p className="font-bold text-rose-900 dark:text-rose-200">
                  Despesa: {baixaConta.descricao}
                </p>
                <p className="text-rose-700 dark:text-rose-300">
                  Fornecedor: {baixaConta.fornecedor?.razaoSocial || "Despesa Direta"} | Valor: {formatCurrency(baixaConta.valor)}
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs shadow-lg transition flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Baixa do Pagamento</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Novo / Editar Lançamento a Pagar */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {editingConta ? "Editar Despesa" : "Lançamento de Despesa"}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveDespesa} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição da Despesa</label>
                  <input
                    type="text"
                    required
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="ex: Manutenção de Elevadores ou Taxa do Prédio"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Fornecedor (Opcional)</label>
                  <select
                    value={fornecedorId}
                    onChange={(e) => setFornecedorId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Nenhum Fornecedor --</option>
                    {fornecedores.map((f) => (
                      <option key={f.id} value={f.id}>{f.razaoSocial}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Condomínio / Edifício</label>
                    <select
                      value={localId}
                      onChange={(e) => {
                        setLocalId(e.target.value);
                        if (e.target.value) setFlatId("");
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="">-- Nenhum --</option>
                      {locais.map((l) => (
                        <option key={l.id} value={l.id}>{l.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Flat Específico</label>
                    <select
                      value={flatId}
                      onChange={(e) => {
                        setFlatId(e.target.value);
                        if (e.target.value) setLocalId("");
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="">-- Nenhum --</option>
                      {flats.map((fl) => (
                        <option key={fl.id} value={fl.id}>{fl.numero}</option>
                      ))}
                    </select>
                  </div>
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-semibold text-white text-xs"
                >
                  {editingConta ? "Atualizar Despesa" : "Salvar Despesa"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
