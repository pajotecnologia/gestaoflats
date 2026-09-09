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
} from "lucide-react";
import { SYSTEM_VERSION } from "@/lib/version";
import { formatCNPJ, formatCPF, formatPhone } from "@/lib/validation";
import ImobLogo from "@/components/brand/ImobLogo";

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

  const [activeTabDemo, setActiveTabDemo] = useState<
    "vistorias" | "whatsapp" | "contratos" | "financeiro" | "blockchain"
  >("vistorias");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
          setConfig({
            diasTrialPadrao: data.config.diasTrialPadrao || 7,
            valorMensal: data.config.valorMensal || 97,
            valorTrimestral: data.config.valorTrimestral || 260,
            valorSemestral: data.config.valorSemestral || 490,
            valorAnual: data.config.valorAnual || 890,
            telefoneSuporteWhatsApp: data.config.telefoneSuporteWhatsApp || "(87) 99654-0551",
            chavePix: data.config.chavePix || "contato@pajotech.com.br",
          });
        }
      })
      .catch(() => {});
  }, []);

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setLoginError("");
    setRegError("");
    setRegSuccess("");
    setShowAuthModal(true);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, senha: loginSenha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao realizar login.");
      window.location.href = "/dashboard";
    } catch (err: any) {
      setLoginError(err.message);
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError("");
    setRegSuccess("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeEmpresa: regNomeEmpresa,
          cnpj: regCnpj,
          telefone: regTelefone,
          nome: regNomeAdmin,
          email: regEmail,
          senha: regSenha,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao criar conta.");
      setRegSuccess(`Conta criada com sucesso! Você ganhou ${config.diasTrialPadrao} dias de teste grátis.`);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (err: any) {
      setRegError(err.message);
      setRegLoading(false);
    }
  };

  const planos = [
    {
      nome: "Mensal",
      valor: config.valorMensal,
      periodo: "/mês",
      desc: "Ideal para começar sem fidelidade",
      destaque: false,
      badge: "Flexível",
      beneficios: [
        "Flats e Imóveis Ilimitados",
        "Vistorias com Fotos na Câmera/Webcam",
        "Disparo Direto no WhatsApp",
        "Contratos com Assinatura Digital",
        "Boleto com Pix (Bolepix) Banco Inter",
        "Controle Financeiro e Recibos em PDF",
      ],
    },
    {
      nome: "Trimestral",
      valor: config.valorTrimestral,
      periodo: "/trimestre",
      desc: "Economia e previsibilidade",
      destaque: false,
      badge: "Econômico",
      beneficios: [
        "Tudo do plano Mensal",
        "Economia de ~10% no período",
        "Agenda de Reservas por Diárias",
        "Carimbo de Autenticidade Blockchain",
        "Suporte Prioritário no WhatsApp",
      ],
    },
    {
      nome: "Semestral",
      valor: config.valorSemestral,
      periodo: "/semestre",
      desc: "Melhor custo-benefício para imobiliárias",
      destaque: true,
      badge: "MAIS ESCOLHIDO",
      beneficios: [
        "Tudo dos planos anteriores",
        "Economia de ~15%",
        "Acesso multiusuário para corretores",
        "Editor visual de contratos com tags",
        "Laudos de vistoria ilimitados em alta resolução",
        "Suporte VIP dedicado",
      ],
    },
    {
      nome: "Anual",
      valor: config.valorAnual,
      periodo: "/ano",
      desc: "Máxima economia e estabilidade total",
      destaque: false,
      badge: "Melhor Desconto",
      beneficios: [
        "Tudo liberado sem restrições",
        "Mais de 25% de desconto anual",
        "Treinamento e Onboarding guiado",
        "Backup contínuo e prioritário",
        "Garantia de atualização contínua",
      ],
    },
  ];

  const faqs = [
    {
      q: "Como funciona a vistoria com registro de fotos?",
      a: "Você pode realizar o checklist de entrada ou saída diretamente no celular ou tablet. O sistema permite acionar a câmera nativa do smartphone, capturar fotos ao vivo via webcam ou anexar da galeria. Cada foto fica vinculada ao respectivo cômodo (sala, quarto, cozinha, etc.) e é compilada automaticamente em um Laudo PDF pericial e profissional.",
    },
    {
      q: "As mensagens e PDFs são enviados direto pelo WhatsApp?",
      a: "Sim! O sistema integra-se de forma nativa com o WhatsApp. Com apenas 1 clique, você envia contratos de locação, laudos de vistoria com fotos, recibos com comprovante e mensagens de cobrança com chave Pix ou Bolepix (Boleto com QR Code Pix do Banco Inter) diretamente no celular do locatário.",
    },
    {
      q: "Como o locatário assina o contrato e a vistoria à distância?",
      a: "O sistema gera links públicos e seguros que você envia pelo WhatsApp. O locatário abre o documento no celular, revisa todas as cláusulas e fotos, e assina desenhando a assinatura na própria tela. Tudo é registrado com IP, data/hora e hash de segurança.",
    },
    {
      q: "O que é o carimbo de autenticidade Blockchain?",
      a: "Cada contrato ou laudo assinado gera uma assinatura criptográfica única (Hash SHA-256) que é ancorada na blockchain do Bitcoin via OpenTimestamps. Isso fornece prova jurídica incontestável de que o documento existia naquele exato segundo e jamais foi adulterado.",
    },
    {
      q: "Posso gerenciar tanto aluguéis mensais quanto diárias/temporada?",
      a: "Sim! O IMOB possui suporte completo a contratos por MESES (com geração automática de parcelas no Contas a Receber) e locações por DIAS (com Agenda de Reservas tipo calendário, cálculo automático de noites e parcela única).",
    },
    {
      q: "Preciso cadastrar cartão de crédito para testar?",
      a: "Não! O teste grátis é 100% livre de cartão. Você cria sua conta em 30 segundos e tem acesso a todos os recursos da plataforma.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      {/* 1. NAVBAR OFICIAL */}
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo Oficial IMOB */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 group-hover:scale-105 transition">
              <Building2 className="w-6 h-6" />
            </div>
            <ImobLogo size="md" showSubtitle={true} showTagline={false} />
          </Link>

          {/* Menu Desktop */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold text-slate-300">
            <a href="#vistorias" className="hover:text-emerald-400 transition flex items-center space-x-1">
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>Vistorias & Fotos</span>
            </a>
            <a href="#whatsapp" className="hover:text-emerald-400 transition flex items-center space-x-1">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Direto</span>
            </a>
            <a href="#funcionalidades" className="hover:text-emerald-400 transition">
              Recursos
            </a>
            <a href="#planos" className="hover:text-emerald-400 transition">
              Planos & Preços
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition">
              Dúvidas
            </a>
          </nav>

          {/* Ações / Botões Topo */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => openAuth("login")}
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-900 transition"
            >
              Já sou Cliente
            </button>
            <button
              onClick={() => openAuth("register")}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs hover:brightness-110 shadow-lg shadow-emerald-500/25 transition transform active:scale-95 flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Testar {config.diasTrialPadrao} Dias Grátis</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION COM IDENTIDADE VISUAL TEAL/ESMERALDA */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-950 via-[#04241d] to-slate-950">
        {/* Glows Decorativos de Fundo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[350px] bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-[300px] h-[300px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Tag Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-md shadow-emerald-500/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Ecossistema Imobiliário Completo • Versão {SYSTEM_VERSION}</span>
            </div>

            {/* Título Principal */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Gestão Inteligente de Imóveis, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Vistorias com Fotos & WhatsApp
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Elimine a burocracia das locações. Realize laudos de vistoria no celular com registro fotográfico, colete assinaturas digitais e envie cobranças e contratos em PDF diretamente pelo WhatsApp.
            </p>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => openAuth("register")}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm hover:brightness-110 shadow-xl shadow-emerald-500/30 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2.5"
              >
                <span>Começar Teste Grátis Agora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#vistorias"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-slate-200 font-bold text-sm hover:bg-slate-800 hover:text-white transition flex items-center justify-center space-x-2"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Ver Demonstração da Vistoria</span>
              </a>
            </div>

            {/* Destaques Rápidos */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-400">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Sem necessidade de cartão</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Configuração em 2 minutos</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Segurança & Carimbo Blockchain</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DESTAQUE PRINCIPAL 1: VISTORIAS & CHECKLIST COM FOTOS NA CÂMERA */}
      <section id="vistorias" className="py-20 border-t border-slate-900 bg-slate-950/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Texto Explicativo */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <Camera className="w-3.5 h-3.5" />
                <span>Tecnologia de Vistoria Pericial</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Laudos de Vistoria com Fotos na Câmera, Webcam & Assinatura Digital
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Esqueça pranchetas e papéis perdidos. Faça a checagem completa de cada cômodo direto no smartphone ou tablet com fotos comprobatórias em alta definição.
              </p>

              <div className="space-y-3.5">
                <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">📷 Câmera do Celular & Webcam Ao Vivo</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Acione a câmera traseira nativa no smartphone durante a vistoria ou use a webcam no notebook para registrar o estado de conservação na hora.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 shrink-0 mt-0.5">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">📑 Laudo em PDF Padronizado (White Clean)</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Geração instantânea de laudo pericial com logotipo da sua imobiliária, fotos organizadas por cômodos, itens OK/Atenção/Avaria e observações detalhadas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">🔗 Link Público Interativo para Assinar</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Envie o link pelo WhatsApp para o locatário assinar e anexar fotos pelo próprio celular à distância com validação de IP e hora.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mockup Interativo Visual da Vistoria */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl shadow-emerald-500/10">
                {/* Header Mockup */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      LV
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Laudo de Vistoria • Entrada</h4>
                      <p className="text-[11px] text-slate-400">Flat 102 - Residencial Mar • Inquilino: Carlos Lima</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    🟢 CONCLUÍDO
                  </span>
                </div>

                {/* Itens do Checklist */}
                <div className="py-4 space-y-3">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Pintura & Paredes (Sala)</span>
                      <span className="text-[11px] text-slate-400">Sem trincas, pintura nova branco neve</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ✓ OK
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Ar Condicionado Split (Quarto)</span>
                      <span className="text-[11px] text-slate-400">Controle remoto ok, gelando perfeitamente</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ✓ OK
                    </span>
                  </div>

                  {/* Grid de Fotos Mockup */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center space-x-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Registro Fotográfico Comprobatório (4 fotos)</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold">Câmera HD</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      <div className="h-14 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                        📷 Sala
                      </div>
                      <div className="h-14 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                        📷 Quarto
                      </div>
                      <div className="h-14 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                        📷 Cozinha
                      </div>
                      <div className="h-14 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                        📷 Banheiro
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quadro de Assinatura Digital Mockup */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-slate-300 font-semibold">Assinado Digitalmente no Celular</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Hash SHA-256 Validado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DESTAQUE PRINCIPAL 2: WHATSAPP INTEGRADO COM DISPARO DIRETO */}
      <section id="whatsapp" className="py-20 bg-gradient-to-b from-slate-950 via-[#031f18] to-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Mockup WhatsApp */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="rounded-3xl bg-[#0b141a] border border-emerald-950 p-4 sm:p-6 shadow-2xl shadow-emerald-500/10 space-y-3 font-sans">
                {/* Header Conversa */}
                <div className="flex items-center space-x-3 pb-3 border-b border-[#202c33]">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                    IM
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">IMOB • Notificações Automáticas</h4>
                    <p className="text-[11px] text-emerald-400 font-medium">Conta Oficial • Online</p>
                  </div>
                </div>

                {/* Balão 1: Contrato em PDF Anexado */}
                <div className="bg-[#005c4b] text-slate-100 p-3 rounded-2xl rounded-tr-none text-xs space-y-2 max-w-[85%] ml-auto">
                  <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-black/20">
                    <FileText className="w-6 h-6 text-emerald-300 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold block truncate">Contrato_Locacao_Flat102.pdf</span>
                      <span className="text-[10px] text-emerald-200">Documento Assinado • 1.2 MB</span>
                    </div>
                  </div>
                  <p>
                    Olá, Carlos! Segue anexa a sua via oficial do contrato de locação com validade jurídica.
                  </p>
                  <span className="text-[9px] text-emerald-200 block text-right">10:14 ✓✓</span>
                </div>

                {/* Balão 2: Cobrança com Bolepix e Pix Copia e Cola */}
                <div className="bg-[#005c4b] text-slate-100 p-3 rounded-2xl rounded-tr-none text-xs space-y-1.5 max-w-[85%] ml-auto">
                  <p className="font-bold">🔔 Lembrete de Aluguel - Vencimento Hoje</p>
                  <p>Valor: <strong>R$ 1.500,00</strong> • Flat 102</p>
                  <div className="p-2 rounded-lg bg-black/30 text-[10px] font-mono break-all text-emerald-300">
                    00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3...
                  </div>
                  <span className="text-[9px] text-emerald-200 block text-right">08:00 ✓✓</span>
                </div>
              </div>
            </div>

            {/* Texto Explicativo WhatsApp */}
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Automação & Comunicação Instantânea</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Disparo Direto no WhatsApp dos Inquilinos e Proprietários
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Sem links complicados ou e-mails que caem no spam. O IMOB envia os arquivos em formato PDF diretamente nas conversas do WhatsApp com 100% de taxa de abertura.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <FileBadge className="w-5 h-5 text-emerald-400 mb-2" />
                  <h4 className="font-bold text-sm text-white">Recibos Oficiais</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Envie o recibo oficial em PDF com comprovante assim que der a baixa do aluguel.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <QrCode className="w-5 h-5 text-teal-400 mb-2" />
                  <h4 className="font-bold text-sm text-white">Bolepix Banco Inter</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Boleto em PDF acompanhado da Linha Digitável e Pix Copia e Cola formatados.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. GRADE DE RECURSOS E FUNCIONALIDADES DO SISTEMA */}
      <section id="funcionalidades" className="py-20 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Tudo o que sua Gestão Imobiliária Precisa
            </h2>
            <p className="text-sm text-slate-400">
              Desenvolvido com foco em velocidade, facilidade operacional e segurança jurídica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300 space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Flats, Casas & Condomínios</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cadastre edifícios, números de apartamentos, mobília, fotos e status (Disponível, Ocupado ou Manutenção) com atualização automática.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300 space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Agenda de Diárias & Temporada</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Controle reservas curtas por diárias com calendário visual, cálculo automático de noites, bloqueio de períodos e parcela única no financeiro.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300 space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Editor Visual de Contratos</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Modelos de contrato 100% customizáveis com arrastar e soltar de tags dinâmicas (nome, cpf, imóvel, valor por extenso) e formatação A4.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300 space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Contas a Receber & Pagar</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gestão completa de recebimento de aluguéis e despesas com condomínio, energia, manutenção e fornecedores com relatórios de fluxo de caixa.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300 space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Central de Alertas em Tempo Real</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ícone flutuante inteligente que monitora e avisa sobre aluguéis atrasados, contratos prestes a expirar e check-ins do dia.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300 space-y-3 group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Carimbo Blockchain OpenTimestamps</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prova de autenticidade jurídica na rede Bitcoin para laudos e contratos, garantindo integridade documental incontestável.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TABELA DE PLANOS & PREÇOS */}
      <section id="planos" className="py-20 border-t border-slate-900 bg-gradient-to-b from-slate-950 via-[#031d16] to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <span>Planos Transparentes</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Escolha o Plano Ideal para o seu Negócio
            </h2>
            <p className="text-sm text-slate-400">
              Comece com {config.diasTrialPadrao} dias grátis e escolha o período mais vantajoso.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {planos.map((plano, index) => (
              <div
                key={index}
                className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${
                  plano.destaque
                    ? "bg-slate-900/95 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 md:-translate-y-2"
                    : "bg-slate-900/60 border border-slate-800 hover:border-slate-700"
                }`}
              >
                {plano.badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      plano.destaque
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {plano.badge}
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{plano.nome}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{plano.desc}</p>
                  </div>

                  <div className="flex items-baseline space-x-1 pt-2">
                    <span className="text-xs text-slate-400 font-bold">R$</span>
                    <span className="text-3xl sm:text-4xl font-black text-white">{plano.valor}</span>
                    <span className="text-xs text-slate-400">{plano.periodo}</span>
                  </div>

                  <ul className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-300">
                    {plano.beneficios.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => openAuth("register")}
                    className={`w-full py-3 rounded-xl font-bold text-xs transition transform active:scale-95 flex items-center justify-center space-x-1.5 ${
                      plano.destaque
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black hover:brightness-110 shadow-lg shadow-emerald-500/20"
                        : "bg-slate-800 hover:bg-slate-700 text-white"
                    }`}
                  >
                    <span>Começar Grátis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PERGUNTAS FREQUENTES (FAQ) */}
      <section id="faq" className="py-20 border-t border-slate-900 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Perguntas Frequentes
            </h2>
            <p className="text-sm text-slate-400">
              Tudo o que você precisa saber sobre o IMOB e a contratação.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-sm font-bold text-white hover:text-emerald-400 transition"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. FOOTER OFICIAL COM BRANDING IMOB */}
      <footer className="py-12 border-t border-slate-900 bg-slate-950 text-xs text-slate-400 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo e Slogan no Rodapé */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <ImobLogo size="md" showSubtitle={true} showTagline={true} />
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Versão Oficial: {SYSTEM_VERSION}</span>
            </span>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p>
              Desenvolvido por{" "}
              <a
                href="https://pajotecnologia.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 font-bold hover:underline"
              >
                PAJO Tecnologia
              </a>{" "}
              • Suporte: (87) 99654-0551
            </p>
            <p className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} IMOB. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* 9. MODAL DE LOGIN / CADASTRO TRIAL RÁPIDO */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Fechar Modal */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Modal */}
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-1">
                <ImobLogo size="sm" showSubtitle={true} showTagline={false} />
              </div>
              <h3 className="text-xl font-bold text-white">
                {authMode === "register" ? `Comece seu Teste de ${config.diasTrialPadrao} Dias` : "Acessar Sistema"}
              </h3>
              <p className="text-xs text-slate-400">
                {authMode === "register"
                  ? "Sem taxa de adesão e sem necessidade de cartão de crédito."
                  : "Informe suas credenciais para gerenciar seus imóveis."}
              </p>
            </div>

            {/* Alternador de Abas do Modal */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className={`py-2 rounded-xl transition ${
                  authMode === "register" ? "bg-emerald-500 text-slate-950 font-black shadow-md" : "text-slate-400"
                }`}
              >
                Criar Conta Grátis
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`py-2 rounded-xl transition ${
                  authMode === "login" ? "bg-emerald-500 text-slate-950 font-black shadow-md" : "text-slate-400"
                }`}
              >
                Já Tenho Conta
              </button>
            </div>

            {/* FORMULÁRIO DE CADASTRO */}
            {authMode === "register" ? (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {regError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                    {regError}
                  </div>
                )}
                {regSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                    {regSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nome da Imobiliária / Negócio</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Prime Locações Imobiliárias"
                    value={regNomeEmpresa}
                    onChange={(e) => setRegNomeEmpresa(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">CNPJ / CPF</label>
                    <input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      value={regCnpj}
                      onChange={(e) => setRegCnpj(formatCNPJ(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp com DDD</label>
                    <input
                      type="text"
                      required
                      placeholder="(87) 99999-9999"
                      value={regTelefone}
                      onChange={(e) => setRegTelefone(formatPhone(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Seu Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do Administrador"
                    value={regNomeAdmin}
                    onChange={(e) => setRegNomeAdmin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">E-mail de Acesso</label>
                  <input
                    type="email"
                    required
                    placeholder="seuemail@imobiliaria.com.br"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Senha Segura</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      placeholder="Mínimo 6 dígitos"
                      value={regSenha}
                      onChange={(e) => setRegSenha(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs hover:brightness-110 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                >
                  {regLoading ? "Criando Conta..." : `Criar Conta & Liberar ${config.diasTrialPadrao} Dias`}
                </button>
              </form>
            ) : (
              /* FORMULÁRIO DE LOGIN */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    placeholder="seuemail@imobiliaria.com.br"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Senha</label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      placeholder="Sua senha de acesso"
                      value={loginSenha}
                      onChange={(e) => setLoginSenha(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs hover:brightness-110 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                >
                  {loginLoading ? "Entrando..." : "Entrar no Sistema"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
