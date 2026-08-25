"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import { validateCPF, formatCPF, formatPhone } from "@/lib/validation";
import { Users, Plus, X, Phone, Edit3 } from "lucide-react";

export default function LocatariosPage() {
  const [locatarios, setLocatarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocatario, setEditingLocatario] = useState<any>(null);

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
    try {
      const res = await fetch("/api/locatarios");
      const data = await res.json();
      setLocatarios(data.locatarios || []);
    } catch (err) {
      console.error(err);
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

  const handleOpenEditModal = (loc: any) => {
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
        setSubmitting(false);
        return;
      }

      setShowModal(false);
      loadLocatarios();
    } catch (err) {
      setErrorMsg("Erro de rede ao salvar locatário.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Gestão de Locatários</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cadastro e edição completa de inquilinos com validação estrita de CPF
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenNewModal}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs shadow-md flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Locatário</span>
          </button>
        </div>

        {/* Tabela de Locatários com suporte a Edição */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Nome do Locatário</th>
                  <th className="py-3.5 px-4">CPF / RG</th>
                  <th className="py-3.5 px-4">Contato (WhatsApp)</th>
                  <th className="py-3.5 px-4">Flat Ativo</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Carregando locatários...
                    </td>
                  </tr>
                ) : locatarios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Nenhum locatário cadastrado.
                    </td>
                  </tr>
                ) : (
                  locatarios.map((loc) => (
                    <tr key={loc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-200">
                        {loc.nome}
                        <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400">{loc.email || "Sem e-mail"}</span>
                        <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                          {loc.nacionalidade || "Brasileiro(a)"} • {loc.estadoCivil || "Solteiro(a)"}{loc.profissao ? ` • ${loc.profissao}` : ""}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono">
                        {loc.cpf}
                        {loc.rg && <span className="block text-[11px] text-slate-500">RG: {loc.rg}</span>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{loc.telefone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {loc.contratos && loc.contratos.length > 0 ? (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 font-semibold text-[11px]">
                            {loc.contratos[0].flat?.numero || "Flat Ativo"}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Sem contrato</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenEditModal(loc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Editar Locatário"
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

        {/* Modal Novo / Editar Locatário */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {editingLocatario ? "Editar Dados do Locatário" : "Cadastro de Novo Locatário"}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="ex: Dra. Mariana Silva Ribeiro"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>CPF</span>
                      {cpfValid === true && <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">✓ Válido</span>}
                      {cpfValid === false && <span className="text-red-600 dark:text-red-400 text-[10px]">✕ Inválido</span>}
                    </label>
                    <input
                      type="text"
                      required
                      value={cpf}
                      onChange={(e) => handleCpfChange(e.target.value)}
                      placeholder="000.000.000-00"
                      className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 ${
                        cpfValid === true
                          ? "border-emerald-500 focus:ring-emerald-500"
                          : cpfValid === false
                          ? "border-red-500 focus:ring-red-500"
                          : "border-slate-300 dark:border-slate-800"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">RG</label>
                    <input
                      type="text"
                      value={rg}
                      onChange={(e) => setRg(e.target.value)}
                      placeholder="0.000.000 SDS/PE"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      required
                      value={telefone}
                      onChange={(e) => setTelefone(formatPhone(e.target.value))}
                      placeholder="(81) 98765-4321"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="locatario@email.com"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Estado Civil
                    </label>
                    <select
                      value={estadoCivil}
                      onChange={(e) => setEstadoCivil(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                      <option value="União Estável">União Estável</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Profissão
                    </label>
                    <input
                      type="text"
                      value={profissao}
                      onChange={(e) => setProfissao(e.target.value)}
                      placeholder="ex: Advogado(a)"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Nacionalidade
                    </label>
                    <input
                      type="text"
                      value={nacionalidade}
                      onChange={(e) => setNacionalidade(e.target.value)}
                      placeholder="ex: Brasileiro(a)"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || cpfValid === false}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs transition disabled:opacity-50"
                >
                  {submitting ? "Salvação..." : editingLocatario ? "Atualizar Locatário" : "Cadastrar Locatário"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
