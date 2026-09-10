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
      q: "Posso cadastrar diferentes tipos de imóveis?",
      a: "Sim! O IMOB foi desenvolvido para gerenciar casas, apartamentos, flats, chácaras, sítios, espaços para eventos e imóveis residenciais ou comerciais com total flexibilidade.",
    },
    {
      q: "O sistema funciona para locação por temporada e diárias?",
      a: "Perfeitamente. O IMOB possui um módulo avançado de Agenda de Reservas com controle de calendário, check-in, check-out e geração de contratos e recibos por diária em 1 clique.",
    },
    {
      q: "Como funciona a vistoria fotográfica pelo celular?",
      a: "Você abre o checklist diretamente no celular ou tablet e pode acionar a câmera nativa com 1 toque, tirar fotos em alta resolução de cada cômodo/item e gerar o laudo pericial em PDF limpo e assinado.",
    },
    {
      q: "A assinatura digital tem validade jurídica?",
      a: "Sim. A assinatura digital do IMOB registra o endereço IP do locatário, carimbo de data/hora oficial e gera prova criptográfica imutável SHA-256 ancorada na blockchain pública via Bitcoin OpenTimestamps.",
    },
    {
      q: "Como funciona a integração com o WhatsApp?",
      a: "O IMOB envia os documentos oficiais diretamente anexados como arquivo .PDF (Contratos, Laudos de Vistoria, Recibos e Boletos Bancários com Pix) pelo WhatsApp do locatário sem precisar baixar nada manualmente.",
    },
    {
      q: "Posso emitir boletos bancários com QR Code Pix (Bolepix)?",
      a: "Sim. O sistema possui integração nativa com o Banco Inter (API v3), permitindo emitir boletos com Pix integrado e conciliação bancária automática por webhook.",
    },
    {
      q: "O que acontece se eu atingir o limite de imóveis do meu plano?",
      a: "O sistema avisa cordialmente que você atingiu a capacidade do plano e sugere o upgrade para o próximo nível. Você pode fazer o upgrade em segundos com liberação imediata via PIX.",
    },
    {
      q: "Se eu fizer downgrade de plano, meus dados são apagados?",
      a: "NUNCA. Seus imóveis, reservas, contratos, fotos de vistorias e histórico financeiro permanecem 100% seguros e preservados no banco de dados para sempre.",
    },
    {
      q: "Existe período de teste grátis (Trial)?",
      a: "Sim! Você pode criar sua conta gratuitamente e testar todos os recursos da plataforma por 7 dias sem precisar cadastrar cartão de crédito.",
    },
    {
      q: "Posso administrar imóveis de terceiros / múltiplos proprietários?",
      a: "Sim! A partir do Plano Profissional você conta com gestão de múltiplos proprietários, separação de imóveis e controle de repasses.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#020b08] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* ========================================================================= */}
      {/* 1. HEADER / NAVBAR                                                        */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 border-b border-emerald-950/80 bg-[#020b08]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Logo Oficial IMOB */}
          <Link href="/" className="hover:opacity-95 transition">
            <ImobLogo size="md" showSubtitle={true} showTagline={false} />
          </Link>

          {/* Navegação Desktop */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold text-slate-300">
            <a href="#fluxo" className="hover:text-emerald-400 transition">
              Como Funciona
            </a>
            <a href="#vistorias" className="hover:text-emerald-400 transition">
              Vistorias & Fotos
            </a>
            <a href="#whatsapp" className="hover:text-emerald-400 transition">
              WhatsApp Integrado
            </a>
            <a href="#financeiro" className="hover:text-emerald-400 transition">
              Financeiro & Bolepix
            </a>
            <a href="#planos" className="hover:text-emerald-400 transition">
              Planos & Preços
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition">
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
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition"
            >
              Entrar
            </button>

            <button
              onClick={() => {
                setAuthMode("register");
                setShowAuthModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02]"
            >
              Começar Grátis
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION COM HEADLINE FORTE & MOCKUPS REAIS                        */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Glows de Fundo Esmeralda */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-teal-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
          {/* Badge Topo */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold backdrop-blur-md shadow-lg shadow-emerald-500/10">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>A Plataforma Definitiva de Gestão de Locações</span>
          </div>

          {/* Headline Principal */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-5xl mx-auto leading-[1.12]">
            Administre seus imóveis sem planilhas, papelada e confusão no WhatsApp.
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Reservas, locatários, contratos inteligentes, assinatura digital com blockchain, vistorias fotográficas pelo celular e financeiro completo em uma única plataforma.
          </p>

          {/* CTAs Principais */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <button
              onClick={() => {
                setAuthMode("register");
                setShowAuthModal(true);
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 transition hover:scale-105"
            >
              <span>Começar Teste Grátis (7 Dias)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="https://wa.me/5587996540551?text=Ol%C3%A1!%20Gostaria%20de%20agendar%20uma%20demonstra%C3%A7%C3%A3o%20do%20sistema%20IMOB%20da%20PAJO%20Tecnologia."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-sm flex items-center justify-center gap-2 transition"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Agendar Demonstração</span>
            </a>
          </div>

          <div className="flex justify-center items-center gap-6 pt-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Sem cartão de crédito
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Setup instantâneo
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Suporte humanizado
            </span>
          </div>

          {/* MOCKUP VISUAL INTERATIVO DO SOFTWARE (DASHBOARD & MOBILE) */}
          <div className="pt-10 max-w-6xl mx-auto">
            <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 p-2 sm:p-4 shadow-2xl shadow-emerald-950/50 backdrop-blur-2xl">
              {/* Header da Janela SaaS */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 mb-4 text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-mono text-[11px] text-slate-500">imob.pajotech.com.br</span>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-black border border-emerald-800">
                    🟢 SISTEMA ATIVO • v{SYSTEM_VERSION}
                  </span>
                </div>
              </div>

              {/* Grid de Cards Simulando o Painel Real */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left p-2">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Flats & Casas</span>
                  <div className="text-2xl font-black text-white">24 Imóveis</div>
                  <span className="text-[10px] text-emerald-400 font-semibold">92% Taxa de Ocupação</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Locatários Ativos</span>
                  <div className="text-2xl font-black text-emerald-400">38 Clientes</div>
                  <span className="text-[10px] text-slate-400">Contratos com validade jurídica</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vistorias Realizadas</span>
                  <div className="text-2xl font-black text-teal-300">142 Laudos</div>
                  <span className="text-[10px] text-emerald-400 font-semibold">100% com Fotos & Assinatura</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Receita Mensal</span>
                  <div className="text-2xl font-black text-emerald-400">R$ 58.400,00</div>
                  <span className="text-[10px] text-slate-400">Conciliação Bolepix em tempo real</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PROVA / NÚMEROS                                                        */}
      {/* ========================================================================= */}
      <section className="py-12 border-y border-emerald-950/60 bg-[#03140e]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-white">+R$ 4.8M</div>
              <p className="text-xs text-slate-400">Em aluguéis e reservas administradas</p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400">100%</div>
              <p className="text-xs text-slate-400">Vistorias com fotos e validade jurídica</p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-teal-300">-85%</div>
              <p className="text-xs text-slate-400">Tempo gasto com papelada e cobranças</p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-white">Bitcoin</div>
              <p className="text-xs text-slate-400">Auditoria Blockchain OpenTimestamps</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. O PROBLEMA: "Sua operação ainda está espalhada?"                        */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-12">
          <div className="space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-rose-400">
              O Caos da Gestão Descentralizada
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Sua operação ainda está espalhada em 5 ferramentas diferentes?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Controlar imóveis usando papel, anotações soltas e conversas perdidas no WhatsApp gera prejuízo, inadimplência e dor de cabeça jurídica.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-rose-900/30 text-left space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-black">
                WA
              </div>
              <h3 className="font-black text-white text-sm">WhatsApp</h3>
              <p className="text-xs text-slate-400">Reservas perdidas em conversas e comprovantes misturados.</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/40 border border-rose-900/30 text-left space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-black">
                XLS
              </div>
              <h3 className="font-black text-white text-sm">Planilhas Excel</h3>
              <p className="text-xs text-slate-400">Fórmulas quebradas, falta de histórico e controle financeiro manual.</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/40 border border-rose-900/30 text-left space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-black">
                DOC
              </div>
              <h3 className="font-black text-white text-sm">Word & Impressão</h3>
              <p className="text-xs text-slate-400">Contratos lentos de redigir e locatários com dificuldade para assinar.</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/40 border border-rose-900/30 text-left space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-black">
                PAP
              </div>
              <h3 className="font-black text-white text-sm">Papel & Prancheta</h3>
              <p className="text-xs text-slate-400">Vistorias sem fotos comprovadas que geram discussões na saída.</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/40 border border-rose-900/30 text-left space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-black">
                CAL
              </div>
              <h3 className="font-black text-white text-sm">Agenda Física</h3>
              <p className="text-xs text-slate-400">Risco permanente de double-booking (reservas duplicadas no mesmo dia).</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/40 max-w-4xl mx-auto text-center space-y-2">
            <span className="text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
              A Solução Definitiva
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Com o IMOB, toda a sua operação fica centralizada em um só lugar.
            </h3>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. O FLUXO PRINCIPAL DO IMOB (8 PASSOS)                                   */}
      {/* ========================================================================= */}
      <section id="fluxo" className="py-20 sm:py-28 bg-[#03140e]/40 border-y border-emerald-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
              Fluxo Operacional de Ponta a Ponta
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Do primeiro contato ao encerramento da locação
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Um processo contínuo e blindado contra erros para sua imobiliária ou operação individual.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { num: "01", title: "Reserva", desc: "Bloqueio no calendário por diárias ou contrato mensal sem risco de conflito." },
              { num: "02", title: "Locatário", desc: "Cadastro do titular com máscara de CPF, RG e contato direto de WhatsApp." },
              { num: "03", title: "Contrato", desc: "Geração automática do modelo preenchido com valores, cláusulas e caução." },
              { num: "04", title: "Assinatura Digital", desc: "Link público seguro para o locatário assinar na tela pelo celular com IP e data." },
              { num: "05", title: "Check-in", desc: "Entrada liberada com registro de chaves e notificação pelo WhatsApp." },
              { num: "06", title: "Vistoria Fotográfica", desc: "Checklist com fotos pela câmera nativa e laudo pericial White Clean em PDF." },
              { num: "07", title: "Pagamento & Bolepix", desc: "Emissão de boletos Inter com Pix integrado e recibos instantâneos." },
              { num: "08", title: "Check-out & Histórico", desc: "Vistoria de saída, devolução de caução e preservação eterna do histórico." },
            ].map((step, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition space-y-2 relative"
              >
                <div className="text-3xl font-black text-emerald-500/40">{step.num}</div>
                <h3 className="text-base font-black text-white">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. VISTORIAS & CHECKLISTS COM FOTOS (GRANDE DESTAQUE)                    */}
      {/* ========================================================================= */}
      <section id="vistorias" className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <Camera className="w-4 h-4" />
                <span>Segurança Jurídica Absoluta</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Entregue e receba o imóvel com total segurança.
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Esqueça papel e discussões na devolução das chaves. O IMOB permite fazer o checklist completo diretamente no celular, fotografar cada detalhe com a câmera traseira nativa e gerar o laudo pericial em PDF limpo e assinado.
              </p>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block">Câmera Direta do Celular & Webcam ao Vivo</strong>
                    <span className="text-slate-400">Fotografe paredes, eletros, mobílias e detalhes sem travas de upload.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block">Link Público Interativo para o Locatário</strong>
                    <span className="text-slate-400">O cliente confere os itens, adiciona notas e assina digitalmente no próprio celular.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block">Laudo White Clean Universal em PDF</strong>
                    <span className="text-slate-400">PDF profissional de alta qualidade com logomarca, tabela de itens e fotos anexadas.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mockup Celular Vistoria */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl relative">
              <div className="max-w-xs mx-auto bg-slate-950 rounded-[40px] border-4 border-slate-800 p-4 shadow-2xl space-y-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-2">
                  <span>📱 Laudo de Entrada</span>
                  <span className="text-emerald-400">Flat 102</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span>Ar-condicionado Split</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black">OK</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span>Pintura das Paredes</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-black">Atenção</span>
                  </div>
                </div>

                {/* Foto Simulada */}
                <div className="p-2 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <div className="h-28 bg-emerald-950/40 rounded-xl flex flex-col items-center justify-center text-emerald-400 text-[10px] gap-1 border border-emerald-500/20">
                    <Camera className="w-6 h-6 text-emerald-400" />
                    <span>Foto Anexada em Alta Resolução</span>
                  </div>
                  <span className="text-[9px] text-slate-500">2 Fotos capturadas neste item</span>
                </div>

                {/* Assinatura no Celular */}
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                  <span className="text-[10px] text-emerald-300 font-bold block">✓ Assinado pelo Locatário</span>
                  <span className="text-[8px] text-slate-500 font-mono">IP: 189.40.122.9 • 09/09/2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. WHATSAPP EVOLUTION API (DISPARO DIRETO)                               */}
      {/* ========================================================================= */}
      <section id="whatsapp" className="py-20 sm:py-28 bg-[#03140e]/40 border-y border-emerald-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Mockup Chat */}
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl max-w-md mx-auto w-full space-y-3 font-sans text-xs">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white">
                  IM
                </div>
                <div>
                  <div className="font-bold text-white">IMOB Locações</div>
                  <div className="text-[10px] text-emerald-400">Atendimento Automático</div>
                </div>
              </div>

              {/* Bolhas de Mensagem */}
              <div className="p-3 rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <FileText className="w-4 h-4" />
                  <span>Contrato_Locacao_Flat102.pdf</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Olá, Carlos! Segue em anexo a cópia do seu contrato de locação assinado digitalmente.
                </p>
                <div className="p-2 rounded-xl bg-slate-950 text-[10px] text-blue-400 font-mono">
                  https://imob.pajotech.com.br/assinar/contrato/...
                </div>
              </div>

              <div className="p-3 rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <QrCode className="w-4 h-4" />
                  <span>Bolepix Inter • Vencimento 10/09</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Pix Copia e Cola gerado com sucesso. O recibo é emitido automaticamente após o pagamento.
                </p>
              </div>
            </div>

            {/* Texto */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <MessageSquare className="w-4 h-4" />
                <span>Comunicação Sem Fricção</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Continue atendendo pelo WhatsApp. O IMOB organiza sua operação.
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Envie contratos, recibos de aluguel, laudos de vistoria e boletos com Pix diretamente para o WhatsApp do locatário com 1 clique.
              </p>

              <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Envio direto de arquivos .PDF oficiais como mídia anexada</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Links seguros 100% clicáveis no celular (Android e iOS)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Integração via Evolution API com instância dedicada da sua empresa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FINANCEIRO & BOLEPIX BANCO INTER                                      */}
      {/* ========================================================================= */}
      <section id="financeiro" className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
              Controle Financeiro Rigoroso
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Saiba exatamente quanto cada imóvel realmente gera
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Contas a receber, contas a pagar, parcelamento automático, emissão de Bolepix e recibos White Clean.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Boleto com Pix (Bolepix)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Integração nativa com o Banco Inter (API v3). Emita boletos com QR Code Pix embutido e receba confirmação automática de pagamento.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Recibos White Clean PDF</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Geração instantânea de comprovantes limpos com logomarca da sua empresa, valor por extenso em BRL e envio imediato no WhatsApp.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Fluxo de Caixa & Despesas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lançamento de contas a pagar por fornecedor ou condomínio para você enxergar a rentabilidade líquida real de cada imóvel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 14. PARA QUEM É O IMOB                                                    */}
      {/* ========================================================================= */}
      <section className="py-16 bg-[#03140e]/30 border-y border-emerald-950/40">
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
              "🎉 Espaços para Eventos",
              "💼 Administradores de Imóveis",
              "🔑 Pequenas Imobiliárias",
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
      {/* 17. PLANOS & PREÇOS OFICIAIS                                              */}
      {/* ========================================================================= */}
      <section id="planos" className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 text-center">
          <div className="space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
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
                  className={`w-5 h-5 rounded-full bg-emerald-400 transition-transform duration-200 transform ${
                    billingCycle === "ANUAL" ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>

              <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === "ANUAL" ? "text-emerald-400" : "text-slate-500"}`}>
                <span>Cobrança Anual</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
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
                      ? "bg-slate-900/95 border-emerald-500 shadow-2xl shadow-emerald-500/10 ring-2 ring-emerald-500/40"
                      : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {plano.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
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
                        <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                          R$ {formatPrice(plano.priceYearlyTotal)} cobrado anualmente
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs mb-5">
                      <div className="flex items-center gap-2 text-slate-200">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Até <strong>{plano.limits.maxProperties} imóveis</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-200">
                        <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Até <strong>{plano.limits.maxUsers} usuário(s)</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-200">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span><strong>{plano.limits.maxSignaturesPerMonth} assinaturas</strong>/mês</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-200">
                        <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span><strong>{plano.limits.maxStorageGB} GB</strong> storage</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Reservas & Agenda de Diárias</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Vistorias fotográficas com câmera</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Envio de PDFs no WhatsApp</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Financeiro & Bolepix Inter</span>
                      </div>
                      {plano.features.gestaoProprietarios && (
                        <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
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
                        ? "bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20"
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
      {/* 18. COMPARATIVO COMPLETO DE PLANOS                                        */}
      {/* ========================================================================= */}
      <section className="py-16 bg-[#03140e]/40 border-y border-emerald-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Tabela Comparativa de Recursos
            </h2>
            <p className="text-xs text-slate-400">
              Confira detalhadamente as capacidades de cada plano do IMOB.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-3 px-4">Recurso / Capacidade</th>
                  <th className="py-3 px-4 text-center">Essencial</th>
                  <th className="py-3 px-4 text-center text-emerald-400">Profissional ⭐</th>
                  <th className="py-3 px-4 text-center">Gestão</th>
                  <th className="py-3 px-4 text-center">Empresarial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Imóveis Cadastrados</td>
                  <td className="py-3 px-4 text-center font-bold">Até 3</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-400">Até 10</td>
                  <td className="py-3 px-4 text-center font-bold">Até 30</td>
                  <td className="py-3 px-4 text-center font-bold">Até 60</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Usuários & Equipe</td>
                  <td className="py-3 px-4 text-center">1 usuário</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-semibold">3 usuários</td>
                  <td className="py-3 px-4 text-center">5 usuários</td>
                  <td className="py-3 px-4 text-center">10 usuários</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Assinaturas Digitais / Mês</td>
                  <td className="py-3 px-4 text-center">5 / mês</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-semibold">20 / mês</td>
                  <td className="py-3 px-4 text-center">50 / mês</td>
                  <td className="py-3 px-4 text-center">100 / mês</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Armazenamento de Fotos e Laudos</td>
                  <td className="py-3 px-4 text-center">2 GB</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-semibold">10 GB</td>
                  <td className="py-3 px-4 text-center">30 GB</td>
                  <td className="py-3 px-4 text-center">100 GB</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Vistorias Fotográficas com Câmera</td>
                  <td className="py-3 px-4 text-center text-emerald-400">✓ Incluído</td>
                  <td className="py-3 px-4 text-center text-emerald-400">✓ Incluído</td>
                  <td className="py-3 px-4 text-center text-emerald-400">✓ Incluído</td>
                  <td className="py-3 px-4 text-center text-emerald-400">✓ Incluído</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Envio de PDFs no WhatsApp</td>
                  <td className="py-3 px-4 text-center text-emerald-400">✓ Incluído</td>
                  <td className="py-3 px-4 text-center text-emerald-400">✓ Incluído</td>
                  <td className="py-3 px-4 text-center text-emerald-400">✓ Incluído</td>
                  <td className="py-3 px-4 text-center text-emerald-400">✓ Incluído</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Financeiro & Bolepix Inter</td>
                  <td className="py-3 px-4 text-center text-emerald-400">✓ Incluído</td>
                  <td className="py-3 px-4 text-center text-emerald-400">✓ Incluído</td>
                  <td className="py-3 px-4 text-center text-emerald-400">✓ Incluído</td>
                  <td className="py-3 px-4 text-center text-emerald-400">✓ Incluído</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Gestão de Proprietários & Repasses</td>
                  <td className="py-3 px-4 text-center text-slate-500">—</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-semibold">Até 5</td>
                  <td className="py-3 px-4 text-center">Até 20</td>
                  <td className="py-3 px-4 text-center">Até 50</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Nível de Suporte</td>
                  <td className="py-3 px-4 text-center">WhatsApp Padrão</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-semibold">Prioritário</td>
                  <td className="py-3 px-4 text-center">Prioritário</td>
                  <td className="py-3 px-4 text-center font-bold text-white">Gerente de Conta</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 19. FAQ COMPLETO                                                          */}
      {/* ========================================================================= */}
      <section id="faq" className="py-20 sm:py-28 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
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
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-emerald-400 transition"
                  >
                    <span>{item.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
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
      {/* 20. CTA FINAL & FOOTER                                                    */}
      {/* ========================================================================= */}
      <section className="py-20 bg-gradient-to-b from-slate-950 via-[#031c14] to-[#020b08] border-t border-emerald-950/60 text-center relative overflow-hidden">
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
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm shadow-2xl shadow-emerald-500/30 transition hover:scale-105"
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
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />

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
                    authMode === "register" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
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
                    authMode === "login" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition"
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
