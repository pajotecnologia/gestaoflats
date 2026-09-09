"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  AlertTriangle,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  X,
  RefreshCw,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

function formatBRL(val: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
}

export interface AlertaItem {
  id: string;
  tipo:
    | "RECEBER_ATRASADO"
    | "RECEBER_PROXIMO"
    | "CONTRATO_EXPIRADO"
    | "CONTRATO_EXPIRANDO"
    | "PAGAR_ATRASADO"
    | "PAGAR_PROXIMO"
    | "RESERVA_CHECKIN"
    | "RESERVA_CHECKOUT";
  categoria: "financeiro" | "contratos" | "operacional";
  nivel: "critico" | "atencao" | "info";
  titulo: string;
  subtitulo: string;
  detalhes?: string;
  valor?: number;
  data: string;
  dias: number;
  link: string;
  whatsapp?: string;
  meta?: Record<string, any>;
}

export interface AlertasResponse {
  alertas: AlertaItem[];
  contadores: {
    total: number;
    criticos: number;
    atencao: number;
    info: number;
    financeiro: number;
    contratos: number;
    operacional: number;
  };
  timestamp: string;
}

interface FloatingAlertsHubProps {
  // Opcional para disparar externamente (ex: do topbar)
  isExternalOpen?: boolean;
  onExternalToggle?: () => void;
  showFloatingButton?: boolean;
}

