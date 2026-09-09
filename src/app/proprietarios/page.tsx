"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import { formatPhone, formatCNPJ, formatCPF } from "@/lib/validation";
import {
  Users,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  QrCode,
  DollarSign,
  Percent,
  MapPin,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

interface Proprietario {
  id: string;
  nome: string;
  cpfCnpj: string;
  rgIe?: string | null;
  email?: string | null;
  telefone: string;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  chavePix?: string | null;
  tipoChavePix?: string | null;
  banco?: string | null;
  agencia?: string | null;
  conta?: string | null;
  taxaAdministracaoPadrao?: number | null;
  observacoes?: string | null;
  status: string;
  flats?: any[];
  _count?: {
    flats: number;
    repasses: number;
  };
}

export default function ProprietariosPage() {
  const [proprietarios, setProprietarios] = useState<Proprietario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProprietario, setEditingProprietario] = useState<Proprietario | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [nome, setNome] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [rgIe, setRgIe] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [tipoChavePix, setTipoChavePix] = useState("CPF");
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");
  const [taxaAdmin, setTaxaAdmin] = useState("10");
  const [observacoes, setObservacoes] = useState("");

  const loadProprietarios = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proprietarios");
      const data = await res.json();
      if (res.ok) {
        setProprietarios(data.proprietarios || []);
      }
    } catch (err) {
      console.error("Erro ao carregar proprietários:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProprietarios();
  }, []);

  const handleOpenNew = () => {
    setEditingProprietario(null);
    setNome("");
    setCpfCnpj("");
    setRgIe("");
    setEmail("");
    setTelefone("");
    setEndereco("");
    setBairro("");
    setCidade("");
    setEstado("");
    setCep("");
    setChavePix("");
    setTipoChavePix("CPF");
    setBanco("");
    setAgencia("");
    setConta("");
    setTaxaAdmin("10");
    setObservacoes("");
    setShowModal(true);
  };

  const handleOpenEdit = (p: Proprietario) => {
    setEditingProprietario(p);
    setNome(p.nome);
    setCpfCnpj(p.cpfCnpj);
    setRgIe(p.rgIe || "");
    setEmail(p.email || "");
    setTelefone(p.telefone);
    setEndereco(p.endereco || "");
    setBairro(p.bairro || "");
    setCidade(p.cidade || "");
    setEstado(p.estado || "");
    setCep(p.cep || "");
    setChavePix(p.chavePix || "");
    setTipoChavePix(p.tipoChavePix || "CPF");
    setBanco(p.banco || "");
    setAgencia(p.agencia || "");
    setConta(p.conta || "");
    setTaxaAdmin(String(p.taxaAdministracaoPadrao ?? 10));
    setObservacoes(p.observacoes || "");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const method = editingProprietario ? "PUT" : "POST";
      const body = {
        id: editingProprietario?.id,
        nome,
        cpfCnpj,
        rgIe,
        email,
        telefone,
        endereco,
        bairro,
        cidade,
        estado,
        cep,
        chavePix,
        tipoChavePix,
        banco,
        agencia,
        conta,
        taxaAdministracaoPadrao: parseFloat(taxaAdmin) || 10,
        observacoes,
      };

      const res = await fetch("/api/proprietarios", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao salvar proprietário.");
        return;
      }

      setShowModal(false);
      loadProprietarios();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, nomeProp: string) => {
    if (!confirm(`Tem certeza que deseja remover o proprietário "${nomeProp}"?`)) return;

    try {
      const res = await fetch(`/api/proprietarios?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        loadProprietarios();
      } else {
        const d = await res.json();
        alert(d.error || "Erro ao excluir.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = proprietarios.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.nome.toLowerCase().includes(q) ||
      p.cpfCnpj.includes(q) ||
      p.telefone.includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.cidade?.toLowerCase().includes(q)
    );
  });

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Gestão de Proprietários (Locadores)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cadastro de proprietários terceiros, chave PIX, dados bancários e taxa de administração
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/financeiro/repasses"
              className="py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition"
            >
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>Extrato de Repasses</span>
            </Link>

            <button
              onClick={handleOpenNew}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-xs shadow-md flex items-center space-x-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Proprietário</span>
            </button>
          </div>
        </div>

        {/* Barra de Busca e Filtro */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF/CNPJ, WhatsApp ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-xs"
            />
          </div>

          <span className="text-xs text-slate-500 font-semibold">
            {filtered.length} proprietário(s) cadastrado(s)
          </span>
        </div>

        {/* Lista de Proprietários */}
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500">Carregando proprietários...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Nenhum proprietário encontrado</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Cadastre os locadores e proprietários dos imóveis para calcular automaticamente repasses e taxas de administração.
            </p>
            <button
              onClick={handleOpenNew}
              className="mt-2 py-2 px-4 rounded-xl bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Proprietário</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((prop) => {
              const telLimpo = prop.telefone.replace(/\D/g, "");

              return (
                <div
                  key={prop.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:border-emerald-500/40 transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                          {prop.nome}
                        </h2>
                        <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                          {prop.cpfCnpj}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        {prop.taxaAdministracaoPadrao ?? 10}% Taxa Admin
                      </span>
                    </div>

                    {/* Contatos */}
                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{prop.telefone}</span>
                        {telLimpo && (
                          <a
                            href={`https://wa.me/55${telLimpo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-500 text-[10px] font-bold underline ml-1"
                          >
                            WhatsApp
                          </a>
                        )}
                      </div>

                      {prop.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{prop.email}</span>
                        </div>
                      )}

                      {prop.cidade && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{prop.cidade}{prop.estado ? `/${prop.estado}` : ""}</span>
                        </div>
                      )}
                    </div>

                    {/* Dados PIX */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/80 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Chave PIX para Repasse:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                          {prop.chavePix || "Não cadastrada"}
                        </span>
                      </div>
                      {prop.banco && (
                        <div className="text-[10px] text-slate-400">
                          Banco: {prop.banco} • Ag: {prop.agencia || "-"} • CC: {prop.conta || "-"}
                        </div>
                      )}
                    </div>

                    {/* Portfólio de Imóveis */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{prop._count?.flats || 0} Imóvel(is) vinculado(s)</span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
                    <Link
                      href={`/financeiro/repasses?proprietarioId=${prop.id}`}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <span>Ver Repasses</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(prop)}
                        className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(prop.id, prop.nome)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Criação / Edição de Proprietário */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-500" />
                  <span>{editingProprietario ? "Editar Proprietário" : "Cadastrar Novo Proprietário"}</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Preencha os dados cadastrais, dados bancários para repasse e taxa de administração
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* 1. DADOS PESSOAIS */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-1">
                    1. Dados do Locador / Titular
                  </h3>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Nome Completo / Razão Social *
                    </label>
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Roberto Carlos Mendonça"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        CPF ou CNPJ *
                      </label>
                      <input
                        type="text"
                        required
                        value={cpfCnpj}
                        onChange={(e) =>
                          setCpfCnpj(
                            e.target.value.length > 14
                              ? formatCNPJ(e.target.value)
                              : formatCPF(e.target.value)
                          )
                        }
                        placeholder="000.000.000-00"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        RG / Inscrição Estadual
                      </label>
                      <input
                        type="text"
                        value={rgIe}
                        onChange={(e) => setRgIe(e.target.value)}
                        placeholder="Opcional"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        WhatsApp / Celular *
                      </label>
                      <input
                        type="text"
                        required
                        value={telefone}
                        onChange={(e) => setTelefone(formatPhone(e.target.value))}
                        placeholder="(87) 99999-9999"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="proprietario@email.com"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* 2. DADOS DE REPASSE / PIX / TAXA */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-1">
                    2. Condições Comerciais & Dados de Repasse
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        Taxa de Administração (%) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          required
                          value={taxaAdmin}
                          onChange={(e) => setTaxaAdmin(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
                        />
                        <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        Tipo da Chave PIX
                      </label>
                      <select
                        value={tipoChavePix}
                        onChange={(e) => setTipoChavePix(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                      >
                        <option value="CPF">CPF</option>
                        <option value="CNPJ">CNPJ</option>
                        <option value="EMAIL">E-mail</option>
                        <option value="TELEFONE">Telefone</option>
                        <option value="CHAVE_ALEATORIA">Chave Aleatória</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        Chave PIX
                      </label>
                      <input
                        type="text"
                        value={chavePix}
                        onChange={(e) => setChavePix(e.target.value)}
                        placeholder="Chave para transferências"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Banco</label>
                      <input
                        type="text"
                        value={banco}
                        onChange={(e) => setBanco(e.target.value)}
                        placeholder="Ex: Itaú, Bradesco, Inter"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Agência</label>
                      <input
                        type="text"
                        value={agencia}
                        onChange={(e) => setAgencia(e.target.value)}
                        placeholder="0000"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Conta com Dígito</label>
                      <input
                        type="text"
                        value={conta}
                        onChange={(e) => setConta(e.target.value)}
                        placeholder="00000-0"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. ENDEREÇO & NOTAS */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-1">
                    3. Endereço & Observações
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Endereço</label>
                      <input
                        type="text"
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        placeholder="Rua, número, complemento"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Cidade / UF</label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={cidade}
                          onChange={(e) => setCidade(e.target.value)}
                          placeholder="Cidade"
                          className="col-span-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                        <input
                          type="text"
                          maxLength={2}
                          value={estado}
                          onChange={(e) => setEstado(e.target.value.toUpperCase())}
                          placeholder="UF"
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 text-center uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Observações Gerais</label>
                    <textarea
                      rows={2}
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Informações adicionais do contrato com o proprietário..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                  >
                    {submitting ? "Salvando..." : editingProprietario ? "Salvar Alterações" : "Cadastrar Proprietário"}
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
