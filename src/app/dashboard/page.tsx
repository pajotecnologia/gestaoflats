"use client";

import React, { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import { formatCurrency } from "@/lib/validation";
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
  CheckCircle,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Carregando indicadores operacionais...</p>
          </div>
        </div>
      </Shell>
    );
  }

  const kpis = stats?.kpis || {};
  const alertas = stats?.alertas || {};

  return (
    <Shell>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Painel de Controle Operacional</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visão geral de flats, recebimentos, despesas e taxa de ocupação
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-300 shadow-sm">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Sistema Operante</span>
          </div>
        </div>

        {/* Grid de Cards KPIs com Cores e Fontes Suaves */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Locatários Ativos */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Locatários Ativos</span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.totalLocatariosAtivos || 0}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-500">Contratos vigentes no momento</p>
          </div>

          {/* Card 2: Taxa de Ocupação */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Taxa de Ocupação</span>
              <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400">
                <PieChart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.taxaOcupacao || 0}%</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-500">
              {kpis.flatsOcupados || 0} de {kpis.totalFlats || 0} flats ocupados
            </p>
          </div>

          {/* Card 3: Recebimentos do Mês */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Recebidos no Mês</span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(kpis.totalRecebidoMes || 0)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Em Aberto: <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(kpis.totalEmAbertoReceber || 0)}</span> (Previsto: {formatCurrency(kpis.totalReceberMes || 0)})
            </p>
          </div>

          {/* Card 4: Pagamentos do Mês */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pagos no Mês</span>
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-600/20 text-rose-600 dark:text-rose-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(kpis.totalPagoMes || 0)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Em Aberto: <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(kpis.totalEmAbertoPagar || 0)}</span> (Previsto: {formatCurrency(kpis.totalPagarMes || 0)})
            </p>
          </div>

          {/* Card 5: Saldo Operacional Líquido */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Saldo Líquido</span>
              <div
                className={`p-2 rounded-xl ${
                  kpis.saldoOperacionalLiquido >= 0
                    ? "bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-50 dark:bg-red-600/20 text-red-600 dark:text-red-400"
                }`}
              >
                {kpis.saldoOperacionalLiquido >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
              </div>
            </div>
            <div
              className={`text-xl font-bold ${
                kpis.saldoOperacionalLiquido >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(kpis.saldoOperacionalLiquido || 0)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Recebimentos vs. Pagamentos do mês</p>
          </div>
        </div>

        {/* Alertas Rápidos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Painel 1: Inadimplências */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                  Inadimplências & Cobranças em Aberto
                </h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-semibold border border-red-200 dark:border-red-800/40">
                {alertas.inadimplencias?.length || 0} pendente(s)
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {!alertas.inadimplencias || alertas.inadimplencias.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  Nenhuma inadimplência registrada no momento.
                </p>
              ) : (
                alertas.inadimplencias.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-red-900/30 hover:border-red-300 dark:hover:border-red-700/50 transition"
                  >
                    <div>
                      <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">{item.locatario.nome}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.contrato?.flat?.numero || "Flat"} • Ref: {item.mesReferencia}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xs text-red-600 dark:text-red-400">
                        {formatCurrency(item.valor)}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Venc: {new Date(item.dataVencimento).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Painel 2: Contratos Vencendo */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                  Contratos Vencendo em até 30 Dias
                </h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800/40">
                {alertas.contratosVencendo?.length || 0} contrato(s)
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {!alertas.contratosVencendo || alertas.contratosVencendo.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  Nenhum contrato prestes a vencer nos próximos 30 dias.
                </p>
              ) : (
                alertas.contratosVencendo.map((contrato: any) => (
                  <div
                    key={contrato.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-amber-900/30 hover:border-amber-300 dark:hover:border-amber-700/50 transition"
                  >
                    <div>
                      <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">{contrato.locatario.nome}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{contrato.flat.numero}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xs text-amber-600 dark:text-amber-400">
                        {formatCurrency(contrato.valorMensal)} /mês
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Término: {new Date(contrato.dataFinal).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
