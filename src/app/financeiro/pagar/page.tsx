"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import { formatCurrency } from "@/lib/validation";
import { DollarSign, Plus, X, Edit3, Building, Building2 } from "lucide-react";

export default function ContasPagarPage() {
  const [contas, setContas] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [locais, setLocais] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingConta, setEditingConta] = useState<any>(null);

  // Form State
  const [fornecedorId, setFornecedorId] = useState("");
  const [localId, setLocalId] = useState("");
  const [flatId, setFlatId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("PENDENTE");

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
    setStatus(c.status || "PENDENTE");
    setShowModal(true);
  };

  const handleSaveDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const method = editingConta ? "PUT" : "POST";
      await fetch("/api/financeiro/pagar", {
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
        }),
      });
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-6">
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
            className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 font-semibold text-white text-xs shadow-md flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Nova Despesa</span>
          </button>
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
                  <th className="py-3.5 px-4">Status</th>
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
                ) : contas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Nenhuma despesa cadastrada.
                    </td>
                  </tr>
                ) : (
                  contas.map((c) => (
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
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            c.status === "PAGO"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50"
                              : c.status === "ATRASADO"
                              ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50"
                          }`}
                        >
                          {c.status || "PENDENTE"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Editar Despesa"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

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
                        if (e.target.value) setFlatId(""); // Limpa Flat se selecionou o prédio todo
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
                        if (e.target.value) setLocalId(""); // Limpa Condomínio se selecionou flat individual
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
