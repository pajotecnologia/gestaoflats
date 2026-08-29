"use client";

import React, { useState } from "react";
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  Phone,
  CheckCircle2,
  Sparkles,
  FileText,
  MessageSquare,
  Cpu,
  Layers,
  Building,
} from "lucide-react";
import { SYSTEM_VERSION } from "@/lib/version";
import { formatPhone, formatCNPJ, formatCPF } from "@/lib/validation";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Estados do Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Estados do Registro (SaaS Onboarding)
  const [regNomeEmpresa, setRegNomeEmpresa] = useState("");
  const [regCnpj, setRegCnpj] = useState("");
  const [regTelefone, setRegTelefone] = useState("");
  const [regNomeAdmin, setRegNomeAdmin] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regSenha, setRegSenha] = useState("");
  const [regCidade, setRegCidade] = useState("");
  const [regEstado, setRegEstado] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginSenha }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || "Credenciais inválidas. Verifique seu e-mail e senha.");
        setLoginLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setLoginError("Erro de comunicação com o servidor. Tente novamente em instantes.");
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (!regNomeEmpresa || !regNomeAdmin || !regEmail || !regSenha) {
      setRegError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (regSenha.length < 6) {
      setRegError("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    setRegLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeEmpresa: regNomeEmpresa,
          cnpj: regCnpj,
          telefone: regTelefone,
          nomeAdmin: regNomeAdmin,
          email: regEmail,
          password: regSenha,
          cidade: regCidade,
          estado: regEstado,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRegError(data.error || "Erro ao criar empresa SaaS.");
        setRegLoading(false);
        return;
      }

      setRegSuccess("Conta e ambiente empresarial criados com sucesso! Entrando no sistema...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1200);
    } catch (err) {
      setRegError("Falha de conexão com o servidor. Tente novamente.");
      setRegLoading(false);
    }
  };

  const handleCnpjCpfChange = (val: string) => {
    const raw = val.replace(/\D/g, "");
    if (raw.length <= 11) {
      setRegCnpj(formatCPF(val));
    } else {
      setRegCnpj(formatCNPJ(val));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-hidden font-sans">
      {/* Background Decorativo Dinâmico com Efeitos de Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none translate-y-1/3" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Grid Pattern Sutil de Fundo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Conteúdo Principal Centralizado */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 py-8 max-w-5xl mx-auto w-full">
        {/* Topo do Header / Marca */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-cyan-500/20 border border-blue-500/30 backdrop-blur-md shadow-lg shadow-blue-500/10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="font-extrabold text-white text-base tracking-tight block leading-tight">
                Gestão de Flats
              </span>
              <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider block">
                Plataforma SaaS Imobiliária
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Ecossistema inteligente para administração de locações, contratos digitais, vistorias fotográficas e gestão financeira.
          </p>

          <div className="flex justify-center items-center space-x-2 pt-1">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-blue-300 text-[11px] font-extrabold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Versão Oficial: {SYSTEM_VERSION}</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[11px] font-bold">
              <Layers className="w-3 h-3" />
              <span>Multi-Tenant Isolado</span>
            </span>
          </div>
        </div>

        {/* Card Principal com Abas Modernas (Glassmorphism) */}
        <div className="w-full max-w-xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative">
          {/* Filete de luz no topo do card */}
          <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-75" />

          {/* Alternador de Abas */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/70 border border-slate-800 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setLoginError("");
                setRegError("");
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                activeTab === "login"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Acessar Conta</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setLoginError("");
                setRegError("");
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                activeTab === "register"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Criar Nova Empresa SaaS</span>
            </button>
          </div>

          {/* TAB 1: FORMULÁRIO DE LOGIN */}
          {activeTab === "login" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {loginError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    E-mail Corporativo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="admin@suaempresa.com.br"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      Senha de Acesso
                    </label>
                    <a
                      href="/recuperar-senha"
                      className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition"
                    >
                      Esqueceu a senha?
                    </a>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={loginSenha}
                      onChange={(e) => setLoginSenha(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-white text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50 mt-3 active:scale-[0.99]"
                >
                  <span>{loginLoading ? "Autenticando..." : "Entrar no Painel"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: FORMULÁRIO DE REGISTRO / AUTO-ONBOARDING */}
          {activeTab === "register" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="bg-blue-950/40 border border-blue-800/40 p-3 rounded-2xl text-[11px] text-blue-300">
                <span className="font-bold">✨ Ambiente Isolado Instantâneo:</span> Ao criar sua conta, sua empresa receberá um banco de dados totalmente independente, com formas de pagamento e modelo de contrato já configurados.
              </div>

              {regError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
                  {regError}
                </div>
              )}

              {regSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center font-bold flex items-center justify-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{regSuccess}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-300">
                      Nome Fantasia da Empresa *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Building className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regNomeEmpresa}
                        onChange={(e) => setRegNomeEmpresa(e.target.value)}
                        placeholder="Ex: Prime Flats Imobiliária"
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-300">
                      CNPJ ou CPF
                    </label>
                    <input
                      type="text"
                      value={regCnpj}
                      onChange={(e) => handleCnpjCpfChange(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-300">
                      Nome do Administrador *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regNomeAdmin}
                        onChange={(e) => setRegNomeAdmin(e.target.value)}
                        placeholder="Seu Nome Completo"
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-300">
                      WhatsApp / Telefone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={regTelefone}
                        onChange={(e) => setRegTelefone(formatPhone(e.target.value))}
                        placeholder="(00) 00000-0000"
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-300">
                      E-mail de Login *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="admin@empresa.com"
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-300">
                      Senha de Acesso (min. 6 car.) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type={showRegPassword ? "text" : "password"}
                        required
                        value={regSenha}
                        onChange={(e) => setRegSenha(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-300">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={regCidade}
                      onChange={(e) => setRegCidade(e.target.value)}
                      placeholder="Ex: Petrolina"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-300">
                      UF
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={regEstado}
                      onChange={(e) => setRegEstado(e.target.value.toUpperCase())}
                      placeholder="PE"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-white uppercase text-center placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600 hover:from-emerald-500 hover:to-blue-500 font-bold text-white text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition disabled:opacity-50 mt-2 active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{regLoading ? "Configurando Ambiente SaaS..." : "Criar Empresa e Começar Agora"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Destaques e Selo de Segurança */}
          <div className="pt-5 mt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 font-medium">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Ambiente Protegido com Criptografia SSL</span>
            </div>
            <div className="flex items-center space-x-1 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Alta Performance & Backup Cloud</span>
            </div>
          </div>
        </div>

        {/* Grade de Recursos Explicativos do SaaS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 w-full max-w-4xl">
          <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/60 backdrop-blur-sm flex flex-col items-center text-center space-y-1.5 hover:border-slate-700 transition">
            <Building2 className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-bold text-slate-200">Gestão de Flats</span>
            <span className="text-[10px] text-slate-400">Controle total de unidades, status e ocupação</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/60 backdrop-blur-sm flex flex-col items-center text-center space-y-1.5 hover:border-slate-700 transition">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold text-slate-200">Contratos & Vistorias</span>
            <span className="text-[10px] text-slate-400">Assinatura digital e laudos com câmera</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/60 backdrop-blur-sm flex flex-col items-center text-center space-y-1.5 hover:border-slate-700 transition">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">WhatsApp Integrado</span>
            <span className="text-[10px] text-slate-400">Envio direto de PDFs e cobranças aos locatários</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/60 backdrop-blur-sm flex flex-col items-center text-center space-y-1.5 hover:border-slate-700 transition">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">Auditoria Blockchain</span>
            <span className="text-[10px] text-slate-400">Carimbo de tempo e integridade imutável</span>
          </div>
        </div>
      </div>

      {/* Rodapé Oficial da Tela de Login */}
      <footer className="py-4 text-center text-xs font-medium text-slate-400 relative z-10 border-t border-slate-900/80 bg-slate-950/60 backdrop-blur-sm">
        Desenvolvimento:{" "}
        <a
          href="https://pajotecnologia.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 font-semibold hover:underline"
        >
          pajotecnologia.com.br
        </a>{" "}
        (87)996540551
      </footer>
    </div>
  );
}
