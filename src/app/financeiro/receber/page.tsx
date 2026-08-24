"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import { formatCurrency } from "@/lib/validation";
import { generateReciboPDF, getReciboPDFBase64 } from "@/lib/pdfGenerator";
import { TrendingUp, Plus, X, Filter, Edit3, Printer, Share2, FileText } from "lucide-react";

export default function ContasReceberPage() {
  const [contas, setContas] = useState<any[]>([]);
  const [locatarios, setLocatarios] = useState<any[]>([]);
  const [empresaData, setEmpresaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingConta, setEditingConta] = useState<any>(null);

  // Form State
  const [locatarioId, setLocatarioId] = useState("");
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("PENDENTE");
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [valorPago, setValorPago] = useState("");
  const [observacao, setObservacao] = useState("");

  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [resContas, resLocatarios, resEmpresa] = await Promise.all([
        fetch("/api/financeiro/receber").then((r) => r.json()),
        fetch("/api/locatarios").then((r) => r.json()),
        fetch("/api/empresa").then((r) => r.json()),
      ]);
      setContas(resContas.contas || []);
      setLocatarios(resLocatarios.locatarios || []);
      setEmpresaData(resEmpresa.empresa || null);
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
    const mesRef = c.mesReferencia || (c.dataVencimento ? new Date(c.dataVencimento).toLocaleDateString("pt-BR").slice(3) : "Avulso");

    generateReciboPDF({
      empresaNome: empresaData?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: empresaData?.cnpj || "00.000.000/0001-00",
      empresaEndereco: empresaData?.endereco || undefined,
      empresaTelefone: empresaData?.telefone || undefined,
      empresaEmail: empresaData?.email || undefined,
      empresaLogomarcaUrl: empresaData?.logomarcaUrl || undefined,
      locatarioNome: c.locatario?.nome || "Locatário",
      locatarioCpf: c.locatario?.cpf || "000.000.000-00",
      flatNumero,
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
    const mesRef = c.mesReferencia || (c.dataVencimento ? new Date(c.dataVencimento).toLocaleDateString("pt-BR").slice(3) : "Avulso");
    const numRecibo = c.id.slice(0, 8).toUpperCase();

    const pdfBase64 = await getReciboPDFBase64({
      empresaNome: empresaData?.nomeFantasia || "Prime Gestão Imobiliária",
      empresaCnpj: empresaData?.cnpj || "00.000.000/0001-00",
      empresaEndereco: empresaData?.endereco || undefined,
      empresaTelefone: empresaData?.telefone || undefined,
      empresaEmail: empresaData?.email || undefined,
      empresaLogomarcaUrl: empresaData?.logomarcaUrl || undefined,
      locatarioNome: c.locatario?.nome || "Locatário",
      locatarioCpf: c.locatario?.cpf || "000.000.000-00",
      flatNumero,
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
    setStatus(conta.status || "PENDENTE");
    setFormaPagamento(conta.formaPagamento || "PIX");
    setValorPago(conta.valorPago ? conta.valorPago.toString() : (conta.valor ? conta.valor.toString() : ""));
    setObservacao(conta.observacao || "");
    setShowModal(true);
  };

  const handleSaveConta = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const method = editingConta ? "PUT" : "POST";
      await fetch("/api/financeiro/receber", {
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
          observacao,
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

  const contasFiltradas = contas.filter((c) => {
    if (filterStatus === "TODOS") return true;
    return c.status === filterStatus;
  });

  return (
    <Shell>
      <div className="space-y-6">
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

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs shadow-sm">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none font-semibold"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="PAGO">Pagos</option>
                <option value="ATRASADO">Atrasados</option>
              </select>
            </div>

            <button
              onClick={handleOpenNewModal}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-xs shadow-md flex items-center space-x-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Receita Avulsa</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Locatário / Referência</th>
                  <th className="py-3.5 px-4">Flat Vinculado</th>
                  <th className="py-3.5 px-4">Vencimento</th>
                  <th className="py-3.5 px-4">Valor (R$)</th>
                  <th className="py-3.5 px-4">Status</th>
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
                ) : contasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Nenhum lançamento encontrado.
                    </td>
                  </tr>
                ) : (
                  contasFiltradas.map((c) => {
                    const isPago = c.status === "PAGO";
                    const isAtrasado = c.status === "ATRASADO";

                    return (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-200">
                          {c.locatario?.nome || "Locatário"}
                          <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400">
                            {c.observacao || `Mês Ref: ${c.mesReferencia}`}
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
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-[10px] font-bold">
                              PAGO ({c.formaPagamento || "PIX"})
                            </span>
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
                          <div className="flex items-center justify-end space-x-1">
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
        </div>

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
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="PIX">PIX</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão">Cartão</option>
                      <option value="Boleto">Boleto</option>
                    </select>
                  </div>
                </div>

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
