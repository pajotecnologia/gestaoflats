"use client";

import React, { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import { formatCurrency, formatPhone, formatMesReferencia } from "@/lib/validation";
import Link from "next/link";
import {
  Users,
  Building2,
  TrendingUp,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  FileCheck,
  RefreshCw,
  Sun,
  KeyRound,
  Percent,
  Wallet,
  Landmark,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  BarChart3,
  CreditCard,
  Briefcase,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"inadimplencias" | "contratos" | "diarias" | "repasses" | "vistorias">("inadimplencias");

  const loadStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/dashboard/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Erro ao carregar estatísticas:", err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[65vh]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Carregando painel e indicadores analíticos...</p>
          </div>
        </div>
      </Shell>
    );
  }

  const kpis = stats?.kpis || {};
  const alertas = stats?.alertas || {};
  const historico = stats?.historicoSemestral || [];
  const locais = stats?.locaisPerformance || [];
  const formasPagamento = stats?.formasPagamento || [];
  const despesasCategorias = stats?.despesasCategorias || [];

  // Calcular valor máximo no histórico semestral para normalizar gráfico de barras
  const maxHistorico = Math.max(
    ...historico.map((h: any) => Math.max(h.receitas || 0, h.despesas || 0)),
    1000
  );

  return (
    <Shell>
      <div className="space-y-6 pb-10">
        {/* Cabeçalho Principal do Dashboard */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-zinc-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                Painel de Controle & Inteligência Operacional
              </h1>
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-800/80 shadow-xs">
                Analytics Pro
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Visão 360° em tempo real de ocupação, faturamento, despesas, repasses e previsibilidade de caixa.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => loadStats(true)}
              disabled={refreshing}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all duration-200 flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-500" : ""}`} />
              <span>{refreshing ? "Atualizando..." : "Atualizar"}</span>
            </button>

            <Link
              href="/relatorios"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white transition-all duration-200 flex items-center space-x-1.5 shadow-lg shadow-indigo-500/20"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Emitir Relatórios</span>
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BLOCO 1: CARDS EXECUTIVOS DE KPI (5 CARDS MODERNOS COM DETALHES RICOS) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Taxa de Ocupação & Imóveis */}
          <div className="bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-4 space-y-3 shadow-lg shadow-black/5 dark:shadow-black/20 hover:border-slate-300 dark:hover:border-zinc-700/80 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Ocupação de Imóveis</span>
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900 dark:text-zinc-100">{kpis.taxaOcupacao || 0}%</span>
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  ({kpis.flatsOcupados || 0}/{kpis.totalFlats || 0} flats)
                </span>
              </div>
              {/* Barra de Progresso de Ocupação */}
              <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden flex">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${kpis.taxaOcupacao || 0}%` }}
                />
              </div>
            </div>
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800/80">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">🟢 {kpis.flatsDisponiveis || 0} livres</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">🟡 {kpis.flatsManutencao || 0} manut.</span>
            </div>
          </div>

          {/* Card 2: Recebimentos do Mês */}
          <div className="bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-4 space-y-3 shadow-lg shadow-black/5 dark:shadow-black/20 hover:border-slate-300 dark:hover:border-zinc-700/80 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Receitas Realizadas</span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(kpis.totalRecebidoMes || 0)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                Previsto: <strong className="text-slate-700 dark:text-zinc-200">{formatCurrency(kpis.totalReceberMes || 0)}</strong>
              </p>
            </div>
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800/80">
              <span>Eficiência: <strong className="text-zinc-200">{kpis.taxaEficienciaCobranca || 0}%</strong></span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">{formatCurrency(kpis.totalEmAbertoReceber || 0)} a rec.</span>
            </div>
          </div>

          {/* Card 3: Despesas Pagas */}
          <div className="bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-4 space-y-3 shadow-lg shadow-black/5 dark:shadow-black/20 hover:border-slate-300 dark:hover:border-zinc-700/80 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Despesas Operacionais</span>
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400">
                {formatCurrency(kpis.totalPagoMes || 0)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                Previsto: <strong className="text-slate-700 dark:text-zinc-200">{formatCurrency(kpis.totalPagarMes || 0)}</strong>
              </p>
            </div>
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800/80">
              <span>A Pagar: <strong className="text-rose-600 dark:text-rose-400">{formatCurrency(kpis.totalEmAbertoPagar || 0)}</strong></span>
            </div>
          </div>

          {/* Card 4: Saldo Operacional Líquido */}
          <div className="bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-4 space-y-3 shadow-lg shadow-black/5 dark:shadow-black/20 hover:border-slate-300 dark:hover:border-zinc-700/80 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Lucro Líquido do Mês</span>
              <div
                className={`p-2 rounded-xl border ${
                  kpis.saldoOperacionalLiquido >= 0
                    ? "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-500/20"
                    : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20"
                }`}
              >
                {kpis.saldoOperacionalLiquido >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
              </div>
            </div>
            <div>
              <div
                className={`text-xl font-black ${
                  kpis.saldoOperacionalLiquido >= 0
                    ? "text-teal-600 dark:text-teal-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(kpis.saldoOperacionalLiquido || 0)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                Margem Líquida: <strong className="text-slate-700 dark:text-zinc-200">{kpis.margemLucro || 0}%</strong>
              </p>
            </div>
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800/80">
              <span>Receitas vs Despesas</span>
              <span className={`font-bold ${kpis.saldoOperacionalLiquido >= 0 ? "text-teal-600 dark:text-teal-400" : "text-rose-500"}`}>
                {kpis.saldoOperacionalLiquido >= 0 ? "Positivo" : "Déficit"}
              </span>
            </div>
          </div>

          {/* Card 5: Repasses a Proprietários & Comissões */}
          <div className="bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-4 space-y-3 shadow-lg shadow-black/5 dark:shadow-black/20 hover:border-slate-300 dark:hover:border-zinc-700/80 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Repasses & Comissões</span>
              <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl font-black text-violet-600 dark:text-violet-400">
                {formatCurrency(kpis.totalRepassesLiquidoMes || 0)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                Comissão Imob: <strong className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(kpis.totalComissaoImobiliariaMes || 0)}</strong>
              </p>
            </div>
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800/80">
              <span>{formatCurrency(kpis.totalRepassesPendentesMes || 0)} pendente</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(kpis.totalRepassesPagosMes || 0)} quitado</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BLOCO 2: SEGUNDA LINHA DE INDICADORES RÁPIDOS (MINI-KPIs) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-zinc-900/70 border border-slate-200/70 dark:border-zinc-800/80 shadow-xs flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Locatários Ativos</span>
              <span className="text-base font-bold text-slate-900 dark:text-zinc-100">
                {kpis.totalLocatariosAtivos || 0} <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal">/ {kpis.totalLocatarios || 0}</span>
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 dark:bg-zinc-900/70 border border-slate-200/70 dark:border-zinc-800/80 shadow-xs flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Contratos Vigentes</span>
              <span className="text-base font-bold text-slate-900 dark:text-zinc-100">{kpis.totalContratosAtivos || 0}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 dark:bg-zinc-900/70 border border-slate-200/70 dark:border-zinc-800/80 shadow-xs flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Cauções Custodiadas</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(kpis.totalCaucaoCustodia || 0)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 dark:bg-zinc-900/70 border border-slate-200/70 dark:border-zinc-800/80 shadow-xs flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Flats por Diária</span>
              <span className="text-base font-bold text-slate-900 dark:text-zinc-100">
                {(kpis.flatsDiaria || 0) + (kpis.flatsAmbos || 0)} <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal">unidades</span>
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 dark:bg-zinc-900/70 border border-slate-200/70 dark:border-zinc-800/80 shadow-xs flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Proprietários</span>
              <span className="text-base font-bold text-slate-900 dark:text-zinc-100">{kpis.totalProprietarios || 0}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 dark:bg-zinc-900/70 border border-slate-200/70 dark:border-zinc-800/80 shadow-xs flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Inadimplência Total</span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">
                {formatCurrency(kpis.totalInadimplenteGeral || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BLOCO 3: GRÁFICO DE EVOLUÇÃO SEMESTRAL & PERFORMANCE POR LOCAL */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico 1: Evolução Financeira Semestral */}
          <div className="lg:col-span-2 bg-zinc-900/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-zinc-100 text-sm">
                  Evolução Financeira Semestral (Últimos 6 Meses)
                </h3>
              </div>
              <div className="flex items-center space-x-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50 inline-block" /> Receitas
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50 inline-block" /> Despesas
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-xs shadow-indigo-500/50 inline-block" /> Lucro Líquido
                </span>
              </div>
            </div>

            {/* Barras do Gráfico */}
            <div className="grid grid-cols-6 gap-2 sm:gap-4 pt-6 pb-2 items-end min-h-[190px]">
              {historico.map((item: any) => {
                const recHeight = Math.max(8, Math.round(((item.receitas || 0) / maxHistorico) * 130));
                const pagHeight = Math.max(8, Math.round(((item.despesas || 0) / maxHistorico) * 130));

                return (
                  <div key={item.mes} className="flex flex-col items-center space-y-2 group">
                    <div className="flex items-end space-x-1 sm:space-x-1.5 h-[135px]">
                      {/* Barra Receita */}
                      <div className="relative flex flex-col items-center">
                        <div
                          className="w-2.5 sm:w-4 bg-emerald-500 rounded-t-sm transition-all duration-300 group-hover:bg-emerald-400 group-hover:shadow-lg group-hover:shadow-emerald-500/30"
                          style={{ height: `${recHeight}px` }}
                        />
                      </div>
                      {/* Barra Despesa */}
                      <div className="relative flex flex-col items-center">
                        <div
                          className="w-2.5 sm:w-4 bg-rose-500 rounded-t-sm transition-all duration-300 group-hover:bg-rose-400 group-hover:shadow-lg group-hover:shadow-rose-500/30"
                          style={{ height: `${pagHeight}px` }}
                        />
                      </div>
                    </div>
                    {/* Rótulo do Mês */}
                    <div className="text-center">
                      <span className="text-[11px] font-bold text-zinc-300 block">
                        {item.label}
                      </span>
                      <span className={`text-[10px] font-semibold block ${item.lucroLiquido >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {formatCurrency(item.lucroLiquido || 0)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-800/80">
              <span>* Valores calculados com base nos pagamentos e despesas liquidadas em cada período.</span>
            </div>
          </div>

          {/* Gráfico 2: Desempenho por Local / Condomínio */}
          <div className="bg-zinc-900/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <PieChart className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-zinc-100 text-sm">
                  Ocupação por Condomínio
                </h3>
              </div>
              <span className="text-[11px] font-medium text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700/50">{locais.length} locais</span>
            </div>

            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
              {locais.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-8">Nenhum condomínio cadastrado.</p>
              ) : (
                locais.map((loc: any) => (
                  <div key={loc.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-200 truncate max-w-[150px]">
                        {loc.nome}
                      </span>
                      <span className="font-semibold text-zinc-400">
                        {loc.flatsOcupados} de {loc.totalFlats} ({loc.taxaOcupacao}%)
                      </span>
                    </div>
                    <div className="w-full bg-zinc-950/80 rounded-full h-2 overflow-hidden flex border border-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          loc.taxaOcupacao >= 75
                            ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                            : loc.taxaOcupacao >= 40
                            ? "bg-cyan-500 shadow-sm shadow-cyan-500/50"
                            : "bg-amber-500 shadow-sm shadow-amber-500/50"
                        }`}
                        style={{ width: `${loc.taxaOcupacao}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BLOCO 4: DISTRIBUIÇÃO DE FORMAS DE PAGAMENTO & DESPESAS POR CATEGORIA */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Card Formas de Pagamento */}
          <div className="bg-zinc-900/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-zinc-100 text-sm">
                  Meios de Pagamento Utilizados
                </h3>
              </div>
              <span className="text-[11px] font-medium text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700/50">Mês Atual</span>
            </div>

            <div className="space-y-3">
              {formasPagamento.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">Nenhum pagamento liquidado no mês.</p>
              ) : (
                formasPagamento.map((item: any) => (
                  <div key={item.forma} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-300">
                        {item.forma === "PIX" ? "⚡ PIX" : item.forma === "BOLETO" ? "📄 Boleto Bancário" : item.forma === "CARTAO" ? "💳 Cartão de Crédito" : item.forma === "DINHEIRO" ? "💵 Dinheiro" : "🏦 Transferência"} ({item.qtd}x)
                      </span>
                      <span className="font-bold text-zinc-100">
                        {formatCurrency(item.total)} <span className="text-[10px] text-zinc-400 font-normal">({item.percentual}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-zinc-950/80 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-xs shadow-emerald-500/50"
                        style={{ width: `${item.percentual}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card Despesas por Categoria */}
          <div className="bg-zinc-900/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-zinc-100 text-sm">
                  Despesas por Categoria
                </h3>
              </div>
              <span className="text-[11px] font-medium text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700/50">Mês Atual</span>
            </div>

            <div className="space-y-3">
              {despesasCategorias.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">Nenhuma despesa paga no mês.</p>
              ) : (
                despesasCategorias.map((item: any) => (
                  <div key={item.categoria} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-300">
                        {item.categoria}
                      </span>
                      <span className="font-bold text-rose-400">
                        {formatCurrency(item.total)} <span className="text-[10px] text-zinc-400 font-normal">({item.percentual}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-zinc-950/80 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-500 shadow-xs shadow-rose-500/50"
                        style={{ width: `${item.percentual}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BLOCO 5: PAINEL DE ALERTAS & LISTAGENS OPERACIONAIS COM TABS INTERATIVAS */}
        {/* ========================================================================= */}
        <div className="bg-zinc-900/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 space-y-5 shadow-xl">
          {/* Navegação de Abas do Painel Operacional */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 flex-wrap gap-2">
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full scrollbar-thin scrollbar-thumb-zinc-700">
              <button
                onClick={() => setActiveTab("inadimplencias")}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === "inadimplencias"
                    ? "bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-md shadow-rose-500/10"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Inadimplências ({alertas.inadimplencias?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("contratos")}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === "contratos"
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/10"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Contratos a Vencer ({alertas.contratosVencendo?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("diarias")}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === "diarias"
                    ? "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 shadow-md shadow-yellow-500/10"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Temporada / Diárias ({alertas.diariasProximas?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("repasses")}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === "repasses"
                    ? "bg-violet-500/15 text-violet-300 border border-violet-500/30 shadow-md shadow-violet-500/10"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent"
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>Repasses Pendentes ({alertas.repassesPendentes?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("vistorias")}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === "vistorias"
                    ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-md shadow-indigo-500/10"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent"
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Últimas Vistorias</span>
              </button>
            </div>
          </div>

          {/* Conteúdo da Aba 1: Inadimplências */}
          {activeTab === "inadimplencias" && (
            <div className="space-y-3">
              {!alertas.inadimplencias || alertas.inadimplencias.length === 0 ? (
                <div className="text-center py-10 space-y-2 bg-zinc-950/40 rounded-xl border border-zinc-800/40">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-zinc-200">Parabéns! Nenhuma fatura em atraso no momento.</p>
                  <p className="text-[11px] text-zinc-500">Todas as cobranças estão em dia.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {alertas.inadimplencias.map((item: any) => {
                    const msgWhatsApp = encodeURIComponent(
                      `Olá, ${item.locatarioNome}! Constatamos uma pendência no valor de ${formatCurrency(item.valor)} referente ao aluguel do ${item.flatNumero} (${item.localNome}), com vencimento em ${new Date(item.dataVencimento).toLocaleDateString("pt-BR")}. Por favor, entre em contato para regularização.`
                    );

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-zinc-950/60 border border-rose-500/20 space-y-2 hover:border-rose-500/40 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-xs text-zinc-100 block">
                              {item.locatarioNome}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              {item.localNome} • Flat {item.flatNumero}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 text-[10px] font-bold border border-rose-500/20">
                            {item.diasAtraso}d em atraso
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                          <div>
                            <span className="text-xs font-black text-rose-400">
                              {formatCurrency(item.valor)}
                            </span>
                            <span className="text-[10px] text-zinc-500 block">
                              Venc: {new Date(item.dataVencimento).toLocaleDateString("pt-BR")}
                            </span>
                          </div>

                          {item.locatarioTelefone && (
                            <a
                              href={`https://wa.me/55${item.locatarioTelefone.replace(/\D/g, "")}?text=${msgWhatsApp}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow-md shadow-emerald-500/20 flex items-center space-x-1"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Cobrar</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Conteúdo da Aba 2: Contratos Vencendo */}
          {activeTab === "contratos" && (
            <div className="space-y-3">
              {!alertas.contratosVencendo || alertas.contratosVencendo.length === 0 ? (
                <div className="text-center py-10 space-y-2 bg-zinc-950/40 rounded-xl border border-zinc-800/40">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-zinc-200">Nenhum contrato vencendo nos próximos 60 dias.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {alertas.contratosVencendo.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl bg-zinc-950/60 border border-amber-500/20 space-y-2 hover:border-amber-500/40 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-xs text-zinc-100 block">
                            {c.locatarioNome}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {c.localNome} • Flat {c.flatNumero}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20">
                          {c.diasRestantes === 0 ? "Vence Hoje!" : `Vence em ${c.diasRestantes}d`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                        <div>
                          <span className="text-xs font-bold text-zinc-200">
                            {formatCurrency(c.valorMensal)} /mês
                          </span>
                          <span className="text-[10px] text-zinc-500 block">
                            Término: {new Date(c.dataFinal).toLocaleDateString("pt-BR")}
                          </span>
                        </div>

                        <Link
                          href="/contratos"
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition shadow-md shadow-amber-500/20 flex items-center space-x-1"
                        >
                          <span>Gerenciar</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conteúdo da Aba 3: Temporada / Diárias */}
          {activeTab === "diarias" && (
            <div className="space-y-3">
              {!alertas.diariasProximas || alertas.diariasProximas.length === 0 ? (
                <div className="text-center py-10 space-y-2 bg-zinc-950/40 rounded-xl border border-zinc-800/40">
                  <Sun className="w-10 h-10 text-amber-400 mx-auto" />
                  <p className="text-xs font-bold text-zinc-200">Nenhum check-in ou check-out previsto para hoje ou próximos dias.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {alertas.diariasProximas.map((d: any) => (
                    <div
                      key={d.id}
                      className="p-3.5 rounded-xl bg-zinc-950/60 border border-yellow-500/20 space-y-2 hover:border-yellow-500/40 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-xs text-zinc-100 block">
                            {d.locatarioNome}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {d.localNome} • Flat {d.flatNumero} ({d.dias} diárias)
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          d.tipoEvento === "CHECK_IN_HOJE"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            : d.tipoEvento === "CHECK_OUT_HOJE"
                            ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                        }`}>
                          {d.tipoEvento === "CHECK_IN_HOJE" ? "🟢 Check-in Hoje" : d.tipoEvento === "CHECK_OUT_HOJE" ? "🔴 Check-out Hoje" : "☀️ Em Estadia"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                        <div>
                          <span className="text-xs font-bold text-zinc-200">
                            {formatCurrency(d.valorTotal)}
                          </span>
                          <span className="text-[10px] text-zinc-500 block">
                            {new Date(d.dataCheckIn).toLocaleDateString("pt-BR")} ➔ {new Date(d.dataCheckOut).toLocaleDateString("pt-BR")}
                          </span>
                        </div>

                        <Link
                          href="/agenda"
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition shadow-md shadow-amber-500/20 flex items-center space-x-1"
                        >
                          <span>Ver Agenda</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conteúdo da Aba 4: Repasses Pendentes */}
          {activeTab === "repasses" && (
            <div className="space-y-3">
              {!alertas.repassesPendentes || alertas.repassesPendentes.length === 0 ? (
                <div className="text-center py-10 space-y-2 bg-zinc-950/40 rounded-xl border border-zinc-800/40">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-zinc-200">Todos os repasses aos proprietários estão quitados!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {alertas.repassesPendentes.map((r: any) => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-xl bg-zinc-950/60 border border-violet-500/20 space-y-2 hover:border-violet-500/40 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-xs text-zinc-100 block">
                            {r.proprietarioNome}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {r.localNome} • Flat {r.flatNumero}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 text-[10px] font-bold border border-violet-500/20">
                          Ref: {formatMesReferencia(r.mesReferencia)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                        <div>
                          <span className="text-xs font-black text-violet-400">
                            {formatCurrency(r.valorLiquido)}
                          </span>
                          <span className="text-[10px] text-zinc-500 block">
                            Taxa Adm: {r.taxaAdmPerc}% ({formatCurrency(r.taxaAdmValor)})
                          </span>
                        </div>

                        <Link
                          href="/financeiro/repasses"
                          className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-[11px] transition shadow-md shadow-violet-500/20 flex items-center space-x-1"
                        >
                          <span>Pagar Pix</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conteúdo da Aba 5: Últimas Vistorias */}
          {activeTab === "vistorias" && (
            <div className="space-y-3">
              {!alertas.vistoriasRecentes || alertas.vistoriasRecentes.length === 0 ? (
                <div className="text-center py-10 space-y-2 bg-zinc-950/40 rounded-xl border border-zinc-800/40">
                  <FileCheck className="w-10 h-10 text-zinc-500 mx-auto" />
                  <p className="text-xs font-bold text-zinc-200">Nenhuma vistoria recente registrada.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {alertas.vistoriasRecentes.map((v: any) => (
                    <div
                      key={v.id}
                      className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2 hover:border-zinc-700 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-xs text-zinc-100 block">
                            {v.tipoVistoria === "ENTRADA" ? "🔑 Vistoria de Entrada" : "🚪 Vistoria de Saída"}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {v.localNome || "Condomínio"} • Flat {v.flatNumero}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          v.statusAssinatura?.includes("ASSINADO")
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                        }`}>
                          {v.statusAssinatura?.includes("ASSINADO") ? "🟢 Assinado" : "🟡 Pendente"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-xs">
                        <span className="text-[11px] text-zinc-400">
                          {v.locatarioNome || "Locatário"}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(v.dataVistoria).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
