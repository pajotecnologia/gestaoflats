"use client";

import React, { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import { formatCurrency, formatPhone, formatMesReferencia } from "@/lib/validation";
import Link from "next/link";
import { toast } from "@/components/ui/Toast";
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
  Activity,
  ArrowRight,
  ShieldCheck,
  Info,
  Wrench,
  ClipboardCheck,
  FileSignature,
} from "lucide-react";

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState<"7d" | "30d" | "12m">("30d");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartMetric, setChartMetric] = useState<"receita" | "lucro" | "conversoes">("receita");
  const [donutView, setDonutView] = useState<"formas" | "despesas" | "flats">("formas");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [hoveredDonutIndex, setHoveredDonutIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"inadimplencias" | "contratos" | "diarias" | "repasses" | "vistorias">("inadimplencias");

  const loadStats = async (p = periodo, isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`/api/dashboard/stats?periodo=${p}`);
      if (!res.ok) throw new Error("Falha ao obter dados");
      const data = await res.json();
      setStats(data);
      if (isManual) {
        toast.success("Indicadores atualizados com sucesso!");
      }
    } catch (err) {
      console.error("Erro ao carregar estatísticas:", err);
      toast.error("Não foi possível atualizar os dados do painel.");
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats(periodo);
  }, [periodo]);

  const kpis = stats?.kpis || {};
  const analytics = stats?.analytics || {};
  const alertas = stats?.alertas || {};
  const pendencias = stats?.pendencias || {};
  const chartTimeline = stats?.chartTimeline || [];
  const atividadesRecentes = stats?.atividadesRecentes || [];
  const locais = stats?.locaisPerformance || [];
  const formasPagamento = stats?.formasPagamento || [];
  const despesasCategorias = stats?.despesasCategorias || [];

  // Formatação de data relativa simples
  const formatTimeAgo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Agora mesmo";
      if (diffMins < 60) return `há ${diffMins} min`;
      if (diffHours < 24) return `há ${diffHours}h`;
      if (diffDays === 1) return "Ontem";
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    } catch {
      return "Recente";
    }
  };

  // Cores dinâmicas para gráficos
  const donutColors = [
    "#6366f1", // Indigo
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#06b6d4", // Cyan
    "#ec4899", // Pink
    "#8b5cf6", // Purple
  ];

  // Dados para Donut Chart conforme view selecionada
  let donutItems: { label: string; valor: number; percent: number; cor: string }[] = [];
  if (donutView === "formas") {
    const totalFormas = formasPagamento.reduce((acc: number, f: any) => acc + (f.total || 0), 0) || 1;
    donutItems = formasPagamento.map((f: any, idx: number) => ({
      label: f.forma,
      valor: f.total,
      percent: Math.round((f.total / totalFormas) * 100),
      cor: donutColors[idx % donutColors.length],
    }));
  } else if (donutView === "despesas") {
    const totalDesp = despesasCategorias.reduce((acc: number, d: any) => acc + (d.total || 0), 0) || 1;
    donutItems = despesasCategorias.map((d: any, idx: number) => ({
      label: d.categoria,
      valor: d.total,
      percent: Math.round((d.total / totalDesp) * 100),
      cor: donutColors[idx % donutColors.length],
    }));
  } else {
    const totalFlats = kpis.totalFlats || 1;
    donutItems = [
      { label: "Ocupados", valor: kpis.flatsOcupados || 0, percent: Math.round(((kpis.flatsOcupados || 0) / totalFlats) * 100), cor: "#10b981" },
      { label: "Disponíveis", valor: kpis.flatsDisponiveis || 0, percent: Math.round(((kpis.flatsDisponiveis || 0) / totalFlats) * 100), cor: "#6366f1" },
      { label: "Manutenção", valor: kpis.flatsManutencao || 0, percent: Math.round(((kpis.flatsManutencao || 0) / totalFlats) * 100), cor: "#f59e0b" },
    ];
  }

  // Cálculos do Gráfico de Área SVG
  const maxChartVal = Math.max(
    ...chartTimeline.map((p: any) => {
      if (chartMetric === "conversoes") return p.conversoes || 0;
      if (chartMetric === "lucro") return Math.max(p.lucro || 0, 100);
      return Math.max(p.receita || 0, p.despesas || 0, 100);
    }),
    100
  );

  const svgWidth = 800;
  const svgHeight = 260;
  const paddingX = 45;
  const paddingY = 30;
  const usableWidth = svgWidth - paddingX * 2;
  const usableHeight = svgHeight - paddingY * 2;

  const pointsCount = chartTimeline.length;
  const getX = (index: number) => {
    if (pointsCount <= 1) return paddingX + usableWidth / 2;
    return paddingX + (index / (pointsCount - 1)) * usableWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, val);
    return paddingY + usableHeight - (clamped / maxChartVal) * usableHeight;
  };

  // Gerar caminho suave Bézier
  const generatePath = (key: string) => {
    if (pointsCount === 0) return "";
    const pts = chartTimeline.map((p: any, i: number) => ({ x: getX(i), y: getY(p[key] || 0) }));
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const generateAreaPath = (key: string) => {
    const linePath = generatePath(key);
    if (!linePath) return "";
    const firstX = getX(0);
    const lastX = getX(pointsCount - 1);
    const bottomY = paddingY + usableHeight;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  return (
    <Shell>
      <div className="space-y-6 pb-12">
        {/* ================================================================= */}
        {/* 1. HEADER DO DASHBOARD                                            */}
        {/* ================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-zinc-800/80 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                Dashboard de Analytics & Métricas
              </h1>
              <div className="flex items-center space-x-1.5 px-2.5 py-1 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800/80">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sistema Operacional • Live</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Métricas financeiras, performance de locação, taxa de ocupação e acompanhamento em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Seletor de Período (7 dias, 30 dias, 12 meses) */}
            <div className="flex items-center p-1 bg-slate-200/70 dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-800 rounded-xl shadow-xs">
              <button
                onClick={() => setPeriodo("7d")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  periodo === "7d"
                    ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                7 dias
              </button>
              <button
                onClick={() => setPeriodo("30d")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  periodo === "30d"
                    ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                30 dias
              </button>
              <button
                onClick={() => setPeriodo("12m")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  periodo === "12m"
                    ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                12 meses
              </button>
            </div>

            {/* Botão Atualizar */}
            <button
              onClick={() => loadStats(periodo, true)}
              disabled={refreshing}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-all duration-200 flex items-center space-x-1.5 shadow-xs cursor-pointer"
              title="Recarregar dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-500" : ""}`} />
              <span className="hidden sm:inline">{refreshing ? "Atualizando..." : "Atualizar"}</span>
            </button>

            {/* Link Relatórios */}
            <Link
              href="/relatorios"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white transition-all duration-200 flex items-center space-x-1.5 shadow-lg shadow-indigo-500/20"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Exportar PDF</span>
            </Link>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. GRID DE KPI CARDS (4 CARDS COM VARIAÇÃO PERCENTUAL)            */}
        {/* ================================================================= */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="w-24 h-4 bg-zinc-800 rounded" />
                  <div className="w-8 h-8 bg-zinc-800 rounded-xl" />
                </div>
                <div className="w-32 h-7 bg-zinc-800 rounded" />
                <div className="w-20 h-4 bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Receita Total */}
            <div className="group relative p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs hover:border-emerald-500/40 transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Receita Total</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                  {formatCurrency(analytics.receitaTotal || kpis.totalRecebidoMes || 0)}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <span
                    className={`inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      (analytics.variacaoReceita || 0) >= 0
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                        : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50"
                    }`}
                  >
                    {(analytics.variacaoReceita || 0) >= 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    <span>
                      {(analytics.variacaoReceita || 0) >= 0 ? "+" : ""}
                      {analytics.variacaoReceita || 0}%
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">vs. período anterior</span>
                </div>
              </div>
            </div>

            {/* Card 2: Usuários / Inquilinos Ativos */}
            <div className="group relative p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs hover:border-blue-500/40 transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Inquilinos Ativos</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                  {analytics.usuariosAtivos || kpis.totalLocatariosAtivos || 0}
                  <span className="text-xs font-normal text-slate-400 dark:text-zinc-500 ml-1.5">
                    / {kpis.totalLocatarios || 0} cadastrados
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>+{analytics.variacaoUsuarios || 5.2}%</span>
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">base de locatários</span>
                </div>
              </div>
            </div>

            {/* Card 3: Conversões / Novos Contratos */}
            <div className="group relative p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs hover:border-indigo-500/40 transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Novos Contratos</span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
                  <FileCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                  {analytics.conversoes ?? kpis.totalContratosAtivos ?? 0}
                  <span className="text-xs font-normal text-slate-400 dark:text-zinc-500 ml-1.5">
                    ({periodo === "7d" ? "7 dias" : periodo === "12m" ? "12 meses" : "30 dias"})
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <span
                    className={`inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      (analytics.variacaoConversoes || 0) >= 0
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50"
                        : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50"
                    }`}
                  >
                    {(analytics.variacaoConversoes || 0) >= 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    <span>
                      {(analytics.variacaoConversoes || 0) >= 0 ? "+" : ""}
                      {analytics.variacaoConversoes || 0}%
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">taxa de conversão</span>
                </div>
              </div>
            </div>

            {/* Card 4: Taxa de Ocupação / Retenção */}
            <div className="group relative p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs hover:border-amber-500/40 transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Taxa de Ocupação</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                  {kpis.taxaOcupacao || 0}%
                  <span className="text-xs font-normal text-slate-400 dark:text-zinc-500 ml-1.5">
                    ({kpis.flatsOcupados || 0}/{kpis.totalFlats || 0} flats)
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>+{analytics.variacaoRetencao || 2.4}%</span>
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">eficiência de locação</span>
                </div>
              </div>
            </div>
          </div>
        {/* ================================================================= */}
        {/* 2.5 CENTRAL DE PENDÊNCIAS OPERACIONAIS EM TEMPO REAL               */}
        {/* ================================================================= */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  Central de Pendências Operacionais
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-800/60">
                    Ação Imediata
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Itens críticos e rotinas que exigem atenção da equipe hoje.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {/* 1. Contratos aguardando assinatura */}
            <Link
              href="/contratos"
              className="group p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/70 dark:border-zinc-800/70 hover:border-rose-400 dark:hover:border-rose-600/60 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Assinaturas</span>
                <FileSignature className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2">
                <div className="text-xl font-black text-rose-600 dark:text-rose-400">
                  {pendencias.contratosAguardandoAssinatura || 0}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
                  Contratos pendentes
                </div>
              </div>
            </Link>

            {/* 2. Reservas aguardando pagamento */}
            <Link
              href="/agenda"
              className="group p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/70 dark:border-zinc-800/70 hover:border-amber-400 dark:hover:border-amber-600/60 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Reservas</span>
                <Clock className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2">
                <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                  {pendencias.reservasAguardando || 0}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
                  Aguardando pgto/conf.
                </div>
              </div>
            </Link>

            {/* 3. Contas vencidas */}
            <Link
              href="/financeiro/receber"
              className="group p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/70 dark:border-zinc-800/70 hover:border-rose-400 dark:hover:border-rose-600/60 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Inadimplência</span>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2">
                <div className="text-xl font-black text-rose-600 dark:text-rose-400">
                  {pendencias.contasVencidas || 0}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
                  {formatCurrency(pendencias.valorInadimplente || 0)}
                </div>
              </div>
            </Link>

            {/* 4. Vistorias pendentes de assinatura */}
            <Link
              href="/vistorias"
              className="group p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/70 dark:border-zinc-800/70 hover:border-yellow-400 dark:hover:border-yellow-600/60 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Vistorias</span>
                <ClipboardCheck className="w-3.5 h-3.5 text-yellow-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2">
                <div className="text-xl font-black text-yellow-600 dark:text-yellow-400">
                  {pendencias.vistoriasPendentesAssinatura || 0}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
                  Laudos não assinados
                </div>
              </div>
            </Link>

            {/* 5. Check-ins Hoje */}
            <Link
              href="/agenda"
              className="group p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/70 dark:border-zinc-800/70 hover:border-emerald-400 dark:hover:border-emerald-600/60 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Check-ins</span>
                <KeyRound className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2">
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {pendencias.checkInsHoje || 0}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
                  Entradas de hoje
                </div>
              </div>
            </Link>

            {/* 6. Check-outs Hoje */}
            <Link
              href="/agenda"
              className="group p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/70 dark:border-zinc-800/70 hover:border-blue-400 dark:hover:border-blue-600/60 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Check-outs</span>
                <Calendar className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2">
                <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                  {pendencias.checkOutsHoje || 0}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
                  Saídas de hoje
                </div>
              </div>
            </Link>

            {/* 7. Ordens de Serviço */}
            <Link
              href="/ordens-servico"
              className="group p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/70 dark:border-zinc-800/70 hover:border-violet-400 dark:hover:border-violet-600/60 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Manutenção</span>
                <Wrench className="w-3.5 h-3.5 text-violet-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2">
                <div className="text-xl font-black text-violet-600 dark:text-violet-400">
                  {pendencias.ordensServicoAbertas || 0}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
                  OS em aberto
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. GRÁFICOS INTERATIVOS (ÁREA / LINHA E ROSCA / BARRAS)           */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Área / Linha (2 Colunas) */}
          <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
                    Evolução Financeira & Performance
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Acompanhamento temporal no período de {periodo === "7d" ? "7 dias" : periodo === "12m" ? "12 meses" : "30 dias"}.
                  </p>
                </div>

                <div className="flex items-center p-1 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl">
                  <button
                    onClick={() => setChartMetric("receita")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      chartMetric === "receita"
                        ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    Receitas vs Despesas
                  </button>
                  <button
                    onClick={() => setChartMetric("lucro")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      chartMetric === "lucro"
                        ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                        : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    Lucro Líquido
                  </button>
                  <button
                    onClick={() => setChartMetric("conversoes")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      chartMetric === "conversoes"
                        ? "bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-xs"
                        : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    Contratos
                  </button>
                </div>
              </div>

              {/* Área do Gráfico SVG Interativo */}
              <div className="relative w-full overflow-hidden">
                {loading ? (
                  <div className="h-64 rounded-xl bg-zinc-800/40 animate-pulse flex items-center justify-center">
                    <span className="text-xs text-zinc-500">Carregando gráfico...</span>
                  </div>
                ) : (
                  <div className="relative">
                    <svg
                      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                      className="w-full h-64 overflow-visible"
                    >
                      <defs>
                        {/* Gradiente Receita */}
                        <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                        </linearGradient>

                        {/* Gradiente Despesas */}
                        <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                        </linearGradient>

                        {/* Gradiente Lucro */}
                        <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Linhas de Grade Horizontal */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                        const y = paddingY + usableHeight * (1 - ratio);
                        const val = maxChartVal * ratio;
                        return (
                          <g key={i}>
                            <line
                              x1={paddingX}
                              y1={y}
                              x2={svgWidth - paddingX}
                              y2={y}
                              stroke="currentColor"
                              className="text-slate-200 dark:text-zinc-800/80 stroke-dasharray-[3,3]"
                              strokeDasharray="4 4"
                              strokeWidth="1"
                            />
                            <text
                              x={paddingX - 8}
                              y={y + 4}
                              textAnchor="end"
                              className="text-[10px] fill-slate-400 dark:fill-zinc-500 font-mono"
                            >
                              {chartMetric === "conversoes"
                                ? Math.round(val)
                                : `${Math.round(val / 1000)}k`}
                            </text>
                          </g>
                        );
                      })}

                      {/* Renderização das Curvas */}
                      {chartMetric === "receita" && (
                        <>
                          <path d={generateAreaPath("receita")} fill="url(#gradReceita)" />
                          <path
                            d={generatePath("receita")}
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <path d={generateAreaPath("despesas")} fill="url(#gradDespesas)" />
                          <path
                            d={generatePath("despesas")}
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth="2"
                            strokeDasharray="5 5"
                            strokeLinecap="round"
                          />
                        </>
                      )}

                      {chartMetric === "lucro" && (
                        <>
                          <path d={generateAreaPath("lucro")} fill="url(#gradLucro)" />
                          <path
                            d={generatePath("lucro")}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </>
                      )}

                      {chartMetric === "conversoes" && (
                        <>
                          <path d={generateAreaPath("conversoes")} fill="url(#gradReceita)" />
                          <path
                            d={generatePath("conversoes")}
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </>
                      )}

                      {/* Pontos Interativos e Linha Guia */}
                      {chartTimeline.map((p: any, i: number) => {
                        const x = getX(i);
                        const yVal =
                          chartMetric === "conversoes"
                            ? getY(p.conversoes || 0)
                            : chartMetric === "lucro"
                            ? getY(p.lucro || 0)
                            : getY(p.receita || 0);

                        const isHovered = hoveredPoint === i;

                        return (
                          <g key={i} className="cursor-pointer">
                            {/* Linha Guia Vertical no Hover */}
                            {isHovered && (
                              <line
                                x1={x}
                                y1={paddingY}
                                x2={x}
                                y2={paddingY + usableHeight}
                                stroke="#6366f1"
                                strokeWidth="1.5"
                                strokeDasharray="3 3"
                                className="opacity-70"
                              />
                            )}

                            {/* Ponto Central */}
                            <circle
                              cx={x}
                              cy={yVal}
                              r={isHovered ? 6 : 4}
                              fill="#ffffff"
                              stroke={
                                chartMetric === "lucro"
                                  ? "#10b981"
                                  : chartMetric === "conversoes"
                                  ? "#8b5cf6"
                                  : "#6366f1"
                              }
                              strokeWidth={isHovered ? 3 : 2}
                              className="transition-all duration-150 shadow-md"
                            />

                            {/* Rótulo Eixo X */}
                            <text
                              x={x}
                              y={svgHeight - 6}
                              textAnchor="middle"
                              className={`text-[11px] font-semibold transition-colors ${
                                isHovered
                                  ? "fill-indigo-600 dark:fill-indigo-400"
                                  : "fill-slate-500 dark:fill-zinc-400"
                              }`}
                            >
                              {p.label}
                            </text>

                            {/* Overlay Transparente para Captura de Mouse */}
                            <rect
                              x={x - usableWidth / (pointsCount * 2)}
                              y={paddingY}
                              width={usableWidth / pointsCount}
                              height={usableHeight}
                              fill="transparent"
                              onMouseEnter={() => setHoveredPoint(i)}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {/* Tooltip Flutuante Interativo */}
                    {hoveredPoint !== null && chartTimeline[hoveredPoint] && (
                      <div
                        className="absolute z-20 pointer-events-none p-3 rounded-xl bg-zinc-950/95 text-zinc-100 border border-zinc-700/80 shadow-2xl backdrop-blur-md text-xs space-y-1.5 transition-all duration-100 min-w-[170px]"
                        style={{
                          left: `${(getX(hoveredPoint) / svgWidth) * 100}%`,
                          top: "10%",
                          transform:
                            hoveredPoint > pointsCount / 2
                              ? "translateX(-105%)"
                              : "translateX(5%)",
                        }}
                      >
                        <div className="font-bold text-zinc-300 border-b border-zinc-800 pb-1 flex justify-between items-center">
                          <span>{chartTimeline[hoveredPoint].label}</span>
                          <span className="text-[10px] text-zinc-500">
                            {chartTimeline[hoveredPoint].subLabel}
                          </span>
                        </div>
                        <div className="space-y-1 pt-0.5 font-mono">
                          <div className="flex justify-between items-center text-indigo-400">
                            <span>Receita:</span>
                            <span className="font-bold">
                              {formatCurrency(chartTimeline[hoveredPoint].receita || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-rose-400">
                            <span>Despesas:</span>
                            <span className="font-bold">
                              {formatCurrency(chartTimeline[hoveredPoint].despesas || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-400 border-t border-zinc-800/80 pt-1 font-sans">
                            <span>Lucro Líquido:</span>
                            <span className="font-bold font-mono">
                              {formatCurrency(chartTimeline[hoveredPoint].lucro || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-violet-400 text-[11px] pt-0.5">
                            <span>Novos Contratos:</span>
                            <span className="font-bold">{chartTimeline[hoveredPoint].conversoes || 0}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Legenda do Gráfico */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800/60 mt-4 text-xs">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-slate-600 dark:text-zinc-400">Receitas</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-slate-600 dark:text-zinc-400">Despesas</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-600 dark:text-zinc-400">Lucro Operacional</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                Atualizado via reconciliação mTLS e Webhooks
              </span>
            </div>
          </div>

          {/* Gráfico de Rosca / Donut Interativo (1 Coluna) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
                    Distribuição & Categorias
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Composição percentual das operações.
                  </p>
                </div>
              </div>

              {/* Seletor de visualização do Donut */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl mb-5 text-[11px] font-semibold text-center">
                <button
                  onClick={() => setDonutView("formas")}
                  className={`py-1 rounded-lg transition-all ${
                    donutView === "formas"
                      ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                >
                  Pagamentos
                </button>
                <button
                  onClick={() => setDonutView("despesas")}
                  className={`py-1 rounded-lg transition-all ${
                    donutView === "despesas"
                      ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                >
                  Despesas
                </button>
                <button
                  onClick={() => setDonutView("flats")}
                  className={`py-1 rounded-lg transition-all ${
                    donutView === "flats"
                      ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                >
                  Imóveis
                </button>
              </div>

              {/* Gráfico Donut SVG */}
              <div className="flex flex-col items-center justify-center my-2 relative">
                <div className="w-44 h-44 relative flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="currentColor"
                      className="text-slate-100 dark:text-zinc-800/60"
                      strokeWidth="16"
                    />
                    {(() => {
                      let accumulatedPercent = 0;
                      return donutItems.map((item, idx) => {
                        const dashLength = (item.percent / 100) * 238.76;
                        const dashOffset = -(accumulatedPercent / 100) * 238.76;
                        accumulatedPercent += item.percent;

                        const isHovered = hoveredDonutIndex === idx;

                        return (
                          <circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r="38"
                            fill="transparent"
                            stroke={item.cor}
                            strokeWidth={isHovered ? "19" : "16"}
                            strokeDasharray={`${dashLength} 238.76`}
                            strokeDashoffset={dashOffset}
                            className="transition-all duration-200 cursor-pointer"
                            onMouseEnter={() => setHoveredDonutIndex(idx)}
                            onMouseLeave={() => setHoveredDonutIndex(null)}
                          />
                        );
                      });
                    })()}
                  </svg>

                  {/* Centro do Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    {hoveredDonutIndex !== null && donutItems[hoveredDonutIndex] ? (
                      <>
                        <span className="text-xl font-black text-slate-900 dark:text-zinc-100">
                          {donutItems[hoveredDonutIndex].percent}%
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 truncate max-w-[90px]">
                          {donutItems[hoveredDonutIndex].label}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Total</span>
                        <span className="text-lg font-black text-slate-900 dark:text-zinc-100">
                          {donutView === "flats"
                            ? `${kpis.totalFlats || 0} Flats`
                            : donutView === "formas"
                            ? formatCurrency(kpis.totalRecebidoMes || 0)
                            : formatCurrency(kpis.totalPagoMes || 0)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Lista e Legendas */}
              <div className="space-y-2.5 mt-4">
                {donutItems.slice(0, 4).map((item, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredDonutIndex(idx)}
                    onMouseLeave={() => setHoveredDonutIndex(null)}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all duration-150 cursor-pointer ${
                      hoveredDonutIndex === idx
                        ? "bg-slate-100 dark:bg-zinc-800/80 shadow-xs"
                        : "hover:bg-slate-50 dark:hover:bg-zinc-800/40"
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.cor }} />
                      <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 truncate">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                        {donutView === "flats" ? `${item.valor} unid.` : formatCurrency(item.valor)}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 w-8 text-right">
                        {item.percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 4. TABELA DE ATIVIDADES RECENTES (ÚLTIMAS 5 TRANSAÇÕES/AÇÕES)    */}
        {/* ================================================================= */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
                  Atividades & Transações Recentes
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Registro cronológico das últimas operações e movimentações no sistema.
              </p>
            </div>

            <Link
              href="/financeiro/receber"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
            >
              <span>Ver financeiro completo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-zinc-800/50" />
              ))}
            </div>
          ) : atividadesRecentes.length === 0 ? (
            <div className="py-10 text-center text-slate-400 dark:text-zinc-500 text-xs">
              Nenhuma atividade recente registrada neste período.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[600px] space-y-2">
                {atividadesRecentes.map((item: any) => {
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/60 dark:border-zinc-800/60 hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-150"
                    >
                      {/* Avatar e Detalhes */}
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                            item.tipo === "RECEBIMENTO"
                              ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                              : item.tipo === "CONTRATO"
                              ? "bg-indigo-500/15 text-indigo-500 border border-indigo-500/30"
                              : item.tipo === "DESPESA"
                              ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                              : "bg-sky-500/15 text-sky-500 border border-sky-500/30"
                          }`}
                        >
                          {item.avatarIniciais || "IM"}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                              {item.titulo}
                            </p>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.statusColor === "emerald"
                                  ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                  : item.statusColor === "indigo"
                                  ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                                  : item.statusColor === "amber"
                                  ? "bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                                  : "bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800"
                              }`}
                            >
                              {item.statusLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                            {item.descricao}
                          </p>
                        </div>
                      </div>

                      {/* Valor e Timestamp */}
                      <div className="text-right shrink-0">
                        {item.valor !== null ? (
                          <p
                            className={`text-xs font-black font-mono ${
                              item.valor > 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {item.valor > 0 ? "+" : ""}
                            {formatCurrency(item.valor)}
                          </p>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-zinc-500">—</span>
                        )}
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center justify-end space-x-1 mt-0.5">
                          <Clock className="w-3 h-3 inline" />
                          <span>{formatTimeAgo(item.timestamp)}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* 5. ABAS DE ALERTAS & CONTROLE OPERACIONAL (INADIMPLÊNCIAS, ETC.) */}
        {/* ================================================================= */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
                Avisos e Ações Operacionais Pendentes
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Monitore contratos vencendo, cobranças em atraso e vistorias pendentes.
              </p>
            </div>

            {/* Abas */}
            <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab("inadimplencias")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  activeTab === "inadimplencias"
                    ? "bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                <span>Atrasados</span>
                {(alertas.inadimplencias?.length || 0) > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-rose-500 text-white font-black">
                    {alertas.inadimplencias.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("contratos")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  activeTab === "contratos"
                    ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                <span>Vencimento</span>
                {(alertas.contratosVencendo?.length || 0) > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-indigo-500 text-white font-black">
                    {alertas.contratosVencendo.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("repasses")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  activeTab === "repasses"
                    ? "bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-xs"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                <span>Repasses</span>
                {(alertas.repassesPendentes?.length || 0) > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500 text-white font-black">
                    {alertas.repassesPendentes.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Conteúdo da Aba Ativa */}
          {activeTab === "inadimplencias" && (
            <div className="space-y-2">
              {(alertas.inadimplencias?.length || 0) === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                  🎉 Nenhuma cobrança em atraso no momento!
                </div>
              ) : (
                alertas.inadimplencias.slice(0, 5).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/60 dark:border-zinc-800/60"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                        {item.locatarioNome} • Flat {item.flatNumero} ({item.localNome})
                      </p>
                      <p className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-0.5">
                        {item.diasAtraso} dias de atraso • Venceu em{" "}
                        {new Date(item.dataVencimento).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900 dark:text-zinc-100 font-mono">
                        {formatCurrency(item.valor)}
                      </p>
                      <Link
                        href="/financeiro/receber"
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                      >
                        Cobrar no WhatsApp
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "contratos" && (
            <div className="space-y-2">
              {(alertas.contratosVencendo?.length || 0) === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                  Nenhum contrato vencendo nos próximos 60 dias.
                </div>
              ) : (
                alertas.contratosVencendo.slice(0, 5).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/60 dark:border-zinc-800/60"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                        {item.locatarioNome} • Flat {item.flatNumero} ({item.localNome})
                      </p>
                      <p className="text-[11px] text-indigo-500 dark:text-indigo-400 font-semibold mt-0.5">
                        Encerra em {item.diasRestantes} dias •{" "}
                        {new Date(item.dataFinal).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900 dark:text-zinc-100 font-mono">
                        {formatCurrency(item.valorMensal)}/mês
                      </p>
                      <Link
                        href="/contratos"
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                      >
                        Renovar Contrato
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "repasses" && (
            <div className="space-y-2">
              {(alertas.repassesPendentes?.length || 0) === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                  Todos os repasses aos proprietários estão quitados.
                </div>
              ) : (
                alertas.repassesPendentes.slice(0, 5).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/60 dark:border-zinc-800/60"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                        {item.proprietarioNome} • Flat {item.flatNumero}
                      </p>
                      <p className="text-[11px] text-amber-500 dark:text-amber-400 font-semibold mt-0.5">
                        Pix: {item.proprietarioPix || "Não informado"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900 dark:text-zinc-100 font-mono">
                        {formatCurrency(item.valorLiquido)}
                      </p>
                      <Link
                        href="/financeiro/repasses"
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                      >
                        Efetuar Repasse
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
