"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, X, Check, ShieldCheck, Zap } from "lucide-react";
import { PlanDefinition } from "@/lib/plans/planDefinitions";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  limitKey?: "properties" | "users" | "signatures" | "storage" | "whatsapp";
  currentPlan?: PlanDefinition | null;
  nextPlan?: PlanDefinition | null;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  title = "Você está crescendo! 🚀",
  message,
  limitKey = "properties",
  currentPlan,
  nextPlan,
}: UpgradeModalProps) {
  if (!isOpen) return null;

  const targetPlanName = nextPlan?.name || "Plano Profissional";
  const targetSlug = nextPlan?.slug || "PROFISSIONAL";
  const targetPrice = nextPlan?.priceMonthly || 149;
  const targetProperties = nextPlan?.limits.maxProperties || 10;
  const targetUsers = nextPlan?.limits.maxUsers || 3;
  const targetSignatures = nextPlan?.limits.maxSignaturesPerMonth || 20;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] my-auto overflow-y-auto">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-500 mb-2">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            {message ||
              `Seu plano atual atingiu o limite de capacidade. Com o ${targetPlanName}, você expande sua operação e desbloqueia mais recursos sem travas.`}
          </p>
        </div>

        {/* Card do Próximo Plano Recomendado */}
        <div className="bg-slate-50 dark:bg-zinc-950/60 border border-emerald-500/30 rounded-2xl p-5 mb-6 relative overflow-hidden">
          <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-emerald-500 text-zinc-950 font-black text-[10px] uppercase tracking-wider shadow-sm">
            Recomendado
          </div>

          <div className="flex items-baseline gap-1.5 mb-3">
            <span className="text-2xl font-black text-slate-900 dark:text-zinc-100">
              R$ {targetPrice.toFixed(0)}
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">/mês</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 ml-2">
              {targetPlanName}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Gerencie até <strong>{targetProperties} imóveis</strong> simultâneos
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Até <strong>{targetUsers} usuários</strong> e operadores da equipe
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                <strong>{targetSignatures} assinaturas digitais</strong> por mês
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Vistorias fotográficas com alta resolução e WhatsApp direto</span>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-2.5">
          <Link
            href={`/renovar?plano=${targetSlug}`}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all duration-200 hover:scale-[1.01]"
          >
            <span>Fazer Upgrade para {targetPlanName}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-center text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition cursor-pointer"
          >
            Continuar com o plano atual
          </button>
        </div>
      </div>
    </div>
  );
}