export default function FloatingAlertsHub({
  isExternalOpen,
  onExternalToggle,
  showFloatingButton = true,
}: FloatingAlertsHubProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AlertasResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"todos" | "urgentes" | "financeiro" | "contratos" | "operacional">("todos");

  const isOpen = isExternalOpen !== undefined ? isExternalOpen : internalOpen;

  const toggleOpen = () => {
    if (onExternalToggle) {
      onExternalToggle();
    } else {
      setInternalOpen((prev) => !prev);
    }
  };

  const carregarAlertas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/alertas", { cache: "no-store" });
      if (res.ok) {
        const json: AlertasResponse = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Erro ao carregar alertas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega na montagem e define intervalo de atualização a cada 60 segundos
  useEffect(() => {
    carregarAlertas();
    const interval = setInterval(carregarAlertas, 60000);
    return () => clearInterval(interval);
  }, [carregarAlertas]);

  const totalCriticos = data?.contadores?.criticos || 0;
  const totalAlertas = data?.contadores?.total || 0;

  // Filtragem dos alertas por aba
  const alertasFiltrados = (data?.alertas || []).filter((item) => {
    if (activeTab === "todos") return true;
    if (activeTab === "urgentes") return item.nivel === "critico";
    if (activeTab === "financeiro") return item.categoria === "financeiro";
    if (activeTab === "contratos") return item.categoria === "contratos";
    if (activeTab === "operacional") return item.categoria === "operacional";
    return true;
  });

  const getAlertaIcon = (item: AlertaItem) => {
    switch (item.tipo) {
      case "RECEBER_ATRASADO":
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case "RECEBER_PROXIMO":
        return <TrendingUp className="w-5 h-5 text-amber-500" />;
      case "PAGAR_ATRASADO":
        return <DollarSign className="w-5 h-5 text-rose-500" />;
      case "PAGAR_PROXIMO":
        return <Clock className="w-5 h-5 text-amber-500" />;
      case "CONTRATO_EXPIRADO":
        return <FileText className="w-5 h-5 text-rose-500" />;
      case "CONTRATO_EXPIRANDO":
        return <FileText className="w-5 h-5 text-amber-500" />;
      case "RESERVA_CHECKIN":
      case "RESERVA_CHECKOUT":
        return <Calendar className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNivelBadge = (nivel: "critico" | "atencao" | "info") => {
    if (nivel === "critico") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          🚨 Urgente
        </span>
      );
    }
    if (nivel === "atencao") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          ⚠️ Atenção
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        ℹ️ Diária
      </span>
    );
  };

  const handleCobrarWhatsApp = (item: AlertaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.whatsapp) return;
    const telLimpo = item.whatsapp.replace(/\D/g, "");
    if (!telLimpo) return;

    let mensagem = `Olá! Tudo bem? Passando para lembrar sobre a pendência referente a *${item.subtitulo}* no valor de *${
      item.valor ? formatBRL(item.valor) : ""
    }*. Qualquer dúvida estamos à disposição!`;

    if (item.tipo === "CONTRATO_EXPIRANDO" || item.tipo === "CONTRATO_EXPIRADO") {
      mensagem = `Olá! Tudo bem? Gostaríamos de conversar sobre a renovação do contrato de locação referente a *${item.subtitulo}*. Ficamos à disposição!`;
    }

    const url = `https://wa.me/55${telLimpo}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
  };

  const handleNavegar = (link: string) => {
    toggleOpen();
    router.push(link);
  };

  return (
    <>
      {/* 1. Botão Flutuante (Floating Action Button) */}
      {showFloatingButton && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center select-none group">
          <button
            onClick={toggleOpen}
            aria-label="Abrir Central de Alertas e Notificações"
            className={`relative flex items-center justify-center w-14 h-14 rounded-2xl shadow-2xl transition-all duration-300 transform active:scale-95 ${
              totalCriticos > 0
                ? "bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 text-white shadow-rose-500/40 hover:scale-105 hover:shadow-rose-500/60"
                : totalAlertas > 0
                ? "bg-gradient-to-tr from-amber-500 via-indigo-600 to-blue-600 text-white shadow-blue-500/30 hover:scale-105 hover:shadow-blue-500/50"
                : "bg-gradient-to-tr from-slate-800 to-slate-900 dark:from-slate-800 dark:to-slate-700 text-white shadow-slate-900/40 hover:scale-105"
            }`}
          >
            {/* Ícone com rotação sutil */}
            <Bell className={`w-6 h-6 transition-transform group-hover:rotate-12 ${totalCriticos > 0 ? "animate-bounce" : ""}`} />

            {/* Badge Contador de Alertas */}
            {totalAlertas > 0 && (
              <>
                <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center">
                  {totalCriticos > 0 && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex items-center justify-center rounded-full h-5 min-w-[20px] px-1 text-[11px] font-black text-white shadow-md ${
                      totalCriticos > 0 ? "bg-rose-600" : "bg-blue-600"
                    }`}
                  >
                    {totalAlertas > 99 ? "99+" : totalAlertas}
                  </span>
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 2. Backdrop do Drawer */}
      {isOpen && (
        <div
          onClick={toggleOpen}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
        />
      )}

      {/* 3. Gaveta Lateral de Alertas (Slide-over Drawer) */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[460px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Topo do Painel de Alertas */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/90 backdrop-blur flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                totalCriticos > 0
                  ? "bg-gradient-to-tr from-rose-600 to-amber-500 shadow-rose-500/20"
                  : "bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/20"
              }`}
            >
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-extrabold text-slate-900 dark:text-slate-100 text-base leading-tight">
                  Central de Alertas
                </h2>
                {totalAlertas > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white ${
                      totalCriticos > 0 ? "bg-rose-600" : "bg-blue-600"
                    }`}
                  >
                    {totalAlertas}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Vencimentos, atrasos e contratos em tempo real
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={carregarAlertas}
              disabled={loading}
              title="Atualizar Alertas"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-500" : ""}`} />
            </button>
            <button
              onClick={toggleOpen}
              title="Fechar Painel"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Abas de Filtros Rápidos */}
        <div className="flex items-center gap-1.5 p-3 px-4 border-b border-slate-200/80 dark:border-slate-800/80 overflow-x-auto text-xs font-bold no-scrollbar bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab("todos")}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === "todos"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Todos ({totalAlertas})
          </button>
          <button
            onClick={() => setActiveTab("urgentes")}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition flex items-center space-x-1 ${
              activeTab === "urgentes"
                ? "bg-rose-600 text-white shadow-xs shadow-rose-500/20"
                : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            }`}
          >
            <span>🚨 Urgentes</span>
            <span>({totalCriticos})</span>
          </button>
          <button
            onClick={() => setActiveTab("financeiro")}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === "financeiro"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            💰 Financeiro ({data?.contadores?.financeiro || 0})
          </button>
          <button
            onClick={() => setActiveTab("contratos")}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === "contratos"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            📑 Contratos ({data?.contadores?.contratos || 0})
          </button>
          <button
            onClick={() => setActiveTab("operacional")}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === "operacional"
                ? "bg-cyan-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            📅 Diárias ({data?.contadores?.operacional || 0})
          </button>
        </div>

        {/* Lista de Alertas com Scroll Suave de 8px */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && !data ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-xs font-semibold">Carregando alertas do sistema...</p>
            </div>
          ) : alertasFiltrados.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Tudo em dia por aqui! 🎉</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                Nenhum alerta pendente para a categoria selecionada. O sistema continuará monitorando em segundo plano.
              </p>
            </div>
          ) : (
            alertasFiltrados.map((item) => {
              const Icon = getAlertaIcon(item);
              const isCritico = item.nivel === "critico";

              return (
                <div
                  key={item.id}
                  onClick={() => handleNavegar(item.link)}
                  className={`group relative p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs ${
                    isCritico
                      ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40 hover:border-rose-400 dark:hover:border-rose-700 hover:shadow-md"
                      : item.nivel === "atencao"
                      ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 hover:border-amber-400 dark:hover:border-amber-700 hover:shadow-md"
                      : "bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        isCritico
                          ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
                          : item.nivel === "atencao"
                          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                          : "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {Icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                          {item.titulo}
                        </span>
                        {getNivelBadge(item.nivel)}
                      </div>

                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                        {item.subtitulo}
                      </p>

                      {item.detalhes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {item.detalhes}
                        </p>
                      )}

                      {/* Rodapé do Card: Valor e Ações Rápidas */}
                      <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-200/60 dark:border-slate-700/50">
                        {item.valor !== undefined && item.valor > 0 ? (
                          <div className="flex items-baseline space-x-1">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Valor:</span>
                            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                              {formatBRL(item.valor)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Data: {item.data}</span>
                        )}

                        <div className="flex items-center space-x-1.5">
                          {item.whatsapp && (
                            <button
                              type="button"
                              onClick={(e) => handleCobrarWhatsApp(item, e)}
                              title="Cobrar / Notificar no WhatsApp"
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition shadow-xs"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </button>
                          )}

                          <span className="inline-flex items-center space-x-0.5 text-blue-600 dark:text-blue-400 text-[11px] font-bold group-hover:translate-x-0.5 transition-transform">
                            <span>Ver</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé Informativo */}
        <div className="p-3.5 px-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Atualizado a cada 60s</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {totalAlertas} alerta(s) ativo(s)
          </span>
        </div>
      </aside>
    </>
  );
}
