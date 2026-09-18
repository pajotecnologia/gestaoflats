"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import { validateCPF, formatCPF, formatPhone } from "@/lib/validation";
import { toast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import {
  Users,
  Plus,
  X,
  Phone,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";

interface LocatarioData {
  id: string;
  nome: string;
  cpf: string;
  rg?: string | null;
  dataNascimento?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  estadoCivil?: string | null;
  profissao?: string | null;
  nacionalidade?: string | null;
  statusContrato?: string;
  flatNumero?: string;
  contratos?: any[];
}

export default function LocatariosPage() {
  const [locatarios, setLocatarios] = useState<LocatarioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocatario, setEditingLocatario] = useState<LocatarioData | null>(null);

  // Dialog de Confirmação de Exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [locatarioToDelete, setLocatarioToDelete] = useState<LocatarioData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("Solteiro(a)");
  const [profissao, setProfissao] = useState("");
  const [nacionalidade, setNacionalidade] = useState("Brasileiro(a)");

  const [cpfValid, setCpfValid] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadLocatarios = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/locatarios");
      const data = await res.json();
      const list = (data.locatarios || []).map((loc: any) => {
        const hasContrato = loc.contratos && loc.contratos.length > 0;
        return {
          ...loc,
          statusContrato: hasContrato ? "ATIVO" : "INATIVO",
          flatNumero: hasContrato ? loc.contratos[0].flat?.numero || "Flat Ativo" : undefined,
        };
      });
      setLocatarios(list);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar lista de locatários.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocatarios();
  }, []);

  const handleOpenNewModal = () => {
    setEditingLocatario(null);
    setNome("");
    setCpf("");
    setRg("");
    setDataNascimento("");
    setEmail("");
    setTelefone("");
    setEndereco("");
    setEstadoCivil("Solteiro(a)");
    setProfissao("");
    setNacionalidade("Brasileiro(a)");
    setCpfValid(null);
    setErrorMsg("");
    setShowModal(true);
  };

  const handleOpenEditModal = (loc: LocatarioData) => {
    setEditingLocatario(loc);
    setNome(loc.nome || "");
    setCpf(loc.cpf || "");
    setRg(loc.rg || "");
    setDataNascimento(loc.dataNascimento ? new Date(loc.dataNascimento).toISOString().split("T")[0] : "");
    setEmail(loc.email || "");
    setTelefone(formatPhone(loc.telefone || ""));
    setEndereco(loc.endereco || "");
    setEstadoCivil(loc.estadoCivil || "Solteiro(a)");
    setProfissao(loc.profissao || "");
    setNacionalidade(loc.nacionalidade || "Brasileiro(a)");
    setCpfValid(validateCPF(loc.cpf || ""));
    setErrorMsg("");
    setShowModal(true);
  };

  const handleCpfChange = (val: string) => {
    const formatted = formatCPF(val);
    setCpf(formatted);
    if (val.replace(/\D/g, "").length === 11) {
      setCpfValid(validateCPF(val));
    } else {
      setCpfValid(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!validateCPF(cpf)) {
      setErrorMsg("O CPF digitado é matematicamente inválido!");
      toast.error("CPF inválido!");
      return;
    }

    setSubmitting(true);

    try {
      const method = editingLocatario ? "PUT" : "POST";
      const res = await fetch("/api/locatarios", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingLocatario?.id,
          nome,
          cpf,
          rg,
          dataNascimento,
          email,
          telefone,
          endereco,
          estadoCivil,
          profissao,
          nacionalidade,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao salvar locatário.");
        toast.error(data.error || "Erro ao salvar locatário.");
        setSubmitting(false);
        return;
      }

      toast.success(editingLocatario ? "Locatário atualizado com sucesso!" : "Locatário cadastrado com sucesso!");
      setShowModal(false);
      loadLocatarios();
    } catch (err) {
      setErrorMsg("Erro de rede ao salvar locatário.");
      toast.error("Erro de conexão ao salvar locatário.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (loc: LocatarioData) => {
    setLocatarioToDelete(loc);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!locatarioToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/locatarios?id=${locatarioToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao excluir locatário.");
        setDeleting(false);
        return;
      }
      toast.success("Locatário excluído com sucesso!");
      setDeleteConfirmOpen(false);
      setLocatarioToDelete(null);
      loadLocatarios();
    } catch (err) {
      toast.error("Erro de rede ao excluir locatário.");
    } finally {
      setDeleting(false);
    }
  };

  // Definição das Colunas da Tabela Avançada
  const columns: ColumnDef<LocatarioData>[] = [
    {
      key: "nome",
      header: "Locatário / Perfil",
      sortable: true,
      render: (loc) => (
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center font-black text-xs shrink-0">
            {loc.nome.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-slate-900 dark:text-zinc-100 block truncate">
              {loc.nome}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 block truncate">
              {loc.email || "Sem e-mail cadastrado"}
            </span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block truncate mt-0.5">
              {loc.nacionalidade || "Brasileiro(a)"} • {loc.estadoCivil || "Solteiro(a)"}
              {loc.profissao ? ` • ${loc.profissao}` : ""}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "cpf",
      header: "CPF / RG",
      sortable: true,
      className: "font-mono",
      render: (loc) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-zinc-200 block">{loc.cpf}</span>
          {loc.rg ? (
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 block font-sans">
              RG: {loc.rg}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 block font-sans">
              RG não informado
            </span>
          )}
        </div>
      ),
    },
    {
      key: "telefone",
      header: "Contato (WhatsApp)",
      sortable: true,
      render: (loc) => {
        const rawPhone = (loc.telefone || "").replace(/\D/g, "");
        return (
          <div>
            {loc.telefone ? (
              <a
                href={rawPhone ? `https://wa.me/55${rawPhone}` : "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-semibold transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{loc.telefone}</span>
              </a>
            ) : (
              <span className="text-slate-400 dark:text-zinc-500 text-[11px]">Sem telefone</span>
            )}
            {loc.endereco && (
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 block truncate max-w-[200px] mt-0.5">
                {loc.endereco}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "statusContrato",
      header: "Status / Unidade",
      sortable: true,
      render: (loc) => (
        <div>
          {loc.statusContrato === "ATIVO" ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-bold text-[11px]">
              <Building2 className="w-3 h-3" />
              <span>{loc.flatNumero ? `Flat ${loc.flatNumero}` : "Contrato Ativo"}</span>
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
              Sem Contrato Ativo
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <Shell>
      <div className="space-y-6 pb-12">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-zinc-800/80 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                Gestão de Locatários
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Cadastro de inquilinos com validação matemática de CPF, consulta rápida e filtros avançados.
              </p>
            </div>
          </div>
        </div>

        {/* Tabela de Dados Avançada */}
        <DataTable<LocatarioData>
          data={locatarios}
          columns={columns}
          loading={loading}
          searchPlaceholder="Buscar por nome, CPF, e-mail, telefone..."
          searchableKeys={["nome", "cpf", "rg", "email", "telefone", "profissao", "flatNumero"]}
          statusKey="statusContrato"
          statusFilterOptions={[
            { label: "Com Contrato Ativo", value: "ATIVO" },
            { label: "Sem Contrato Ativo", value: "INATIVO" },
          ]}
          onAddNew={handleOpenNewModal}
          addNewText="Cadastrar Locatário"
          emptyMessage="Nenhum locatário cadastrado até o momento."
          emptySearchMessage="Nenhum locatário corresponde aos termos de busca e filtros aplicados."
          initialSortKey="nome"
          initialSortDir="asc"
          defaultPageSize={10}
          pageSizeOptions={[10, 25, 50]}
          actions={(loc) => (
            <div className="flex items-center justify-end space-x-1">
              <button
                onClick={() => handleOpenEditModal(loc)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                title="Editar Locatário"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleOpenDelete(loc)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                title="Excluir Locatário"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          renderMobileCard={(loc) => (
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100">{loc.nome}</h4>
                  <p className="text-xs font-mono text-slate-600 dark:text-zinc-400 mt-0.5">CPF: {loc.cpf}</p>
                </div>
                {loc.statusContrato === "ATIVO" ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {loc.flatNumero ? `Flat ${loc.flatNumero}` : "Ativo"}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                    Sem Contrato
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 dark:text-zinc-400 space-y-1">
                {loc.email && <p className="truncate">✉️ {loc.email}</p>}
                {loc.telefone && (
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                    <Phone className="w-3 h-3 inline" />
                    <span>{loc.telefone}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        />

        {/* Modal de Criação / Edição de Locatário */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Header Modal */}
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-zinc-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    {editingLocatario ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base">
                      {editingLocatario ? "Editar Dados do Locatário" : "Cadastrar Novo Locatário"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Preencha os dados do inquilino para contratos e vistorias.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Modal */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Nome Completo */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Carlos Eduardo de Almeida"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                    />
                  </div>

                  {/* CPF */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        CPF (Validação Estrita) *
                      </label>
                      {cpfValid === true && (
                        <span className="text-[10px] text-emerald-500 font-bold flex items-center space-x-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>CPF Válido</span>
                        </span>
                      )}
                      {cpfValid === false && (
                        <span className="text-[10px] text-rose-500 font-bold flex items-center space-x-0.5">
                          <AlertCircle className="w-3 h-3" />
                          <span>CPF Inválido</span>
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={14}
                      value={cpf}
                      onChange={(e) => handleCpfChange(e.target.value)}
                      placeholder="000.000.000-00"
                      className={`w-full px-3 py-2 text-xs rounded-xl font-mono bg-slate-50 dark:bg-zinc-950 border text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 transition ${
                        cpfValid === true
                          ? "border-emerald-500 focus:ring-emerald-500/40"
                          : cpfValid === false
                          ? "border-rose-500 focus:ring-rose-500/40"
                          : "border-slate-200 dark:border-zinc-800 focus:ring-blue-500/40"
                      }`}
                    />
                  </div>

                  {/* RG */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      RG
                    </label>
                    <input
                      type="text"
                      value={rg}
                      onChange={(e) => setRg(e.target.value)}
                      placeholder="Ex: 12.345.678-9 SSP/SP"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      WhatsApp / Telefone *
                    </label>
                    <input
                      type="text"
                      required
                      value={telefone}
                      onChange={(e) => setTelefone(formatPhone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  {/* E-mail */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="locatario@email.com"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  {/* Profissão */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Profissão
                    </label>
                    <input
                      type="text"
                      value={profissao}
                      onChange={(e) => setProfissao(e.target.value)}
                      placeholder="Ex: Engenheiro(a)"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  {/* Estado Civil */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Estado Civil
                    </label>
                    <select
                      value={estadoCivil}
                      onChange={(e) => setEstadoCivil(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                      <option value="União Estável">União Estável</option>
                    </select>
                  </div>

                  {/* Endereço Completo */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Endereço Residencial Completo
                    </label>
                    <input
                      type="text"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                {/* Footer Modal */}
                <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition"
                  >
                    {submitting ? "Salvando..." : editingLocatario ? "Atualizar Locatário" : "Salvar Cadastro"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        <ConfirmDialog
          isOpen={deleteConfirmOpen}
          title="Excluir Locatário"
          description={`Tem certeza que deseja excluir o locatário "${locatarioToDelete?.nome}"? Esta ação removerá o registro permanentemente se não houver contratos ativos.`}
          confirmText="Sim, Excluir"
          cancelText="Cancelar"
          variant="danger"
          isLoading={deleting}
          onConfirm={handleConfirmDelete}
          onClose={() => {
            setDeleteConfirmOpen(false);
            setLocatarioToDelete(null);
          }}
        />
      </div>
    </Shell>
  );
}
