"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  FileText,
  Camera,
  MessageSquare,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Play,
  Lock,
  Users,
  Home,
  Check,
  Star,
  Award,
  Smartphone,
  Laptop,
  CheckCheck,
  FileCheck,
  Send,
  Eye,
  EyeOff,
  User,
  Phone,
  Mail,
  Calendar,
  X,
  Sliders,
  TrendingUp,
  CreditCard,
  QrCode,
  ShieldAlert,
} from "lucide-react";
import { SYSTEM_VERSION } from "@/lib/version";
import { formatCNPJ, formatCPF, formatPhone } from "@/lib/validation";

interface SaasConfig {
  diasTrialPadrao: number;
  valorMensal: number;
  valorTrimestral: number;
  valorSemestral: number;
  valorAnual: number;
  telefoneSuporteWhatsApp: string;
  chavePix: string;
}

export default function LandingPage() {
  const [config, setConfig] = useState<SaasConfig>({
    diasTrialPadrao: 7,
    valorMensal: 97,
    valorTrimestral: 260,
    valorSemestral: 490,
    valorAnual: 890,
    telefoneSuporteWhatsApp: "(87) 99654-0551",
    chavePix: "contato@pajotech.com.br",
  });

  const [activeTabDemo, setActiveTabDemo] = useState<"contratos" | "vistorias" | "whatsapp" | "financeiro" | "blockchain">("blockchain");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Modal de Acesso Rápido (Login / Cadastro)
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");

  // Form Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Form Register
  const [regNomeEmpresa, setRegNomeEmpresa] = useState("");
  const [regCnpj, setRegCnpj] = useState("");
  const [regTelefone, setRegTelefone] = useState("");
  const [regNomeAdmin, setRegNomeAdmin] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regSenha, setRegSenha] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  useEffect(() => {
    fetch("/api/saas/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setConfig(data.config);
        }
      })
      .catch(() => {});
  }, []);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
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
        setLoginError(data.error || "E-mail ou senha incorretos.");
        setLoginLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setLoginError("Erro ao conectar com o servidor.");
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (!regNomeEmpresa || !regNomeAdmin || !regEmail || !regSenha) {
      setRegError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (regSenha.length < 6) {
      setRegError("A senha deve ter no mínimo 6 caracteres.");
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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || "Erro ao criar conta.");
        setRegLoading(false);
        return;
      }

      setRegSuccess(`Parabéns! Sua empresa foi criada com ${config.diasTrialPadrao} dias de teste grátis! Entrando...`);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (err) {
      setRegError("Erro ao processar cadastro.");
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

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setLoginError("");
    setRegError("");
    setShowAuthModal(true);
  };

  const faqs = [
    {
      q: "Como funciona o período de teste grátis?",
      a: `Você se cadastra em menos de 1 minuto e ganha ${config.diasTrialPadrao} dias de acesso total e irrestrito a todas as funcionalidades do sistema, sem necessidade de cartão de crédito.`,
    },
    {
      q: "Como funciona o registro em Blockchain dos contratos e laudos?",
      a: "No momento em que o locador e locatário assinam o contrato ou laudo de vistoria, o sistema gera uma impressão digital criptográfica única (Hash SHA-256) e ancora esse registro na rede Blockchain do Bitcoin através do protocolo OpenTimestamps (ISO 14533). Isso gera uma prova matemática e imutável de que o documento existia exatamente naquele formato e horário, tornando qualquer falsificação ou alteração retroativa impossível.",
    },
    {
      q: "Os contratos e laudos emitidos possuem validade jurídica?",
      a: "Sim! Os contratos e laudos de vistoria são gerados no padrão White Clean Universal, contêm assinaturas digitais, carimbo de data/hora, ancoragem em Blockchain e fotos com resolução otimizada, ideais para segurança jurídica de locador e locatário.",
    },
    {
      q: "Como funciona o envio de contratos e recibos pelo WhatsApp?",
      a: "O sistema se conecta diretamente à Evolution API. Com apenas 1 clique, o PDF do contrato, laudo ou recibo é enviado anexado diretamente no WhatsApp do inquilino com o link para assinatura ou conferência.",
    },
    {
      q: "Consigo tirar fotos da vistoria direto com o celular?",
      a: "Sim! O módulo de vistoria possui acionamento nativo da câmera do celular/tablet e webcam ao vivo no computador, além de permitir o envio de fotos da galeria.",
    },
    {
      q: "Como funciona o pagamento após o término do teste?",
      a: "Após os dias de teste grátis, você pode escolher o plano que melhor atende sua empresa (Mensal, Trimestral, Semestral ou Anual) e realizar o pagamento instantâneo via PIX com liberação imediata.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Background Decorativo Dinâmico */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/25 via-slate-950 to-slate-950 pointer-events-none -z-10" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#3b82f60a_1px,transparent_1px),linear-gradient(to_bottom,#3b82f60a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none -z-10" />

      {/* 1. NAVBAR OFICIAL */}
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 group-hover:scale-105 transition">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="font-black text-white text-lg tracking-tight block leading-tight">
                Gestão de Flats
              </span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">
                Plataforma SaaS de Locações
              </span>
            </div>
          </Link>

          {/* Menu Desktop */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold text-slate-300">
            <a href="#funcionalidades" className="hover:text-blue-400 transition">
              Funcionalidades
            </a>
            <a href="#demonstracao" className="hover:text-blue-400 transition">
              Como Funciona
            </a>
            <a href="#vistorias" className="hover:text-blue-400 transition">
              Vistorias com Câmera
            </a>
            <a href="#whatsapp" className="hover:text-blue-400 transition">
              WhatsApp
            </a>
            <a href="#planos" className="hover:text-blue-400 transition">
              Planos & Preços
            </a>
            <a href="#faq" className="hover:text-blue-400 transition">
              FAQ
            </a>
          </nav>

          {/* Botões de Acesso */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => openAuth("login")}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition flex items-center space-x-2 shadow-sm"
            >
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Já sou Cliente</span>
            </button>

            <button
              onClick={() => openAuth("register")}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-xl shadow-blue-500/25 transition hover:scale-105 active:scale-95 flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Testar {config.diasTrialPadrao} Dias Grátis</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Glow Central */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Badge Flutuante */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold mb-8 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: "6s" }} />
          <span>O Software Completo para Administrar Flats, Condomínios e Temporadas</span>
        </div>

        {/* Título Principal */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-5xl mx-auto leading-[1.15]">
          Gerencie Flats, Contratos, Vistorias com Câmera e Cobranças via{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
            WhatsApp
          </span>
        </h1>

        {/* Subtítulo */}
        <p className="mt-6 text-sm sm:text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
          Abandone as planilhas manuais. Emita contratos com validade jurídica, realize vistorias fotográficas direto do celular, colete assinaturas na tela e envie recibos automáticos em PDF.
        </p>

        {/* Formulário Rápido de Início / CTAs */}
        <div className="mt-10 max-w-xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <button
              onClick={() => openAuth("register")}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm shadow-2xl shadow-blue-500/30 transition hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>Experimente Grátis por {config.diasTrialPadrao} Dias</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#demonstracao"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-bold text-sm transition flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 text-blue-400" />
              <span>Ver Demonstração</span>
            </a>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sem cartão para testar
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ativação em 1 minuto
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cancelamento livre
            </span>
          </div>
        </div>

        {/* Preview do Painel com Estatísticas Reais */}
        <div className="mt-14 max-w-5xl mx-auto rounded-3xl p-1.5 bg-gradient-to-b from-blue-500/30 via-slate-800/40 to-slate-950 shadow-2xl">
          <div className="bg-slate-900/95 rounded-[22px] p-6 md:p-8 border border-slate-800 text-left">
            {/* Header do Mockup */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-slate-400 ml-2">https://gestaoflats.pajotech.com.br</span>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                ● Sistema Operante & Sincronizado
              </span>
            </div>

            {/* Grid de Cards do Mockup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Flats Gerenciados</span>
                  <Home className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-2xl font-black text-white">48 Flats</span>
                <span className="text-[11px] text-emerald-400 font-bold mt-1 block">91.6% Ocupados</span>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Vistorias Realizadas</span>
                  <Camera className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-2xl font-black text-emerald-400">100% Fotos</span>
                <span className="text-[11px] text-slate-400 font-medium mt-1 block">Câmera Celular / Tablet</span>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Envios WhatsApp</span>
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-2xl font-black text-cyan-400">PDFs Diretos</span>
                <span className="text-[11px] text-slate-400 font-medium mt-1 block">Cobranças & Recibos</span>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Recebimento PIX</span>
                  <CreditCard className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-2xl font-black text-amber-400">R$ 64.800</span>
                <span className="text-[11px] text-emerald-400 font-bold mt-1 block">0% Inadimplência</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SEÇÃO DE FUNCIONALIDADES COMPLETAS */}
      <section id="funcionalidades" className="py-24 bg-slate-900/40 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Recursos Completos</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              Todas as ferramentas que você precisa em um único lugar
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Projetado especificamente para proprietários e gestores de imóveis de temporada, flats e locações residenciais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1 */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-7 hover:border-slate-700 transition space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-600/10">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Contratos Inteligentes & Tags</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Emissão instantânea com suporte a locações por <strong>Meses (Residenciais)</strong> ou <strong>Dias (Temporada)</strong>. As variáveis de nome, CPF, imóvel e valores por extenso são preenchidas automaticamente.
              </p>
              <div className="pt-2 text-xs text-blue-400 font-bold flex items-center gap-1">
                <span>PDFs no padrão White Clean</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 2 */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-7 hover:border-slate-700 transition space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-600/10">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Vistoria com Câmera do Smartphone</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Checklists fotográficos de entrada e saída. Fotografe cada cômodo e eletrodoméstico usando a câmera do celular ou webcam e colete a assinatura digital na hora.
              </p>
              <div className="pt-2 text-xs text-emerald-400 font-bold flex items-center gap-1">
                <span>Laudo com fotos em anexo</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 3 */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-7 hover:border-slate-700 transition space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-600/10">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">WhatsApp Integrado (Evolution API)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dispare contratos, cobranças e recibos de pagamento em PDF diretamente no WhatsApp do inquilino com links clicáveis sem bloqueio.
              </p>
              <div className="pt-2 text-xs text-cyan-400 font-bold flex items-center gap-1">
                <span>Envio de PDF direto sem travar</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 4 */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-7 hover:border-slate-700 transition space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-600/10">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Controle Financeiro & Recibos</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Contas a receber e pagar integradas às parcelas dos contratos. Baixas de pagamentos com anexação de comprovantes e emissão de recibos oficiais.
              </p>
              <div className="pt-2 text-xs text-amber-400 font-bold flex items-center gap-1">
                <span>Recibos com código de autenticidade</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 5 */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-7 hover:border-slate-700 transition space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center shadow-lg shadow-purple-600/10">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Gestão de Edifícios & Flats</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cadastre prédios, condomínios e suas unidades. Gerencie fotos dos cômodos, itens de mobília inclusos e status (Disponível, Ocupado, Manutenção).
              </p>
              <div className="pt-2 text-xs text-purple-400 font-bold flex items-center gap-1">
                <span>Visão de ocupação em tempo real</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 6 */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-7 hover:border-slate-700 transition space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-600/10">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Multi-Tenant Isolado & Equipe</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cada empresa possui sua base de dados isolada, sua própria logomarca, seus operadores e dados de WhatsApp com segurança e confidencialidade.
              </p>
              <div className="pt-2 text-xs text-rose-400 font-bold flex items-center gap-1">
                <span>Acesso protegido e criptografado</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SEÇÃO DE DEMONSTRAÇÃO INTERATIVA */}
      <section id="demonstracao" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Interface em Ação</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Veja como é simples e rápido utilizar
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Alterne entre os módulos abaixo para conhecer a experiência do usuário.
          </p>
        </div>

        {/* Tabs de Demonstração */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveTabDemo("vistorias")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTabDemo === "vistorias"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Vistorias & Fotos na Câmera</span>
          </button>

          <button
            onClick={() => setActiveTabDemo("contratos")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTabDemo === "contratos"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Contratos & Tags Dinâmicas</span>
          </button>

          <button
            onClick={() => setActiveTabDemo("whatsapp")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTabDemo === "whatsapp"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/25"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp & PDFs Automáticos</span>
          </button>

          <button
            onClick={() => setActiveTabDemo("financeiro")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTabDemo === "financeiro"
                ? "bg-amber-600 text-white shadow-lg shadow-amber-600/25"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Contas a Receber & Recibos</span>
          </button>

          <button
            onClick={() => setActiveTabDemo("blockchain")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTabDemo === "blockchain"
                ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>🛡️ Auditoria Blockchain (Bitcoin)</span>
          </button>
        </div>

        {/* Card do Preview Interativo */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl max-w-4xl mx-auto">
          {activeTabDemo === "blockchain" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" /> Prova de Existência & Imutabilidade em Blockchain (Bitcoin)
                  </h3>
                  <p className="text-xs text-slate-400">Ancoragem de contratos e vistorias via protocolo descentralizado OpenTimestamps (ISO 14533)</p>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                  ✓ Bitcoin Blockchain
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono">HASH SHA-256 DO DOCUMENTO:</span>
                  <span className="font-mono font-bold text-emerald-400 text-[11px] truncate max-w-[280px]">
                    e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                  <span className="text-slate-400">STATUS DA ANCORAGEM:</span>
                  <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                    STAMPED & VERIFIED (BITCOIN)
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                  <span className="text-slate-400">PROTOCOLO / PADRÃO:</span>
                  <span className="font-semibold text-slate-200">OpenTimestamps (OTS) / Rede Bitcoin</span>
                </div>
                <div className="border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
                  💡 Qualquer pessoa ou tribunal pode verificar a autenticidade apontando a câmera para o QR Code do documento ou enviando o arquivo PDF na página <Link href="/validar" className="text-blue-400 font-bold hover:underline">/validar</Link>.
                </div>
              </div>
            </div>
          )}
          {activeTabDemo === "vistorias" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Camera className="w-5 h-5 text-emerald-400" /> Laudo de Vistoria de Entrada / Saída
                  </h3>
                  <p className="text-xs text-slate-400">Captura direta de fotos com status por item e assinatura na tela</p>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold">
                  ✓ Câmera Nativa
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">1. Sala & Mobília</span>
                    <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold text-[10px]">OK</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Sofá 3 lugares sem rasgos, TV Smart 50 polegadas funcionando.</p>
                  <div className="h-20 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center text-slate-500 text-[10px]">
                    [ 📷 Foto Anexada da Sala ]
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">2. Quarto Suíte</span>
                    <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold text-[10px]">OK</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Ar condicionado 12.000 BTUs gelando com controle remoto.</p>
                  <div className="h-20 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center text-slate-500 text-[10px]">
                    [ 📷 Foto Anexada do Quarto ]
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">3. Banheiro</span>
                    <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold text-[10px]">Atenção</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Chuveiro elétrico funcionando, pequeno trinco no espelho lateral.</p>
                  <div className="h-20 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center text-slate-500 text-[10px]">
                    [ 📷 Foto Anexada do Espelho ]
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTabDemo === "contratos" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" /> Contrato de Locação Residencial / Temporada
                  </h3>
                  <p className="text-xs text-slate-400">Editor visual com tags dinâmicas e geração de PDF universal</p>
                </div>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-bold">
                  ✓ Validade Jurídica
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed">
                <p className="text-blue-400 font-bold">LOCADOR: {"{{empresa.nome}}"}, CNPJ: {"{{empresa.cnpj}}"}</p>
                <p className="text-emerald-400 font-bold mt-1">LOCATÁRIO: {"{{locatario.nome}}"}, CPF: {"{{locatario.cpf}}"}</p>
                <p className="mt-3">
                  Pelo presente instrumento particular, o LOCADOR dá em locação ao LOCATÁRIO o imóvel <strong>{"{{flat.numero}}"}</strong>, localizado em {"{{local.endereco}}"}.
                </p>
                <p className="mt-2">
                  <strong>VIGÊNCIA:</strong> O prazo é de <strong>{"{{contrato.duracao}}"}</strong> com início em <strong>{"{{contrato.data_emissao}}"}</strong> e valor mensal de <strong>{"{{contrato.valor}}"}</strong> ({"{{contrato.valor_extenso}}"}).
                </p>
              </div>
            </div>
          )}

          {activeTabDemo === "whatsapp" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-cyan-400" /> Disparador WhatsApp com Anexo .PDF
                  </h3>
                  <p className="text-xs text-slate-400">Integração nativa com Evolution API para envio direto sem intermediários</p>
                </div>
                <span className="text-xs bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full font-bold">
                  ✓ 1-Click Send
                </span>
              </div>

              <div className="max-w-md mx-auto bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="font-bold text-slate-300">WhatsApp para Inquilino</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <FileCheck className="w-4 h-4" />
                    <span>Recibo_Pagamento_Aluguel.pdf (1.2 MB)</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Olá Carlos, segue em anexo o recibo oficial de pagamento do aluguel do Flat 101. Obrigado pela pontualidade!
                  </p>
                  <span className="text-[9px] text-slate-500 block text-right">10:45 ✓✓</span>
                </div>
              </div>
            </div>
          )}

          {activeTabDemo === "financeiro" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-400" /> Contas a Receber e Baixa com Comprovante
                  </h3>
                  <p className="text-xs text-slate-400">Quitação de parcelas, emissão de recibos e controle de inadimplência</p>
                </div>
                <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-bold">
                  ✓ Baixa Instantânea
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <div>
                      <span className="font-bold text-white block">Parcela 08/12 — Flat 101</span>
                      <span className="text-[11px] text-slate-400">Locatário: Dr. Roberto Santos</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400 block">R$ 2.500,00</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">PAGO (PIX)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <div>
                      <span className="font-bold text-white block">Parcela 09/12 — Flat 204</span>
                      <span className="text-[11px] text-slate-400">Locatário: Mariana Ribeiro</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white block">R$ 2.200,00</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">VENCE EM 5 DIAS</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4.5. SEÇÃO DEDICADA DE AUDITORIA EM BLOCKCHAIN (BITCOIN) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative z-10">
            <div className="space-y-5 text-left">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Exclusivo: Auditoria Imutável em Blockchain</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Seus Contratos e Vistorias Ancorados na Blockchain do Bitcoin
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Cada contrato e laudo assinado no sistema gera uma impressão digital única (<strong>Hash SHA-256</strong>), que é ancorada na maior rede descentralizada do mundo via protocolo <strong>OpenTimestamps (ISO 14533)</strong>.
              </p>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>100% Imutável:</strong> Qualquer adulteração de 1 único caractere invalida a prova.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Validação Pública por QR Code:</strong> Juízes, advogados e inquilinos verificam apontando o celular.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Download de Prova (.ots):</strong> Arquivo de prova criptográfica com carimbo de tempo mundial.</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  href="/validar"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition inline-flex items-center space-x-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Testar Validador Público de Blockchain</span>
                </Link>
              </div>
            </div>

            <div className="bg-slate-950/90 border border-emerald-500/20 rounded-2xl p-6 space-y-4 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  CERTIFICADO DIGITAL BITCOIN
                </span>
                <span className="text-[10px] text-slate-400 font-sans">OpenTimestamps</span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] block">DOCUMENT HASH (SHA-256):</span>
                <p className="text-slate-200 break-all bg-slate-900 p-2 rounded-lg border border-slate-800 text-[11px]">
                  9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">REDE:</span>
                  <span className="font-bold text-white text-xs">Bitcoin Mainnet</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">STATUS:</span>
                  <span className="font-bold text-emerald-400 text-xs">STAMPED (CONFIRMADO)</span>
                </div>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-800/40 p-3 rounded-xl text-emerald-300 text-[11px] font-sans">
                ✓ Prova de integridade jurídica aceita em conformidade com o Artigo 10 da MP 2.200-2/2001 e normas ISO.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SEÇÃO DE PLANOS & PREÇOS DINÂMICOS */}
      <section id="planos" className="py-24 bg-slate-900/40 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Planos Transparentes</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-2">
            Escolha o Plano Ideal para a sua Empresa
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
            Comece agora com {config.diasTrialPadrao} dias grátis. Após o período de teste, você escolhe seu plano e paga com liberação instantânea via PIX.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14 text-left">
            {/* Mensal */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-7 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Mensal</span>
                <h3 className="text-2xl font-bold text-white mt-1">Plano Mensal</h3>
                <p className="text-xs text-slate-400 mt-1">Flexibilidade mês a mês</p>
                <div className="mt-6">
                  <span className="text-4xl font-black text-white">{formatBRL(config.valorMensal)}</span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Flats e Locatários Ilimitados
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Vistorias com Câmera e Fotos
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> WhatsApp Ilimitado
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Recibos & Contas a Receber
                  </li>
                </ul>
              </div>

              <button
                onClick={() => openAuth("register")}
                className="mt-8 w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold text-center block transition"
              >
                Testar {config.diasTrialPadrao} Dias Grátis
              </button>
            </div>

            {/* Trimestral */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-7 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Trimestral</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full">
                    -10% OFF
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mt-1">3 Meses</h3>
                <p className="text-xs text-slate-400 mt-1">Pagamento a cada 3 meses</p>
                <div className="mt-6">
                  <span className="text-4xl font-black text-white">{formatBRL(config.valorTrimestral)}</span>
                  <span className="text-xs text-slate-400">/trimestre</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 3 meses garantidos
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Todos os recursos inclusos
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Suporte Prioritário
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Backup Automático
                  </li>
                </ul>
              </div>

              <button
                onClick={() => openAuth("register")}
                className="mt-8 w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold text-center block transition"
              >
                Testar {config.diasTrialPadrao} Dias Grátis
              </button>
            </div>

            {/* Semestral */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-7 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Semestral</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full">
                    -15% OFF
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mt-1">6 Meses</h3>
                <p className="text-xs text-slate-400 mt-1">6 meses de tranquilidade</p>
                <div className="mt-6">
                  <span className="text-4xl font-black text-white">{formatBRL(config.valorSemestral)}</span>
                  <span className="text-xs text-slate-400">/semestre</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 6 meses de acesso liberado
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Suporte VIP WhatsApp
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Exportação de Relatórios
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Treinamento de Equipe
                  </li>
                </ul>
              </div>

              <button
                onClick={() => openAuth("register")}
                className="mt-8 w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold text-center block transition"
              >
                Testar {config.diasTrialPadrao} Dias Grátis
              </button>
            </div>

            {/* Anual */}
            <div className="bg-gradient-to-b from-blue-950/80 to-slate-900 border-2 border-blue-500 rounded-3xl p-7 flex flex-col justify-between relative shadow-2xl shadow-blue-500/20">
              <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg">
                ★ Mais Popular (Melhor Oferta)
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase">Anual</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full">
                    -25% OFF
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mt-1">12 Meses</h3>
                <p className="text-xs text-slate-400 mt-1">1 ano inteiro de economia máxima</p>
                <div className="mt-6">
                  <span className="text-4xl font-black text-amber-400">{formatBRL(config.valorAnual)}</span>
                  <span className="text-xs text-slate-400">/ano</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> 12 meses de acesso VIP
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Todas as novas funcionalidades
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Canal Direto com Desenvolvedor
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Economia de centenas de reais
                  </li>
                </ul>
              </div>

              <button
                onClick={() => openAuth("register")}
                className="mt-8 w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-black text-center block shadow-lg shadow-blue-600/30 transition hover:scale-105"
              >
                Testar {config.diasTrialPadrao} Dias Grátis
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SEÇÃO FAQ */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Tire suas Dúvidas</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">Perguntas Frequentes</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden transition">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full text-left p-5 flex items-center justify-between font-bold text-sm text-slate-200 hover:text-white"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-blue-400 shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. CTA FINAL */}
      <section className="py-20 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-t border-slate-800 text-center px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Pronto para transformar a gestão dos seus flats?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Cadastre-se em menos de 1 minuto e ganhe {config.diasTrialPadrao} dias de teste gratuito com acesso total a todos os recursos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => openAuth("register")}
              className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm shadow-2xl shadow-blue-500/30 transition hover:scale-105 active:scale-95"
            >
              Criar Conta & Começar Teste Grátis
            </button>
            <button
              onClick={() => openAuth("login")}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900/90 border border-slate-700 text-slate-300 font-bold text-sm hover:text-white transition"
            >
              Já sou Cliente / Acessar Sistema
            </button>
          </div>
        </div>
      </section>

      {/* 8. FOOTER OFICIAL */}
      <footer className="py-8 border-t border-slate-900 bg-slate-950 text-xs text-slate-400 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              GF
            </div>
            <span className="font-bold text-slate-200">Gestão de Flats SaaS</span>
            <span className="text-slate-600">|</span>
            <span className="inline-flex items-center space-x-1 text-[11px] text-blue-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Versão Oficial: {SYSTEM_VERSION}</span>
            </span>
          </div>

          <div>
            Desenvolvimento:{" "}
            <a
              href="https://pajotecnologia.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 font-semibold hover:underline"
            >
              pajotecnologia.com.br
            </a>{" "}
            (87) 99654-0551
          </div>
        </div>
      </footer>

      {/* 9. MODAL INTERATIVO DE ACESSO / CADASTRO */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Alternador de Modo */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  authMode === "register"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Criar Conta ({config.diasTrialPadrao}d Grátis)
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  authMode === "login"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Já sou Cliente
              </button>
            </div>

            {/* FORMULÁRIO DE LOGIN */}
            {authMode === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <h3 className="font-bold text-white text-base">Acessar sua Conta</h3>
                  <p className="text-slate-400 text-xs">Informe seu e-mail e senha cadastrados</p>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold">
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    placeholder="seuemail@empresa.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Senha</label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={loginSenha}
                      onChange={(e) => setLoginSenha(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-medium focus:border-blue-500 focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 transition disabled:opacity-50 mt-2"
                >
                  {loginLoading ? "Entrando..." : "Entrar no Painel"}
                </button>
              </form>
            )}

            {/* FORMULÁRIO DE REGISTRO (TRIAL) */}
            {authMode === "register" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                <div>
                  <h3 className="font-bold text-white text-base">Criar Conta Gratuita</h3>
                  <p className="text-slate-400 text-xs">Ganhe {config.diasTrialPadrao} dias de teste sem compromisso</p>
                </div>

                {regError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold">
                    {regError}
                  </div>
                )}

                {regSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
                    {regSuccess}
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Nome da Empresa / Residencial *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Flats Beira Mar"
                    value={regNomeEmpresa}
                    onChange={(e) => setRegNomeEmpresa(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">CNPJ / CPF</label>
                    <input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      value={regCnpj}
                      onChange={(e) => handleCnpjCpfChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Telefone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      placeholder="(81) 99999-9999"
                      value={regTelefone}
                      onChange={(e) => setRegTelefone(formatPhone(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Seu Nome (Administrador) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome completo"
                    value={regNomeAdmin}
                    onChange={(e) => setRegNomeAdmin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Seu E-mail de Acesso *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@empresa.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Senha (Mínimo 6 dígitos) *</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={regSenha}
                      onChange={(e) => setRegSenha(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs shadow-lg shadow-blue-500/25 transition disabled:opacity-50 mt-3"
                >
                  {regLoading ? "Criando Ambiente..." : `Criar Conta e Testar ${config.diasTrialPadrao} Dias Grátis`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
