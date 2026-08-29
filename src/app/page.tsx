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
} from "lucide-react";
import { SYSTEM_VERSION } from "@/lib/version";

interface SaasConfig {
  diasTrialPadrao: number;
  valorMensal: number;
  valorTrimestral: number;
  valorSemestral: number;
  valorAnual: number;
  telefoneSuporteWhatsApp: string;
}

export default function LandingPage() {
  const [config, setConfig] = useState<SaasConfig>({
    diasTrialPadrao: 7,
    valorMensal: 97,
    valorTrimestral: 260,
    valorSemestral: 490,
    valorAnual: 890,
    telefoneSuporteWhatsApp: "(87) 99654-0551",
  });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "Como funciona o período de teste grátis?",
      a: `Você se cadastra em menos de 1 minuto e ganha ${config.diasTrialPadrao} dias de acesso total e irrestrito a todas as funcionalidades do sistema, sem necessidade de cartão de crédito.`,
    },
    {
      q: "Os contratos e laudos emitidos possuem validade jurídica?",
      a: "Sim! Os contratos e laudos de vistoria são gerados no padrão White Clean Universal, contêm assinaturas digitais, carimbo de data/hora e fotos com resolução otimizada, ideais para segurança jurídica de locador e locatário.",
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
      {/* Background Decorativo */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none -z-10" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none -z-10" />

      {/* NAVBAR FIXA */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-white text-base tracking-tight block leading-tight">
                Gestão de Flats
              </span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">
                SaaS Imobiliário
              </span>
            </div>
          </Link>

          {/* Links Centrais (Desktop) */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-300">
            <a href="#recursos" className="hover:text-blue-400 transition">
              Recursos
            </a>
            <a href="#vistorias" className="hover:text-blue-400 transition">
              Vistorias & Câmera
            </a>
            <a href="#whatsapp" className="hover:text-blue-400 transition">
              WhatsApp
            </a>
            <a href="#planos" className="hover:text-blue-400 transition">
              Planos & Preços
            </a>
            <a href="#faq" className="hover:text-blue-400 transition">
              Dúvidas
            </a>
          </nav>

          {/* Botões de Ação */}
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700/80 transition flex items-center space-x-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Já sou Cliente</span>
            </Link>

            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition hover:scale-105 active:scale-95 items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Testar {config.diasTrialPadrao} Dias Grátis</span>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Glow Central */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/15 blur-3xl rounded-full pointer-events-none -z-10" />

        {/* Badge do Topo */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold mb-6 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Plataforma Completa para Gestão de Locações e Flats</span>
        </div>

        {/* Título Principal */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight md:leading-tight">
          Simplifique seus Contratos, Vistorias e Cobranças no{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300">
            WhatsApp
          </span>
        </h1>

        {/* Subtítulo */}
        <p className="mt-6 text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          O sistema definitivo para administradores de flats, condomínios e imóveis por temporada. Emita contratos, realize vistorias fotográficas com a câmera do celular e envie recibos automáticos.
        </p>

        {/* CTAs do Hero */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 transition hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>Começar Teste Grátis ({config.diasTrialPadrao} Dias)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#recursos"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm transition flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4 text-blue-400" />
            <span>Ver Funcionalidades</span>
          </a>
        </div>

        {/* Micro-Badges de Confiança */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Sem necessidade de cartão para testar</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Setup instantâneo em 1 minuto</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp e PDFs ilimitados</span>
          </div>
        </div>

        {/* Mockup / Card Visual de Destaque */}
        <div className="mt-14 relative max-w-5xl mx-auto rounded-3xl p-1 bg-gradient-to-b from-blue-500/30 via-slate-800/40 to-transparent shadow-2xl">
          <div className="bg-slate-900/90 rounded-[22px] p-6 md:p-8 border border-slate-800 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-slate-400 ml-2">painel.gestaoflats.pajotech.com.br</span>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold">
                ✓ Sistema 100% Operacional
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium block">Ocupação Atual</span>
                <span className="text-2xl font-black text-white mt-1 block">88.5%</span>
                <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">↑ +14% neste mês</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium block">Contratos Ativos</span>
                <span className="text-2xl font-black text-white mt-1 block">24 Unidades</span>
                <span className="text-[11px] text-blue-400 font-semibold mt-1 block">Meses e Temporadas</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium block">Recibos & WhatsApp</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">100% Automático</span>
                <span className="text-[11px] text-slate-400 font-semibold mt-1 block">Disparo de PDF com 1 clique</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 1: RECURSOS EM DESTAQUE */}
      <section id="recursos" className="py-20 bg-slate-900/40 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
              Recursos Especializados
            </h2>
            <p className="text-2xl sm:text-4xl font-extrabold text-white">
              Tudo o que você precisa para gerenciar seus flats sem planilhas confusas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Contratos Inteligentes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Emita contratos residenciais (meses) ou por temporada (diárias). Mapeamento automático de locatário, imóvel, valores por extenso e validade jurídica.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Vistorias com Fotos na Câmera</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Checklists completos de entrada e saída. Use a câmera nativa do smartphone, webcam ao vivo no computador e colete assinatura na tela.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">WhatsApp Integrado (Evolution)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Envie PDFs anexados de contratos, laudos de vistoria, cobranças e recibos de pagamento diretamente no WhatsApp dos seus locatários.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Financeiro & Recibos Oficiais</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Contas a receber e a pagar integradas aos contratos. Baixa de parcelas com comprovantes e geração de recibos em PDF no padrão White Clean.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Condomínios & Flats</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Organize seus imóveis por edifícios e condomínios. Acompanhe fotos do flat, descrição de mobília, status de disponibilidade e manutenção.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Multi-Tenant Isolado & Seguro</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ambiente 100% isolado por empresa. Seus dados, modelos, clientes e operadores ficam estritamente protegidos com segurança avançada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: VISTORIAS COM FOTOS & CÂMERA */}
      <section id="vistorias" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Laudos Fotográficos de Entrada e Saída
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Elimine discussões e avarias com laudos de vistoria perfeitos
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Durante o check-in ou check-out do hóspede/inquilino, abra o sistema no smartphone e fotografe cada cômodo em segundos.
            </p>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start space-x-3">
                <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <span><strong>📷 Câmera Direta</strong>: Acione a câmera traseira do smartphone na hora da vistoria.</span>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <span><strong>📹 Webcam Ao Vivo</strong>: Capture imagens em tempo real usando a webcam do notebook.</span>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <span><strong>✍️ Assinatura na Tela</strong>: O inquilino assina com o dedo no celular ou pelo link público.</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" /> Laudo de Entrada — Flat 204
              </span>
              <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-bold">
                Assinado Digitalmente
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Pintura e Paredes</span>
                  <span className="text-[11px] text-slate-400">Pintura nova cor branca, sem furos.</span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  OK
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Ar Condicionado Split</span>
                  <span className="text-[11px] text-slate-400">Controle remoto testado e higienizado.</span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  OK
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Cama Box & Enxoval</span>
                  <span className="text-[11px] text-slate-400">Pequena mancha no lado esquerdo do colchão.</span>
                </div>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                  Atenção
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: PLANOS E PREÇOS */}
      <section id="planos" className="py-20 bg-slate-900/40 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Planos Acessíveis & Transparentes
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Escolha o Plano Ideal para a sua Empresa
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            Sem taxas ocultas, sem fidelidade e com todos os recursos liberados desde o primeiro dia de teste.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 text-left">
            {/* Mensal */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Mensal</span>
                <h3 className="text-xl font-bold text-white mt-1">Plano Mensal</h3>
                <p className="text-xs text-slate-400 mt-1">Flexibilidade mês a mês</p>
                <div className="mt-6">
                  <span className="text-3xl font-black text-white">{formatBRL(config.valorMensal)}</span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" /> Flats & Contratos Ilimitados
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" /> Vistorias com Câmera e Fotos
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" /> Envio WhatsApp Ilimitado
                  </li>
                </ul>
              </div>

              <Link
                href="/login"
                className="mt-8 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold text-center block transition"
              >
                Testar Grátis {config.diasTrialPadrao} Dias
              </Link>
            </div>

            {/* Trimestral */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Trimestral</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                    -10% OFF
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">3 Meses</h3>
                <p className="text-xs text-slate-400 mt-1">Pagamento a cada 3 meses</p>
                <div className="mt-6">
                  <span className="text-3xl font-black text-white">{formatBRL(config.valorTrimestral)}</span>
                  <span className="text-xs text-slate-400">/trimestre</span>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 3 meses garantidos
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Todos os recursos inclusos
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Suporte Prioritário
                  </li>
                </ul>
              </div>

              <Link
                href="/login"
                className="mt-8 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold text-center block transition"
              >
                Testar Grátis {config.diasTrialPadrao} Dias
              </Link>
            </div>

            {/* Semestral */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Semestral</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                    -15% OFF
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">6 Meses</h3>
                <p className="text-xs text-slate-400 mt-1">6 meses de tranquilidade</p>
                <div className="mt-6">
                  <span className="text-3xl font-black text-white">{formatBRL(config.valorSemestral)}</span>
                  <span className="text-xs text-slate-400">/semestre</span>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 6 meses de acesso total
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Backup Nuvem Automático
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Suporte WhatsApp Direto
                  </li>
                </ul>
              </div>

              <Link
                href="/login"
                className="mt-8 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold text-center block transition"
              >
                Testar Grátis {config.diasTrialPadrao} Dias
              </Link>
            </div>

            {/* Anual */}
            <div className="bg-gradient-to-b from-blue-950/70 to-slate-900 border-2 border-blue-500 rounded-3xl p-6 flex flex-col justify-between relative shadow-2xl shadow-blue-500/20">
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow">
                ★ Mais Popular
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase">Anual</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                    -25% OFF
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">12 Meses</h3>
                <p className="text-xs text-slate-400 mt-1">1 ano inteiro de economia</p>
                <div className="mt-6">
                  <span className="text-3xl font-black text-amber-400">{formatBRL(config.valorAnual)}</span>
                  <span className="text-xs text-slate-400">/ano</span>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" /> 12 meses de acesso VIP
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" /> Todas as futuras atualizações
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" /> Atendimento Exclusivo
                  </li>
                </ul>
              </div>

              <Link
                href="/login"
                className="mt-8 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black text-center block shadow-lg shadow-blue-600/30 transition hover:scale-105"
              >
                Testar Grátis {config.diasTrialPadrao} Dias
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 4: FAQ (DÚVIDAS FREQUENTES) */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Perguntas Frequentes</span>
          <h2 className="text-3xl font-extrabold text-white mt-1">Tire suas dúvidas</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden transition"
            >
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

      {/* CTA FINAL */}
      <section className="py-16 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-t border-slate-800 text-center px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Pronto para profissionalizar a gestão dos seus flats?
          </h2>
          <p className="text-sm text-slate-400">
            Cadastre-se agora mesmo e aproveite seus {config.diasTrialPadrao} dias de teste gratuito com todas as funções liberadas.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition hover:scale-105 active:scale-95"
            >
              Criar Conta e Testar Grátis
            </Link>
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-sm hover:text-white transition"
            >
              Acessar Painel do Cliente
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-slate-900 bg-slate-950 text-xs text-slate-400 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">
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
    </div>
  );
}
