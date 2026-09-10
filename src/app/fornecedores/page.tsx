"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import { formatCNPJ, formatCPF, formatPhone, formatCEP } from "@/lib/validation";
import { Truck, Plus, X, Edit3, Trash2, Building2, User, Search, Phone, Mail, MapPin } from "lucide-react";

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [tipoDocumento, setTipoDocumento] = useState<"CNPJ" | "CPF">("CNPJ");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cep, setCep] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = async () => {
    try {
      const res = await fetch("/api/fornecedores");
      const data = await res.json();
      setFornecedores(data.fornecedores || []);
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
    setEditingFornecedor(null);
    setTipoDocumento("CNPJ");
    setRazaoSocial("");
    setCnpj("");
    setEndereco("");
    setCep("");
    setTelefone("");
    setEmail("");
    setErrorMessage("");
    setShowModal(true);
  };

  const handleOpenEditModal = (f: any) => {
    setEditingFornecedor(f);
    const cleanDoc = (f.cnpj || "").replace(/\D/g, "");
    const isCpf = cleanDoc.length > 0 && cleanDoc.length <= 11;
    
    setTipoDocumento(isCpf ? "CPF" : "CNPJ");
    setRazaoSocial(f.razaoSocial || "");
    setCnpj(isCpf ? formatCPF(cleanDoc) : formatCNPJ(cleanDoc));
    setEndereco(f.endereco || "");
    setCep(f.cep ? formatCEP(f.cep) : "");
    setTelefone(formatPhone(f.telefone || ""));
    setEmail(f.email || "");
    setErrorMessage("");
    setShowModal(true);
  };

  const handleSwitchTipoDocumento = (novoTipo: "CNPJ" | "CPF") => {
    if (novoTipo === tipoDocumento) return;
    setTipoDocumento(novoTipo);
    const digits = cnpj.replace(/\D/g, "");
    if (novoTipo === "CPF") {
      setCnpj(formatCPF(digits));
    } else {
      setCnpj(formatCNPJ(digits));
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o fornecedor "${nome}"?`)) return;

    try {
      const res = await fetch(`/api/fornecedores?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao excluir fornecedor.");
        return;
      }
      loadData();
    } catch (err: any) {
      alert("Erro de conexão ao excluir fornecedor.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const method = editingFornecedor ? "PUT" : "POST";
      const res = await fetch("/api/fornecedores", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingFornecedor?.id,
          razaoSocial,
          cnpj,
          endereco,
          cep,
          telefone,
          email,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Erro ao salvar fornecedor.");
        return;
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      setErrorMessage("Erro inesperado ao salvar fornecedor.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFornecedores = fornecedores.filter((f) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nome = (f.razaoSocial || "").toLowerCase();
    const doc = (f.cnpj || "").replace(/\D/g, "");
    const termClean = term.replace(/\D/g, "");

    return nome.includes(term) || (termClean && doc.includes(termClean)) || (f.cnpj || "").toLowerCase().includes(term);
  });

  return (
    <Shell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Gestão de Fornecedores</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cadastro e edição de prestadores de serviço e fornecedores (Pessoa Física ou Jurídica)
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenNewModal}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs shadow-md flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Fornecedor</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por razão social, nome ou CPF/CNPJ..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total: <span className="font-semibold text-slate-900 dark:text-slate-200">{filteredFornecedores.length}</span> fornecedor(es)
          </div>
        </div>

        {/* Table Listing */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Razão Social / Nome</th>
                  <th className="py-3.5 px-4">Documento (CPF / CNPJ)</th>
                  <th className="py-3.5 px-4">Contato</th>
                  <th className="py-3.5 px-4">Endereço</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Carregando fornecedores...
                    </td>
                  </tr>
                ) : filteredFornecedores.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      {searchTerm ? "Nenhum fornecedor encontrado com os termos da busca." : "Nenhum fornecedor cadastrado."}
                    </td>
                  </tr>
                ) : (
                  filteredFornecedores.map((f) => {
                    const cleanDoc = (f.cnpj || "").replace(/\D/g, "");
                    const isCpf = cleanDoc.length > 0 && cleanDoc.length <= 11;

                    return (
                      <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                            {isCpf ? (
                              <User className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            ) : (
                              <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            )}
                            <span>{f.razaoSocial}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                isCpf
                                  ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                  : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                              }`}
                            >
                              {isCpf ? "CPF" : "CNPJ"}
                            </span>
                            <span>{f.cnpj || "-"}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {f.telefone || f.email ? (
                            <div className="space-y-0.5 text-[11px]">
                              {f.telefone && (
                                <p className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                  <Phone className="w-3 h-3 shrink-0" />
                                  <span>{f.telefone}</span>
                                </p>
                              )}
                              {f.email && (
                                <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <Mail className="w-3 h-3 shrink-0" />
                                  <span>{f.email}</span>
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                          {f.endereco || f.cep ? (
                            <div className="flex items-start gap-1">
                              <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-slate-400" />
                              <span>
                                {f.endereco}
                                {f.cep ? ` - CEP: ${f.cep}` : ""}
                              </span>
                            </div>
                          ) : (
                            "Não informado"
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(f)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="Editar Fornecedor"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(f.id, f.razaoSocial)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                              title="Excluir Fornecedor"
                            >
                              <Trash2 className="w-4 h-4" />
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

        {/* Modal de Cadastro / Edição */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100 max-h-[92vh] my-auto overflow-y-auto animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <Truck className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {editingFornecedor ? "Editar Fornecedor" : "Cadastrar Fornecedor"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tipo de Documento: Pessoa Jurídica (CNPJ) vs Pessoa Física (CPF) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tipo de Cadastro
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <button
                      type="button"
                      onClick={() => handleSwitchTipoDocumento("CNPJ")}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition cursor-pointer ${
                        tipoDocumento === "CNPJ"
                          ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-semibold border border-slate-200/80 dark:border-slate-700"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Pessoa Jurídica (CNPJ)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchTipoDocumento("CPF")}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition cursor-pointer ${
                        tipoDocumento === "CPF"
                          ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm font-semibold border border-slate-200/80 dark:border-slate-700"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Pessoa Física (CPF)</span>
                    </button>
                  </div>
                </div>

                {/* Razão Social / Nome */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {tipoDocumento === "CPF" ? "Nome Completo / Prestador *" : "Razão Social / Nome Fantasia *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    placeholder={tipoDocumento === "CPF" ? "ex: Carlos Eduardo da Silva" : "ex: Manutenção Silva LTDA"}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* CPF ou CNPJ */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {tipoDocumento === "CPF" ? "CPF *" : "CNPJ *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={cnpj}
                    onChange={(e) => {
                      if (tipoDocumento === "CPF") {
                        setCnpj(formatCPF(e.target.value));
                      } else {
                        setCnpj(formatCNPJ(e.target.value));
                      }
                    }}
                    placeholder={tipoDocumento === "CPF" ? "000.000.000-00" : "00.000.000/0001-00"}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Telefone e E-mail */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(formatPhone(e.target.value))}
                      placeholder="(81) 98765-4321"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contato@fornecedor.com"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Endereço e CEP */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Endereço Completo</label>
                    <input
                      type="text"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      placeholder="Rua, Número, Bairro, Cidade"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">CEP</label>
                    <input
                      type="text"
                      value={cep}
                      onChange={(e) => setCep(formatCEP(e.target.value))}
                      placeholder="00000-000"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-1/3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Salvando..." : editingFornecedor ? "Atualizar Fornecedor" : "Salvar Fornecedor"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
