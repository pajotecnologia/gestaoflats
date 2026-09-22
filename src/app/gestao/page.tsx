"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import { BarChart3, Building2, AlertTriangle, Wrench, CalendarClock, RefreshCw, TrendingUp, DollarSign, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/validation";

export default function GestaoPage(){
 const [data,setData]=useState<any>(null); const [loading,setLoading]=useState(true);
 const load=()=>{setLoading(true);fetch("/api/gestao/indicadores").then(r=>r.json()).then(setData).finally(()=>setLoading(false));};
 useEffect(load,[]);
 const k=data?.indicadores||{};
 return <Shell><div className="space-y-6">
  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
   <div><h1 className="text-lg font-bold">Gestão & Inteligência</h1><p className="text-xs text-slate-500">Ocupação, rentabilidade operacional, contratos e manutenção.</p></div>
   <button onClick={load} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800"><RefreshCw className="w-4 h-4"/></button>
  </div>
  {loading?<div className="py-16 text-center text-xs text-slate-500">Calculando indicadores...</div>:<>
   <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
    {[
      ["Taxa de ocupação",k.taxaOcupacao+"%",BarChart3],
      ["Receita recebida",formatCurrency(k.receita||0),TrendingUp],
      ["Despesas pagas",formatCurrency(k.despesas||0),DollarSign],
      ["Saldo operacional",formatCurrency(k.saldo||0),Wallet],
      ["OS em aberto",k.osAbertas||0,Wrench],
    ].map(([label,value,Icon]:any)=><div key={label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"><div className="flex justify-between"><span className="text-xs text-slate-500">{label}</span><Icon className="w-4 h-4 text-blue-500"/></div><div className="mt-3 text-xl font-bold">{value}</div></div>)}
   </div>
   <div className="grid lg:grid-cols-3 gap-4">
    <section className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
     <div className="p-4 border-b border-slate-200 dark:border-slate-800"><h2 className="text-sm font-bold">Rentabilidade por imóvel</h2></div>
     <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-left bg-slate-50 dark:bg-slate-950/50 text-slate-500"><th className="p-3">Imóvel</th><th className="p-3">Receita</th><th className="p-3">Despesas</th><th className="p-3">Saldo</th><th className="p-3">OS</th></tr></thead><tbody>{(data?.porFlat||[]).map((x:any)=><tr key={x.id} className="border-t border-slate-100 dark:border-slate-800"><td className="p-3 font-semibold">{x.numero}<span className="block text-[10px] text-slate-500">{x.local}</span></td><td className="p-3">{formatCurrency(x.receita)}</td><td className="p-3">{formatCurrency(x.despesas)}</td><td className={`p-3 font-bold ${x.saldo>=0?"text-emerald-600":"text-red-600"}`}>{formatCurrency(x.saldo)}</td><td className="p-3">{x.ordens}</td></tr>)}</tbody></table></div>
    </section>
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
     <h2 className="text-sm font-bold mb-3">Alertas gerenciais</h2>
     <div className="space-y-3 text-xs">
      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300"><AlertTriangle className="w-4 h-4 inline mr-2"/> {k.vencidasReceber||0} contas vencidas a receber</div>
      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300"><CalendarClock className="w-4 h-4 inline mr-2"/> {(data?.contratosVencendo||[]).length} contratos vencem nos próximos 90 dias</div>
      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"><Building2 className="w-4 h-4 inline mr-2"/> {k.ocupados||0} de {k.totalFlats||0} imóveis ocupados</div>
     </div>
    </section>
   </div>
  </>}
 </div></Shell>
}
