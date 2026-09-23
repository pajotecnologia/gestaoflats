"use client";

import React, { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import Link from "next/link";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Calendar,
  DollarSign,
  Receipt,
  CreditCard,
  ChevronLeft,
  Building2,
  User,
  Wrench,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
} from "lucide-react";
import { formatCurrency } from "@/lib/validation";
import { toast } from "sonner";

export default function FinanceiroPage() {
  const [dataGeral, setDataGeral] = useState<any>({ kpis: {}, meses: [], receber: [], pagar: [] });
  const [caixaDia, setCaixaDia] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [loadingCaixa, setLoadingCaixa] = useState(true);

  const loadFluxo = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/financeiro/fluxo-caixa");
      const d = await res.json();
      if (res.ok) setDataGeral(d);
    } catch (err) {
      console.error("Erro ao carregar fluxo geral:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCaixaDia = async (data: string) => {
    setLoadingCaixa(true);
    try {
      const res = await fetch(`/api/financeiro/caixa-dia?data=${data}`);
      const d = await res.json();
      if (res.ok) setCaixaDia(d);
    } catch (err) {
      console.error("Erro ao carregar caixa do dia:", err);
    } finally {
      setLoadingCaixa(false);
    }
  };

  useEffect(() => {
    loadFluxo();
    loadCaixaDia(selectedDate);
  }, [selectedDate]);

  const handleMudarDia = (delta: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const k = dataGeral.kpis || {};
  const max = Math.max(
    1,
    ...(dataGeral.meses || []).map((m: any) =>
      Math.max(m.previstoReceber || 0, m.previstoPagar || 0, m.recebido || 0, m.pago || 0)
    )
  );

  const atrasados = (dataGeral.receber || []).filter((x: any) => x.status === "ATRASADO").slice(0, 6);
  const proxReceber = (dataGeral.receber || []).filter((x: any) => x.status !== "PAGO").slice(0, 5);
  const proxPagar = (dataGeral.pagar || []).filter((x: any) => x.status !== "PAGO").slice(0, 5);

  const isHoje = selectedDate === new Date().toISOString().split("T")[0];

  return (
    <Shell>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Gestão Financeira & Caixa
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Centro Financeiro & Caixa do Dia
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Movimentações em tempo real, pagamentos de O.S, recebimentos de aluguel e fluxo de caixa
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/financeiro/receber"
              className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center space-x-1.5 transition"
            >
              <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
              <span>Contas a Receber</span>
            </Link>

            <Link
              href="/financeiro/pagar"
              className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-bold text-xs flex items-center space-x-1.5 transition"
            >
              <ArrowUpCircle className="w-4 h-4 text-rose-600" />
              <span>Contas a Pagar</span>
            </Link>

            <button
              onClick={() => {
                loadFluxo();
                loadCaixaDia(selectedDate);
                toast.success("Dados financeiros atualizados!");
              }}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Atualizar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BLOCO DESTAQUE: CAIXA DO DIA (ENTRADAS, SAÍDAS DE O.S E SALDO) */}
        {/* ========================================================================= */}
        <section className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight">Livro Caixa Diário</h2>
                  {isHoje && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      HOJE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Todas as entradas e saídas de caixa liquidadas na data selecionada
                </p>
              </div>
            </div>

            {/* Navegador de Dias do Caixa */}
            <div className="flex items-center space-x-2 bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700">
              <button
                onClick={() => handleMudarDia(-1)}
                className="p-1.5 rounded-xl hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Dia anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-white px-2 py-1 focus:outline-none cursor-pointer"
              />

              <button
                onClick={() => handleMudarDia(1)}
                className="p-1.5 rounded-xl hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Próximo dia"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cards de Métricas do Caixa do Dia */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Entradas do Dia
                </span>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  {formatCurrency(caixaDia?.totalEntradas || 0)}
                </p>
                <span className="text-[10px] text-slate-400">
                  {caixaDia?.quantidadeEntradas || 0} recebimento(s)
                </span>
              </div>
              <ArrowDownCircle className="w-8 h-8 text-emerald-500/40" />
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/50 border border-rose-500/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" /> Saídas do Dia (O.S / Despesas)
                </span>
                <p className="text-2xl font-black text-rose-400 mt-1">
                  {formatCurrency(caixaDia?.totalSaidas || 0)}
                </p>
                <span className="text-[10px] text-slate-400">
                  {caixaDia?.quantidadeSaidas || 0} pagamento(s)
                </span>
              </div>
              <ArrowUpCircle className="w-8 h-8 text-rose-500/40" />
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/50 border border-blue-500/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Saldo Líquido do Dia
                </span>
                <p
                  className={`text-2xl font-black mt-1 ${
                    (caixaDia?.saldoDia || 0) >= 0 ? "text-blue-400" : "text-rose-400"
                  }`}
                >
                  {formatCurrency(caixaDia?.saldoDia || 0)}
                </p>
                <span className="text-[10px] text-slate-400">Resultado em caixa na data</span>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500/40" />
            </div>
          </div>

          {/* Listagem de Lançamentos do Dia */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Movimentações do Dia ({new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR")})
            </h3>

            {loadingCaixa ? (
              <div className="p-6 text-center text-xs text-slate-400">Carregando movimentações do dia...</div>
            ) : !caixaDia || (caixaDia.entradas.length === 0 && caixaDia.saidas.length === 0) ? (
              <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-800 text-center text-xs text-slate-400">
                Nenhuma entrada ou saída financeira registrada nesta data.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Entradas */}
                {caixaDia.entradas.map((e: any) => (
                  <div
                    key={e.id}
                    className="p-3 rounded-2xl bg-slate-800/40 border border-emerald-500/20 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                        <ArrowDownCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{e.descricao}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300">
                            ENTRADA
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {e.locatario} {e.imovel ? `• ${e.imovel}` : ""} • {e.formaPagamento}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-black text-sm text-emerald-400">
                      +{formatCurrency(e.valor)}
                    </span>
                  </div>
                ))}

                {/* Saídas e O.S */}
                {caixaDia.saidas.map((s: any) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-2xl bg-slate-800/40 border border-rose-500/20 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 rounded-xl bg-rose-500/20 text-rose-400">
                        <ArrowUpCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{s.descricao}</span>
                          {s.origem === "ORDEM_SERVICO" && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                              <Wrench className="w-2.5 h-2.5" />
                              <span>O.S / Manutenção</span>
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-rose-500/20 text-rose-300">
                            SAÍDA
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {s.fornecedor ? `Prestador: ${s.fornecedor}` : "Despesa Operacional"}{" "}
                          {s.imovel ? `• ${s.imovel}` : ""} • {s.formaPagamento}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-black text-sm text-rose-400">
                      -{formatCurrency(s.valor)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* KPIs GERAIS DO MÊS */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Recebido no Mês", valor: formatCurrency(k.recebimentos || 0), color: "text-emerald-600" },
            { label: "Pago no Mês", valor: formatCurrency(k.pagamentos || 0), color: "text-rose-600" },
            {
              label: "Saldo Mensal",
              valor: formatCurrency(k.saldo || 0),
              color: (k.saldo || 0) >= 0 ? "text-blue-600" : "text-rose-600",
            },
            { label: "A Receber", valor: formatCurrency(k.abertoReceber || 0), color: "text-amber-600" },
            { label: "A Pagar", valor: formatCurrency(k.abertoPagar || 0), color: "text-orange-600" },
            { label: "Inadimplência", valor: formatCurrency(k.inadimplenteReceber || 0), color: "text-rose-600" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {item.label}
              </span>
              <p className={`mt-1 text-base font-black ${item.color}`}>{item.valor}</p>
            </div>
          ))}
        </div>

        {/* Fluxo de Caixa Mensal e Inadimplência */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Fluxo Financeiro (Últimos Meses)
                </h2>
                <p className="text-xs text-slate-500">Previsto × Realizado</p>
              </div>
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>

            <div className="space-y-4">
              {(dataGeral.meses || []).map((m: any) => (
                <div key={m.mes} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{m.mes}</span>
                    <span className={m.saldo >= 0 ? "text-emerald-600" : "text-rose-600"}>
                      Saldo: {formatCurrency(m.saldo)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="h-2 rounded-full bg-blue-100 dark:bg-blue-950 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (m.previstoReceber / max) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Receber: {formatCurrency(m.recebido)} / {formatCurrency(m.previstoReceber)}
                      </span>
                    </div>
                    <div>
                      <div className="h-2 rounded-full bg-rose-100 dark:bg-rose-950 overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (m.previstoPagar / max) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Pagar: {formatCurrency(m.pago)} / {formatCurrency(m.previstoPagar)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Alertas de Inadimplência */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">Inadimplência em Aberto</h2>
            </div>

            {atrasados.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Nenhuma parcela vencida no momento.
              </div>
            ) : (
              <div className="space-y-2">
                {atrasados.map((c: any) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {c.locatario?.nome || "Locatário"}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        Venc: {new Date(c.dataVencimento).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <span className="font-bold text-rose-600">
                      {formatCurrency(c.valor - Number(c.valorPago || 0))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Próximos Recebimentos e Próximos Pagamentos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-xs flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
                <span>Próximos Recebimentos</span>
              </h3>
              <Link href="/financeiro/receber" className="text-xs font-bold text-blue-600 hover:underline">
                Ver todos
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {proxReceber.map((c: any) => (
                <div key={c.id} className="p-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold">{c.locatario?.nome}</p>
                    <span className="text-[10px] text-slate-500">
                      Venc: {new Date(c.dataVencimento).toLocaleDateString("pt-BR")} • {c.status}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(c.valor - Number(c.valorPago || 0))}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-xs flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                <ArrowUpCircle className="w-4 h-4 text-rose-600" />
                <span>Próximas Contas a Pagar</span>
              </h3>
              <Link href="/financeiro/pagar" className="text-xs font-bold text-blue-600 hover:underline">
                Ver todos
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {proxPagar.map((c: any) => (
                <div key={c.id} className="p-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold">{c.descricao}</p>
                    <span className="text-[10px] text-slate-500">
                      Venc: {new Date(c.dataVencimento).toLocaleDateString("pt-BR")} • {c.status}
                    </span>
                  </div>
                  <span className="font-bold text-rose-600">
                    {formatCurrency(c.valor - Number(c.valorPago || 0))}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Shell>
  );
}