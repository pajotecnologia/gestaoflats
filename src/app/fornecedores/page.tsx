"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import { formatCNPJ, formatCPF, formatPhone, formatCEP } from "@/lib/validation";
import { Truck, Plus, X, Edit3, Trash2, Building2, User, Phone, Mail, MapPin } from "lucide-react";
import { toast, ConfirmDialog, DataTable, ColumnDef } from "@/components/ui";

interface Fornecedor {
  id: string;
  razaoSocial: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cep?: string;
}

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nome: string } | null>(null);

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
      setLoading(true);
      const res = await fetch("/api/fornecedores");
      const data = await res.json();
      setFornecedores(data.fornecedores || []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar lista de fornecedores.");
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

  const handleOpenEditModal = (f: Fornecedor) => {
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

  const handleDeleteConfirm = async (id: string) => {
    try {
      const res = await fetch(`/api/fornecedores?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao excluir fornecedor.");
        return;
      }
      toast.success("Fornecedor excluído com sucesso!");
      loadData();
    } catch (err: any) {
      toast.error("Erro de conexão ao excluir fornecedor.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const isEditing = !!editingFornecedor;
      const method = isEditing ? "PUT" : "POST";
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
        toast.error(data.error || "Erro ao salvar fornecedor.");
        return;
      }

      toast.success(isEditing ? "Fornecedor atualizado com sucesso!" : "Fornecedor cadastrado com sucesso!");
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setErrorMessage("Erro inesperado ao salvar fornecedor.");
      toast.error("Erro inesperado ao salvar fornecedor.");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<Fornecedor>[] = [
    {
      key: "razaoSocial",
      header: "Razão Social / Nome",
      sortable: true,
      render: (f) => {
        const cleanDoc = (f.cnpj || "").replace(/\D/g, "");
        const isCpf = cleanDoc.length > 0 && cleanDoc.length <= 11;
        return (
          <div className="font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            {isCpf ? (
              <User className="w-4 h-4 text-violet-500 shrink-0" />
            ) : (
              <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
            )}
            <span className="truncate max-w-[220px]">{f.razaoSocial}</span>
          </div>
        );
      },
    },
    {
      key: "cnpj",
      header: "Documento (CPF / CNPJ)",
      sortable: true,
      render: (f) => {
        const cleanDoc = (f.cnpj || "").replace(/\D/g, "");
        const isCpf = cleanDoc.length > 0 && cleanDoc.length <= 11;
        return (
          <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-zinc-300 text-xs">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                isCpf
                  ? "bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/60"
                  : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60"
              }`}
            >
              {isCpf ? "CPF" : "CNPJ"}
            </span>
            <span>{f.cnpj || "-"}</span>
          </div>
        );
      },
    },
    {
      key: "telefone",
      header: "Contato",
      sortable: true,
      render: (f) => {
        const rawPhone = (f.telefone || "").replace(/\D/g, "");
        return (
          <div className="space-y-0.5 text-xs">
            {f.telefone ? (
              <a
                href={rawPhone ? `https://wa.me/55${rawPhone}` : "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-semibold transition"
              >
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>{f.telefone}</span>
              </a>
            ) : (
              <span className="text-slate-400 dark:text-zinc-500">-</span>
            )}
            {f.email && (
              <p className="text-slate-500 dark:text-zinc-400 text-[11px] flex items-center gap-1 truncate max-w-[200px]">
                <Mail className="w-3 h-3 shrink-0" />
                <span>{f.email}</span>
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "endereco",
      header: "Endereço",
      sortable: true,
      render: (f) => (
        <div className="text-slate-500 dark:text-zinc-400 text-xs truncate max-w-[240px]">
          {f.endereco || f.cep ? (
            <div className="flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400 dark:text-zinc-500" />
              <span className="truncate">
                {f.endereco}
                {f.cep ? ` - CEP: ${f.cep}` : ""}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 dark:text-zinc-600">Não informado</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <Shell>
      <div className="space-y-6 pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-zinc-800/80 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 shadow-xs">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                Gestão de Fornecedores
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Cadastro e edição de prestadores de serviço e fornecedores (Pessoa Física ou Jurídica)
              </p>
            </div>
          </div>
        </div>

        {/* DataTable com Suporte Total Responsivo (Desktop Tabela + Mobile Cards) */}
        <DataTable<Fornecedor>
          data={fornecedores}
          columns={columns}
          loading={loading}
          searchPlaceholder="Buscar por razão social, nome, CPF/CNPJ, telefone ou cidade..."
          searchableKeys={["razaoSocial", "cnpj", "telefone", "email", "endereco", "cep"]}
          onAddNew={handleOpenNewModal}
          addNewText="Cadastrar Fornecedor"
          emptyMessage="Nenhum fornecedor cadastrado até o momento."
          emptySearchMessage="Nenhum fornecedor corresponde aos filtros aplicados."
          initialSortKey="razaoSocial"
          initialSortDir="asc"
          defaultPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          actions={(f) => (
            <div className="flex items-center justify-end space-x-1">
              <button
                onClick={() => handleOpenEditModal(f)}
                className="p-2 min-h-[38px] min-w-[38px] rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition flex items-center justify-center cursor-pointer"
                title="Editar Fornecedor"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteTarget({ id: f.id, nome: f.razaoSocial })}
                className="p-2 min-h-[38px] min-w-[38px] rounded-xl text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center justify-center cursor-pointer"
                title="Excluir Fornecedor"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          renderMobileCard={(f) => {
            const cleanDoc = (f.cnpj || "").replace(/\D/g, "");
            const isCpf = cleanDoc.length > 0 && cleanDoc.length <= 11;
            const rawPhone = (f.telefone || "").replace(/\D/g, "");

            return (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                      {isCpf ? (
                        <User className="w-4 h-4 text-violet-500 shrink-0" />
                      ) : (
                        <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                      )}
                      <span>{f.razaoSocial}</span>
                    </h4>
                    <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 mt-0.5 block">
                      {isCpf ? "CPF: " : "CNPJ: "} {f.cnpj || "Não informado"}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-zinc-400 space-y-1 pt-1 border-t border-slate-100 dark:border-zinc-800">
                  {f.telefone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <a
                        href={rawPhone ? `https://wa.me/55${rawPhone}` : "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 dark:text-emerald-400 font-semibold underline"
                      >
                        {f.telefone}
                      </a>
                    </div>
                  )}
                  {f.email && (
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{f.email}</span>
                    </div>
                  )}
                  {f.endereco && (
                    <div className="flex items-start gap-1.5 text-slate-500 dark:text-zinc-400">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="truncate">{f.endereco}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          }}
        />

        {/* Modal de Cadastro / Edição Responsivo */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-900 dark:text-zinc-100 max-h-[92vh] my-auto overflow-y-auto animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      {editingFornecedor ? "Editar Fornecedor" : "Cadastrar Fornecedor"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Preencha os dados do prestador de serviço
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 cursor-pointer transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 text-xs">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tipo de Documento: Pessoa Jurídica (CNPJ) vs Pessoa Física (CPF) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Tipo de Cadastro
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => handleSwitchTipoDocumento("CNPJ")}
                      className={`min-h-[40px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        tipoDocumento === "CNPJ"
                          ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-zinc-700"
                          : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Pessoa Jurídica (CNPJ)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchTipoDocumento("CPF")}
                      className={`min-h-[40px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        tipoDocumento === "CPF"
                          ? "bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 shadow-xs border border-slate-200/80 dark:border-zinc-700"
                          : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>Pessoa Física (CPF)</span>
                    </button>
                  </div>
                </div>

                {/* Razão Social / Nome */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    {tipoDocumento === "CPF" ? "Nome Completo / Prestador *" : "Razão Social / Nome Fantasia *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    placeholder={tipoDocumento === "CPF" ? "ex: Carlos Eduardo da Silva" : "ex: Manutenção Silva LTDA"}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                {/* CPF ou CNPJ */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
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
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                {/* Telefone e E-mail */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(formatPhone(e.target.value))}
                      placeholder="(81) 98765-4321"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contato@fornecedor.com"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                </div>

                {/* Endereço e CEP */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Endereço Completo</label>
                    <input
                      type="text"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      placeholder="Rua, Número, Bairro, Cidade"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">CEP</label>
                    <input
                      type="text"
                      value={cep}
                      onChange={(e) => setCep(formatCEP(e.target.value))}
                      placeholder="00000-000"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-1/3 min-h-[44px] rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 font-bold text-slate-700 dark:text-zinc-300 text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-2/3 min-h-[44px] rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-bold text-white text-xs shadow-lg shadow-indigo-500/20 transition disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Salvando..." : editingFornecedor ? "Atualizar Fornecedor" : "Salvar Fornecedor"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          title="Excluir Fornecedor"
          description={`Tem certeza que deseja excluir o fornecedor "${deleteTarget?.nome}"? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={() => {
            if (deleteTarget) handleDeleteConfirm(deleteTarget.id);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      </div>
    </Shell>
  );
}
