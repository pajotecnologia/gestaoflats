"use client";

import React, { useState } from "react";
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
  Image as ImageIcon,
  CheckSquare,
  FileBadge,
  ArrowUpRight,
  HardDrive,
  Grid,
  CheckCircle,
  Receipt,
  FileDown,
  Cpu,
  Wrench,
  Activity,
  FolderOpen,
  CalendarDays,
  Flame,
  BarChart3,
  SlidersHorizontal,
} from "lucide-react";
import { SYSTEM_VERSION } from "@/lib/version";
import { formatCNPJ, formatCPF, formatPhone } from "@/lib/validation";
import { COMMERCIAL_PLANS } from "@/lib/plans/planDefinitions";
import ImobLogo from "@/components/brand/ImobLogo";

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<"MENSAL" | "ANUAL">("MENSAL");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const formatPrice = (val: number) => {
    if (typeof val !== "number" || isNaN(val)) return "0,00";
    return val.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Modal de Acesso Rápido / Cadastro Grátis
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");

  // Form Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Form Register (Onboarding Trial)
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
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setLoginError("Erro de comunicação com o servidor.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");
    setRegLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeEmpresa: regNomeEmpresa.trim(),
          cnpj: regCnpj.trim(),
          telefone: regTelefone.trim(),
          nomeAdmin: regNomeAdmin.trim(),
          email: regEmail.trim(),
          senha: regSenha,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || "Erro ao cadastrar empresa.");
      } else {
        setRegSuccess("Conta criada com sucesso! Redirecionando para seu painel...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1200);
      }
    } catch {
      setRegError("Erro ao processar solicitação.");
    } finally {
      setRegLoading(false);
    }
  };

  const faqItems = [
    {
      q: "Posso cadastrar diferentes tipos de imóveis (Flats, Casas, Chácaras, Salões)?",
      a: "Sim! O IMOB foi projetado com categorização versátil para gerenciar Flats, Apartamentos, Casas Residenciais, Chácaras, Sítios, Salões para Eventos e Salas Comerciais.",
    },
    {
      q: "Como funciona a Agenda de Reservas e Locação por Diárias?",
      a: "O sistema conta com um mapa de ocupação estilo timeline horizontal em tempo real. Você gerencia check-ins, check-outs, quantidade de hóspedes, caução e gera contratos ou vistorias em 1 clique sem risco de conflito de datas.",
    },
    {
      q: "O que é o Dossiê 360° do Locatário?",
      a: "É a central unificada do cliente onde você visualiza todos os contratos passados e vigentes, reservas por temporada, faturas pagas e pendentes, laudos de vistoria e chamados de manutenção em uma única aba organizada.",
    },
    {
      q: "Como funciona a vistoria fotográfica e o comparativo Entrada × Saída?",
      a: "Você abre o checklist no celular, aciona a câmera nativa com 1 toque e registra fotos em alta definição com compressão automática. Na vistoria de saída, o sistema compara com a de entrada para apontar avarias e gerar cobranças.",
    },
    {
      q: "A assinatura digital tem validade jurídica?",
      a: "Sim. A assinatura digital do IMOB registra o endereço IP do locatário, carimbo de data/hora oficial e gera prova com validade jurídica e carimbo imutável.",
    },
    {
      q: "Como funciona a integração com o WhatsApp?",
      a: "O IMOB envia os documentos oficiais diretamente anexados como arquivo .PDF (Contratos, Laudos de Vistoria, Recibos e Boletos Bancários com Pix) pelo WhatsApp do locatário sem precisar baixar nada manualmente.",
    },
    {
      q: "Posso emitir boletos bancários com QR Code Pix (Bolepix) pelo Banco Inter?",
      a: "Sim. O sistema possui integração nativa mTLS com o Banco Inter (API Cobrança v3), emitindo boletos com Pix integrado e conciliação bancária automática por webhook e reconciliação ativa em tempo real.",
    },
    {
      q: "O que acontece se eu atingir o limite de imóveis do meu plano?",
      a: "O sistema avisa cordialmente que você atingiu a capacidade do plano e sugere o upgrade para o próximo nível. Você pode fazer o upgrade em segundos com liberação imediata via PIX.",
    },
    {
      q: "Existe período de teste grátis (Trial)?",
      a: "Sim! Você pode criar sua conta gratuitamente e testar todos os recursos da plataforma por 7 dias sem precisar cadastrar cartão de crédito.",
    },
    {
      q: "Posso administrar imóveis de múltiplos proprietários e repasses?",
      a: "Sim! A partir do Plano Profissional você conta com gestão de múltiplos proprietários, separação de imóveis e controle de repasses financeiros.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white antialiased">
      {/* ========================================================================= */}
      {/* 1. HEADER / NAVBAR                                                        */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Logo Oficial IMOB */}
          <Link href="/" className="hover:opacity-95 transition">
            <ImobLogo size="md" showSubtitle={true} showTagline={false} />
          </Link>

          {/* Navegação Desktop */}
          <nav className="hidden lg:flex items-center space-x-7 text-xs font-bold text-slate-300">
            <a href="#agenda" className="hover:text-indigo-400 transition">
              Agenda & Diárias
            </a>
            <a href="#dossie" className="hover:text-indigo-400 transition">
              Dossiê do Cliente
            </a>
            <a href="#vistorias" className="hover:text-indigo-400 transition">
              Vistorias & Fotos
            </a>
            <a href="#manutencao" className="hover:text-indigo-400 transition">
              Ordens de Serviço
            </a>
            <a href="#financeiro" className="hover:text-indigo-400 transition">
              Financeiro & Bolepix
            </a>
            <a href="#planos" className="hover:text-indigo-400 transition">
              Planos & Preços
            </a>
            <a href="#faq" className="hover:text-indigo-400 transition">
              FAQ
            </a>
          </nav>

          {/* Botões CTA & Login */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setAuthMode("login");
                setShowAuthModal(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700/80 transition"
            >
              Entrar
            </button>

            <button
              onClick={() => {
                setAuthMode("register");
                setShowAuthModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-600 hover:from-indigo-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-indigo-500/25 transition hover:scale-[1.02]"
            >
              Começar Grátis
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION COM GLOWS MODERNOS & DESTAQUE DAS NOVIDADES               */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Glows Dinâmicos Índigo, Azul e Violeta */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[500px] bg-indigo-600/15 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-blue-600/12 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 left-10 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
          {/* Badge Topo */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-950/90 via-blue-950/80 to-slate-900 border border-indigo-500/40 text-indigo-300 text-xs font-extrabold backdrop-blur-md shadow-lg shadow-indigo-500/15">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>Versão {SYSTEM_VERSION} • Gestão Completa de Imóveis, Temporada & Diárias</span>
          </div>

          {/* Headline Principal */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-5xl mx-auto leading-[1.12]">
            O Sistema Completo para Locação Residencial, Comercial e Temporada.
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Controle reservas por diária, emita contratos com assinatura digital, faça vistorias com fotos pelo celular, gerencie ordens de serviço e emita boletos com Pix pelo Banco Inter em uma única plataforma.
          </p>

          {/* CTAs Principais */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <button
              onClick={() => {
                setAuthMode("register");
                setShowAuthModal(true);
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-500 hover:from-indigo-400 hover:to-blue-500 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-500/30 transition hover:scale-105"
            >
              <span>Começar Teste Grátis (7 Dias)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="https://wa.me/5587996540551?text=Ol%C3%A1!%20Gostaria%20de%20agendar%20uma%20demonstra%C3%A7%C3%A3o%20do%20sistema%20IMOB%20da%20PAJO%20Tecnologia."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-sm flex items-center justify-center gap-2 transition hover:border-slate-600"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Agendar Demonstração</span>
            </a>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-5 sm:gap-8 pt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Sem cartão de crédito
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Liberação instantânea
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Suporte humanizado
            </span>
          </div>

          {/* MOCKUP VISUAL INTERATIVO DO SOFTWARE */}
          <div className="pt-10 max-w-6xl mx-auto">
            <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800/90 p-2 sm:p-5 shadow-2xl shadow-indigo-950/60 backdrop-blur-2xl">
              {/* Header da Janela SaaS */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 mb-4 text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-mono text-[11px] text-slate-400">painel.gestaoflats.com.br</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-950/90 text-indigo-300 text-[10px] font-black border border-indigo-800/80">
                    ⚡ SISTEMA ATIVO • {SYSTEM_VERSION}
                  </span>
                </div>
              </div>

              {/* Grid de Cards Simulando os Novos Módulos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left p-2">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 hover:border-indigo-500/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Flats, Casas & Chácaras</span>
                    <Building2 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-white">28 Unidades</div>
                  <span className="text-[10px] text-emerald-400 font-semibold">94% Taxa de Ocupação</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 hover:border-blue-500/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agenda de Reservas</span>
                    <CalendarDays className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-black text-blue-400">18 Diárias Hoje</div>
                  <span className="text-[10px] text-slate-400">Check-ins & Check-outs com 1 toque</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 hover:border-emerald-500/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vistorias & Laudos</span>
                    <Camera className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400">100% com Fotos</div>
                  <span className="text-[10px] text-emerald-400 font-semibold">Comparativo Entrada × Saída</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 hover:border-amber-500/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Receita & Bolepix</span>
                    <QrCode className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-amber-400">R$ 64.250,00</div>
                  <span className="text-[10px] text-slate-400">Baixa automática Banco Inter</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PROVA / NÚMEROS                                                        */}
      {/* ========================================================================= */}
      <section className="py-12 border-y border-slate-800/80 bg-[#090e1a]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-white">+R$ 5.2M</div>
              <p className="text-xs text-slate-400">Em aluguéis e reservas administradas</p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-indigo-400">100%</div>
              <p className="text-xs text-slate-400">Vistorias com fotos e assinatura digital</p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400">2 Segundos</div>
              <p className="text-xs text-slate-400">Baixa automática de Bolepix via Webhook</p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-blue-400">360°</div>
              <p className="text-xs text-slate-400">Dossiê e Histórico Completo do Locatário</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. OS GRANDES PILARES E NOVIDADES DO SISTEMA                              */}
      {/* ========================================================================= */}

      {/* DESTAQUE 1: AGENDA DE RESERVAS & TIMELINE DE OCUPAÇÃO */}
      <section id="agenda" className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
                <CalendarDays className="w-4 h-4" />
                <span>Locação por Temporada & Diárias</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Agenda Visual de Reservas e Mapa de Ocupação.
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Controle todas as estadias em uma visualização estilo timeline horizontal sem risco de conflito de datas (double-booking). Gerencie check-ins, check-outs, hóspedes e valores com 1 toque.
              </p>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block">Status Inteligentes</strong>
                    <span className="text-slate-400">Solicitada, Confirmada, Check-in, Em Estadia, Check-out e Finalizada.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block">Geração Rápida de Contrato e Vistoria</strong>
                    <span className="text-slate-400">Crie o contrato de temporada por dias e o laudo de entrada direto da reserva.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block">Avisos Diretos no WhatsApp do Hóspede</strong>
                    <span className="text-slate-400">Envie confirmação com horários de entrada/saída e instruções de acesso.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mockup Timeline */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
                <span className="font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" /> Mapa de Ocupação - Setembro
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">Ao Vivo</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Chácara Recanto Feliz</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">Confirmada</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 w-3/4 rounded-full" />
                  </div>
                  <span className="text-[10px] text-slate-400 block">01/09 a 08/09 • Hóspede: Carlos Almeida • 6 pessoas</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Flat 102 - Praia Flat</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">Em Estadia</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full rounded-full" />
                  </div>
                  <span className="text-[10px] text-slate-400 block">Check-in realizado hoje • 3 diárias</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DESTAQUE 2: DOSSIÊ 360° DO CLIENTE */}
      <section id="dossie" className="py-20 sm:py-28 bg-[#090e1a]/50 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Mockup Dossiê */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-black text-sm">
                  JS
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">João da Silva Pereira</h4>
                  <p className="text-[11px] text-slate-400 font-mono">CPF: 123.456.789-00 • WhatsApp: (87) 99654-0551</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase block">Total Pago</span>
                  <span className="font-bold text-emerald-400 text-sm">R$ 14.800</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase block">Contratos</span>
                  <span className="font-bold text-indigo-400 text-sm">3 Ativos</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase block">Reservas</span>
                  <span className="font-bold text-blue-400 text-sm">8 Diárias</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="p-2 rounded-lg bg-slate-950/60 flex items-center justify-between text-slate-300">
                  <span>📄 Contrato #042 - Flat 204</span>
                  <span className="text-emerald-400 font-bold">Vigente</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 flex items-center justify-between text-slate-300">
                  <span>📋 Vistoria de Entrada assinada</span>
                  <span className="text-blue-400 font-bold">100% OK</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 flex items-center justify-between text-slate-300">
                  <span>💰 Bolepix ref. Setembro/2026</span>
                  <span className="text-emerald-400 font-bold">Pago via PIX</span>
                </div>
              </div>
            </div>

            {/* Texto Dossiê */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
                <FolderOpen className="w-4 h-4" />
                <span>Histórico 360° sem Fragmentação</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Dossiê Completo do Inquilino e Hóspede.
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Nunca mais procure informações espalhadas. Ao abrir o cadastro do cliente, você tem uma visão completa de toda a relação comercial: contratos, reservas por temporada, vistorias, pagamentos e manutenções.
              </p>

              <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Histórico unificado de todas as locações e estadias</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Extrato financeiro com total cobrado, pago e em aberto</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Acesso imediato a todos os laudos de vistoria e chamados de O.S.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DESTAQUE 3: VISTORIAS FOTOGRÁFICAS & COMPARATIVO ENTRADA × SAÍDA */}
      <section id="vistorias" className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <Camera className="w-4 h-4" />
                <span>Segurança Jurídica com Fotos</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Vistorias com Câmera no Celular e Comparativo Entrada × Saída.
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Esqueça papel e discussões na devolução das chaves. O IMOB permite fazer o checklist fotográfico cômodo por cômodo, capturar fotos de detalhes com a câmera traseira do celular e comparar automaticamente a vistoria de saída com a de entrada.
              </p>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block">Modelos de Checklist Personalizados</strong>
                    <span className="text-slate-400">Crie modelos para Apartamento, Casa Mobiliada, Chácara ou Salão de Eventos.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block">Identificação de Avarias e Danos</strong>
                    <span className="text-slate-400">Apontamento de divergências com cálculo de valores para ressarcimento.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block">Laudo White Clean em Alta Definição</strong>
                    <span className="text-slate-400">PDF profissional com miniaturas ampliadas e assinaturas do vistoriador e locatário.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mockup Celular Vistoria */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative">
              <div className="max-w-xs mx-auto bg-slate-950 rounded-[40px] border-4 border-slate-800 p-4 shadow-2xl space-y-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-2">
                  <span>📱 Laudo Pericial</span>
                  <span className="text-emerald-400">Chácara Recanto</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span>Ar-condicionado Sala</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black">OK</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span>Pintura e Paredes</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-black">Atenção</span>
                  </div>
                </div>

                <div className="p-2 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <div className="h-28 bg-emerald-950/40 rounded-xl flex flex-col items-center justify-center text-emerald-400 text-[10px] gap-1 border border-emerald-500/20">
                    <Camera className="w-6 h-6 text-emerald-400" />
                    <span>Foto Anexada em Alta Resolução</span>
                  </div>
                  <span className="text-[9px] text-slate-500">Compressão WebP sem perda de qualidade</span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                  <span className="text-[10px] text-emerald-300 font-bold block">✓ Assinado na Tela Touch</span>
                  <span className="text-[8px] text-slate-500 font-mono">IP: 189.40.122.9 • Válido Juridicamente</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DESTAQUE 4: ORDENS DE SERVIÇO & MANUTENÇÃO */}
      <section id="manutencao" className="py-20 sm:py-28 bg-[#090e1a]/50 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Mockup OS */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold text-white text-xs flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" /> Ordens de Serviço (O.S.)
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">Em Atendimento</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">❄️ Manutenção Ar-condicionado</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400">Prioridade Alta</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Flat 104 • Limpeza de filtro e troca de gás refrigerante.</p>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                    <span>Responsável: Climatiza Express</span>
                    <span className="font-bold text-slate-300">Custo: R$ 180,00</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">⚡ Troca de Disjuntor Geral</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">Média</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Casa 03 • Disjuntor desarmando ao ligar chuveiro elétrico.</p>
                </div>
              </div>
            </div>

            {/* Texto Manutenção */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <Wrench className="w-4 h-4" />
                <span>Operação e Conservação do Patrimônio</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Gestão de Manutenção & Ordens de Serviço (O.S.).
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Acompanhe todos os chamados de manutenção preventiva e corretiva por imóvel. Vincule fornecedores, registre orçamentos e custos que alimentam automaticamente o Contas a Pagar.
              </p>

              <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Categorias dedicadas: Elétrica, Hidráulica, Ar-condicionado, Pintura e Limpeza</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Controle de prioridade (Baixa, Média, Alta, Urgente)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Impacto direto no cálculo de rentabilidade líquida do imóvel</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DESTAQUE 5: FINANCEIRO & BOLEPIX BANCO INTER */}
      <section id="financeiro" className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
              Fintech Integrada com Banco Inter
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Emissão de Boletos com Pix e Baixa Automática em 2 Segundos.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Contas a receber, parcelamento automático por contrato, conciliação instantânea por webhook e recibos White Clean.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 hover:border-emerald-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Boleto com Pix (Bolepix)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Integração nativa mTLS com o Banco Inter (API v3). Emita boletos com QR Code Pix dinâmico e código de barras oficial com 1 clique.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 hover:border-emerald-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Baixa Instantânea por Webhook</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Quando o cliente paga em qualquer aplicativo de banco, o sistema recebe a notificação na hora e liquida a parcela como PAGO sem intervenção manual.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 hover:border-emerald-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Rentabilidade por Imóvel</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                O painel de gestão cruza receitas de aluguéis e diárias com as despesas de manutenção e condomínio para mostrar seu lucro real por unidade.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PARA QUEM É O SISTEMA IMOB                                             */}
      {/* ========================================================================= */}
      <section className="py-16 bg-[#090e1a]/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-8">
          <h2 className="text-xl sm:text-3xl font-black text-white">
            Desenvolvido para atender todas as modalidades de locação
          </h2>

          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-xs">
            {[
              "🏠 Casas Residenciais",
              "🏢 Apartamentos",
              "🏙️ Flats & Studios",
              "🏖️ Imóveis de Temporada",
              "🌳 Chácaras & Sítios",
              "🏊 Clubes & Lazer",
              "🎉 Salões de Eventos",
              "💼 Administradores de Imóveis",
              "🔑 Imobiliárias e Corretores",
              "📈 Empresas de Locação",
            ].map((tag, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 font-semibold shadow-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. PLANOS & PREÇOS OFICIAIS                                               */}
      {/* ========================================================================= */}
      <section id="planos" className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 text-center">
          <div className="space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
              Precificação Transparente
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Planos dimensionados para o tamanho da sua operação
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Você não paga para desbloquear o sistema — você paga conforme sua carteira de imóveis cresce.
            </p>

            {/* Toggle Mensal / Anual */}
            <div className="flex justify-center items-center gap-3 pt-4">
              <span className={`text-xs font-bold ${billingCycle === "MENSAL" ? "text-white" : "text-slate-500"}`}>
                Cobrança Mensal
              </span>

              <button
                type="button"
                onClick={() => setBillingCycle(billingCycle === "MENSAL" ? "ANUAL" : "MENSAL")}
                className="relative w-14 h-7 bg-slate-800 border border-slate-700 rounded-full p-1 transition-colors focus:outline-none"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-indigo-500 transition-transform duration-200 transform ${
                    billingCycle === "ANUAL" ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>

              <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === "ANUAL" ? "text-indigo-400" : "text-slate-500"}`}>
                <span>Cobrança Anual</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black border border-indigo-500/30">
                  Economize até 20%
                </span>
              </span>
            </div>
          </div>

          {/* Cards dos 4 Planos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {COMMERCIAL_PLANS.map((plano) => {
              const price = billingCycle === "ANUAL" ? plano.priceYearlyMonthlyEquivalent : plano.priceMonthly;

              return (
                <div
                  key={plano.id}
                  className={`rounded-3xl p-6 flex flex-col justify-between border relative ${
                    plano.popular
                      ? "bg-slate-900/95 border-indigo-500 shadow-2xl shadow-indigo-500/20 ring-2 ring-indigo-500/40"
                      : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {plano.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                      Mais Escolhido
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-black text-white">{plano.name}</h3>
                    <p className="text-xs text-slate-400 min-h-[36px] mt-1 leading-relaxed">
                      {plano.description}
                    </p>

                    <div className="my-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">R$ {formatPrice(price)}</span>
                        <span className="text-xs text-slate-400">/mês</span>
                      </div>
                      {billingCycle === "ANUAL" && (
                        <span className="text-[10px] text-indigo-400 font-semibold block mt-0.5">
                          R$ {formatPrice(plano.priceYearlyTotal)} cobrado anualmente
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs mb-5">
                      <div className="flex items-center gap-2 text-slate-200">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Até <strong>{plano.limits.maxProperties} imóveis</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-200">
                        <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Até <strong>{plano.limits.maxUsers} usuário(s)</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-200">
                        <FileCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span><strong>{plano.limits.maxSignaturesPerMonth} assinaturas</strong>/mês</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-200">
                        <HardDrive className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span><strong>{plano.limits.maxStorageGB} GB</strong> storage</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Agenda & Reservas por Diária</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Dossiê 360° do Locatário</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Vistorias fotográficas com câmera</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Ordens de Serviço & Manutenção</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Financeiro & Bolepix Inter</span>
                      </div>
                      {plano.features.gestaoProprietarios && (
                        <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                          <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>Gestão de Proprietários</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setAuthMode("register");
                      setShowAuthModal(true);
                    }}
                    className={`w-full mt-6 py-3 rounded-xl font-bold text-xs transition ${
                      plano.popular
                        ? "bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white shadow-lg shadow-indigo-500/25"
                        : "bg-slate-800 hover:bg-slate-700 text-white"
                    }`}
                  >
                    Começar Teste Grátis
                  </button>
                </div>
              );
            })}
          </div>

          {/* Plano Enterprise */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black border border-blue-500/20 uppercase tracking-wider">
                Operações de Grande Porte
              </span>
              <h3 className="text-xl font-black text-white mt-1">Plano Enterprise (60+ Imóveis)</h3>
              <p className="text-xs text-slate-400 max-w-xl mt-1">
                A partir de R$ 599/mês. Limites personalizados de imóveis, múltiplos condomínios, SLA dedicado e gerente de contas.
              </p>
            </div>

            <a
              href="https://wa.me/5587996540551?text=Ol%C3%A1!%20Gostaria%20de%20uma%20proposta%20personalizada%20do%20Plano%20Enterprise%20do%20IMOB."
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-2xl bg-white text-slate-950 font-black text-xs hover:bg-slate-200 transition shadow-lg shrink-0"
            >
              Falar com Consultor
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FAQ COMPLETO                                                           */}
      {/* ========================================================================= */}
      <section id="faq" className="py-20 sm:py-28 relative bg-[#090e1a]/40 border-y border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
              Tire Suas Dúvidas
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-indigo-400 transition"
                  >
                    <span>{item.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. CTA FINAL & FOOTER                                                     */}
      {/* ========================================================================= */}
      <section className="py-20 bg-gradient-to-b from-slate-950 via-[#0a1022] to-[#070b14] text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 relative z-10">
          <ImobLogo size="xl" showSubtitle={true} showTagline={true} className="items-center" />

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Pronto para profissionalizar a gestão dos seus imóveis?
          </h2>

          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Junte-se aos locadores e administradores que economizam horas por semana com a plataforma mais completa do mercado.
          </p>

          <div className="pt-2">
            <button
              onClick={() => {
                setAuthMode("register");
                setShowAuthModal(true);
              }}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-600 hover:from-indigo-400 hover:to-blue-500 text-white font-black text-sm shadow-2xl shadow-indigo-500/30 transition hover:scale-105"
            >
              Criar Minha Conta Grátis (7 Dias de Teste)
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">IMOB by PAJO Tecnologia</span>
            <span>• Todos os direitos reservados</span>
          </div>
          <div>
            <span>Versão Oficial: {SYSTEM_VERSION} • pajotecnologia.com.br</span>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL DE LOGIN / CADASTRO TRIAL ONBOARDING                                */}
      {/* ========================================================================= */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] my-auto overflow-y-auto">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400" />

            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <ImobLogo size="sm" showSubtitle={true} className="items-center mb-3" />
              <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setLoginError("");
                    setRegError("");
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                    authMode === "register" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Criar Conta Grátis
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setLoginError("");
                    setRegError("");
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                    authMode === "login" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Já Tenho Conta
                </button>
              </div>
            </div>

            {/* FORM LOGIN */}
            {authMode === "login" ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
                    {loginError}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">E-mail</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@empresa.com.br"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Senha</label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={loginSenha}
                      onChange={(e) => setLoginSenha(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-500/25 transition"
                >
                  {loginLoading ? "Entrando..." : "Acessar Plataforma"}
                </button>
              </form>
            ) : (
              /* FORM REGISTRO TRIAL */
              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-left">
                {regError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
                    {regError}
                  </div>
                )}
                {regSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center">
                    {regSuccess}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Nome da Empresa / Locador</label>
                  <input
                    type="text"
                    required
                    value={regNomeEmpresa}
                    onChange={(e) => setRegNomeEmpresa(e.target.value)}
                    placeholder="Ex: Prime Locações ou João Imóveis"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">CPF ou CNPJ</label>
                    <input
                      type="text"
                      required
                      value={regCnpj}
                      onChange={(e) => setRegCnpj(e.target.value.length > 14 ? formatCNPJ(e.target.value) : formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">WhatsApp</label>
                    <input
                      type="text"
                      required
                      value={regTelefone}
                      onChange={(e) => setRegTelefone(formatPhone(e.target.value))}
                      placeholder="(87) 99999-9999"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Seu Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={regNomeAdmin}
                    onChange={(e) => setRegNomeAdmin(e.target.value)}
                    placeholder="Administrador"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">E-mail Profissional</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="seuemail@empresa.com.br"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Crie uma Senha</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={regSenha}
                      onChange={(e) => setRegSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-2 text-slate-500 hover:text-slate-300"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-600 hover:from-indigo-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-indigo-500/25 transition"
                >
                  {regLoading ? "Criando conta..." : "Iniciar Teste Grátis de 7 Dias"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
