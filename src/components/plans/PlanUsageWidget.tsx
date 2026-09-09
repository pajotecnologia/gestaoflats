"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  FileCheck,
  HardDrive,
  Sparkles,
  Zap,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import { OrganizationUsage } from "@/lib/plans/planService";

interface PlanUsageWidgetProps {
  className?: string;
  compact?: boolean;
}

export default function PlanUsageWidget({
  className = "",
  compact = false,
}: PlanUsageWidgetProps) {
  const [usage, setUsage] = useState<OrganizationUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/saas/usage")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setUsage(data);
        }
      })
      .catch((err) => console.error("Erro ao carregar métricas de uso:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !usage) return null;
  if (usage.isMestre) return null; // Empresa Mestre não precisa de barras de quota

  const getBarColor = (pct: number) => {
    if (pct >= 100) return "bg-rose-500";
    if (pct >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getTextColor = (pct: number) => {
    if (pct >= 100) return "text-rose-600 dark:text-rose-400 font-black";
    if (pct >= 70) return "text-amber-600 dark:text-amber-400 font-bold";
    return "text-slate-700 dark:text-slate-300 font-semibold";
  };

  if (compact) {
    return (
      <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              {usage.plan.name}
            </span>
          </div>
          <Link
            href={`/renovar?plano=${usage.nextPlanForUpgrade?.slug || "PROFISSIONAL"}`}
            className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
          >
            <span>Upgrade</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Imóveis Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-500">Imóveis</span>
            <span className={getTextColor(usage.percentages.properties)}>
              {usage.counts.properties} / {usage.plan.limits.maxProperties >= 9999 ? "∞" : usage.plan.limits.maxProperties}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getBarColor(usage.percentages.properties)}`}
              style={{ width: `${Math.min(100, usage.percentages.properties)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              {usage.plan.name}
            </span>
            {usage.isTrial && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                TRIAL ({usage.diasRestantesTrial}d restantes)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Capacidade e limites operacionais da sua conta
          </p>
        </div>

        <Link
          href={`/renovar?plano=${usage.nextPlanForUpgrade?.slug || "PROFISSIONAL"}`}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Fazer Upgrade</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. Imóveis */}
        <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Building2 className="w-3.5 h-3.5" />
              <span>Imóveis</span>
            </div>
            <span className={getTextColor(usage.percentages.properties)}>
              {usage.counts.properties} / {usage.plan.limits.maxProperties >= 9999 ? "∞" : usage.plan.limits.maxProperties}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getBarColor(usage.percentages.properties)}`}
              style={{ width: `${Math.min(100, usage.percentages.properties)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 flex justify-between">
            <span>{usage.percentages.properties}% utilizado</span>
            {usage.percentages.properties >= 100 && (
              <span className="text-rose-500 font-bold flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" /> Limite
              </span>
            )}
          </div>
        </div>

        {/* 2. Usuários */}
        <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Users className="w-3.5 h-3.5" />
              <span>Usuários</span>
            </div>
            <span className={getTextColor(usage.percentages.users)}>
              {usage.counts.users} / {usage.plan.limits.maxUsers >= 999 ? "∞" : usage.plan.limits.maxUsers}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getBarColor(usage.percentages.users)}`}
              style={{ width: `${Math.min(100, usage.percentages.users)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 flex justify-between">
            <span>{usage.percentages.users}% utilizado</span>
          </div>
        </div>

        {/* 3. Assinaturas Digitais do Mês */}
        <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Assinaturas / Mês</span>
            </div>
            <span className={getTextColor(usage.percentages.signatures)}>
              {usage.counts.signaturesThisMonth} / {usage.plan.limits.maxSignaturesPerMonth >= 9999 ? "∞" : usage.plan.limits.maxSignaturesPerMonth}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getBarColor(usage.percentages.signatures)}`}
              style={{ width: `${Math.min(100, usage.percentages.signatures)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 flex justify-between">
            <span>{usage.percentages.signatures}% utilizado</span>
          </div>
        </div>

        {/* 4. Armazenamento */}
        <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Armazenamento</span>
            </div>
            <span className={getTextColor(usage.percentages.storage)}>
              {usage.counts.storageGB} GB / {usage.plan.limits.maxStorageGB} GB
            </span>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getBarColor(usage.percentages.storage)}`}
              style={{ width: `${Math.min(100, usage.percentages.storage)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 flex justify-between">
            <span>{usage.percentages.storage}% utilizado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
