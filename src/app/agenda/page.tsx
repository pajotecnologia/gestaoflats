"use client";

import React, { useState, useEffect, useMemo } from "react";
import Shell from "@/components/layout/Shell";
import { formatCurrency, formatPhone, formatCPF } from "@/lib/validation";
import { getMediaUrl } from "@/lib/media";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Building2,
  User,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sun,
  CalendarCheck,
  CalendarX,
  UserPlus,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface ReservaItem {
  contratoId: string;
  flatId: string;
  flatNumero: string;
  localNome: string;
  locatarioId: string;
  locatarioNome: string;
  locatarioTelefone: string;
  locatarioCpf: string;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
  tipoValidade: string;
  validadeDias: number | null;
  valorTotal: number;
  status: string;
  statusAssinatura: string;
  tokenAssinatura: string | null;
  formaPagamento: string | null;
}

export default function AgendaPage() {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [flats, setFlats] = useState<any[]>([]);
  const [locais, setLocais] = useState<any[]>([]);
  const [locatarios, setLocatarios] = useState<any[]>([]);
  const [modelosContrato, setModelosContrato] = useState<any[]>([]);
  const [reservas, setReservas] = useState<ReservaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroLocalId, setFiltroLocalId] = useState("");
  const [filtroFlatId, setFiltroFlatId] = useState("");
  const [viewMode, setViewMode] = useState<"CALENDARIO" | "TIMELINE">("CALENDARIO");

  // Modal de Nova Reserva
  const [showReservaModal, setShowReservaModal] = useState(false);
  const [reservaFlatId, setReservaFlatId] = useState("");
  const [reservaLocatarioId, setReservaLocatarioId] = useState("");
  const [reservaCheckIn, setReservaCheckIn] = useState("");
  const [reservaCheckOut, setReservaCheckOut] = useState("");
  const [reservaValorDiaria, setReservaValorDiaria] = useState("");
  const [reservaValorTotal, setReservaValorTotal] = useState("");
  const [reservaFormaPagamento, setReservaFormaPagamento] = useState("PIX");
  const [reservaModeloContratoId, setReservaModeloContratoId] = useState("");

  // Estado de Disponibilidade em Tempo Real da Reserva
  const [disponibilidadeReserva, setDisponibilidadeReserva] = useState<{
    checking: boolean;
    checked: boolean;
    disponivel: boolean;
    mensagem: string;
    conflitos?: any[];
  }>({
    checking: false,
    checked: false,
    disponivel: true,
    mensagem: "",
  });

  // Modal de Cadastro Rápido de Locatário
  const [showNovoLocatarioModal, setShowNovoLocatarioModal] = useState(false);
  const [novoLocatarioNome, setNovoLocatarioNome] = useState("");
  const [novoLocatarioCpf, setNovoLocatarioCpf] = useState("");
  const [novoLocatarioTelefone, setNovoLocatarioTelefone] = useState("");
  const [novoLocatarioEmail, setNovoLocatarioEmail] = useState("");
  const [salvandoLocatario, setSalvandoLocatario] = useState(false);

  // Modal de Detalhes da Reserva
  const [selectedReserva, setSelectedReserva] = useState<ReservaItem | null>(null);

  // Modal de Sucesso Pós-Reserva
  const [sucessoContrato, setSucessoContrato] = useState<any>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth() + 1;

  const loadData = async () => {
    setLoading(true);
    try {
      const [resAgenda, resLocatarios, resModelos] = await Promise.all([
        fetch(
          `/api/agenda?ano=${ano}&mes=${mes}${
            filtroLocalId ? `&localId=${filtroLocalId}` : ""
          }${filtroFlatId ? `&flatId=${filtroFlatId}` : ""}`
        ).then((r) => r.json()),
        fetch("/api/locatarios").then((r) => r.json()),
        fetch("/api/modelos-contrato").then((r) => r.json()),
      ]);

      // A API retorna apenas flats configurados para diária (DIARIA ou AMBOS)
      setFlats(resAgenda.flats || []);
      setLocais(resAgenda.locais || []);
      setReservas(resAgenda.reservas || []);
      setLocatarios(resLocatarios.locatarios || []);
      setModelosContrato(resModelos.modelos || []);
    } catch (err) {
      console.error("Erro ao carregar dados da agenda:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [ano, mes, filtroLocalId, filtroFlatId]);

  const handlePrevMonth = () => {
    setDataAtual(new Date(ano, mes - 2, 1));
  };

  const handleNextMonth = () => {
    setDataAtual(new Date(ano, mes, 1));
  };

  const handleToday = () => {
    setDataAtual(new Date());
  };

  // Cálculo automático de diárias, valor total e verificação de conflitos na agenda
  useEffect(() => {
    if (reservaCheckIn && reservaCheckOut && reservaValorDiaria) {
      const dIn = new Date(reservaCheckIn + "T00:00:00");
      const dOut = new Date(reservaCheckOut + "T00:00:00");
      const diffTime = dOut.getTime() - dIn.getTime();
      const diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
      const vDiaria = parseFloat(reservaValorDiaria) || 0;
      setReservaValorTotal((diffDays * vDiaria).toFixed(2));

      if (reservaFlatId && diffDays > 0) {
        let active = true;
        setDisponibilidadeReserva((prev) => ({ ...prev, checking: true }));

        const timer = setTimeout(async () => {
          try {
            const res = await fetch(
              `/api/contratos/verificar-disponibilidade?flatId=${reservaFlatId}&dataEmissao=${reservaCheckIn}&tipoValidade=DIAS&validadeValor=${diffDays}`
            );
            const data = await res.json();
            if (active) {
              if (res.ok) {
                setDisponibilidadeReserva({
                  checking: false,
                  checked: true,
                  disponivel: data.disponivel,
                  mensagem: data.mensagem,
                  conflitos: data.conflitos || [],
                });
              } else {
                setDisponibilidadeReserva({
                  checking: false,
                  checked: true,
                  disponivel: false,
                  mensagem: data.error || "Erro ao verificar datas.",
                });
              }
            }
          } catch (e) {
            if (active) {
              setDisponibilidadeReserva({
                checking: false,
                checked: true,
                disponivel: true,
                mensagem: "",
              });
            }
          }
        }, 200);

        return () => {
          active = false;
          clearTimeout(timer);
        };
      }
    }
  }, [reservaFlatId, reservaCheckIn, reservaCheckOut, reservaValorDiaria]);

  const handleOpenNovaReserva = (flatIdDefault?: string, dateDefault?: string) => {
    if (flats.length === 0) {
      alert("Nenhum imóvel configurado para locação por Diária/Temporada. Acesse o menu 'Flats & Condomínios' e defina a modalidade como 'Por Diária' ou 'Diária e Mensal'.");
      return;
    }

    const targetFlatId = flatIdDefault || (flats[0]?.id || "");
    const selectedFlat = flats.find((f) => f.id === targetFlatId) || flats[0];

    const hojeStr = dateDefault || new Date().toISOString().split("T")[0];
    const amanhaDate = new Date(hojeStr + "T00:00:00");
    amanhaDate.setDate(amanhaDate.getDate() + 1);
    const amanhaStr = amanhaDate.toISOString().split("T")[0];

    const valorDiaria = selectedFlat?.valorDiaria ? selectedFlat.valorDiaria.toString() : "150.00";

    setReservaFlatId(selectedFlat?.id || targetFlatId);
    setReservaLocatarioId(locatarios[0]?.id || "");
    setReservaCheckIn(hojeStr);
    setReservaCheckOut(amanhaStr);
    setReservaValorDiaria(valorDiaria);
    setReservaValorTotal(valorDiaria);
    setReservaFormaPagamento("PIX");
    setReservaModeloContratoId(modelosContrato[0]?.id || "");
    setErrorMessage("");
    setShowReservaModal(true);
  };

  const handleFlatSelectionChange = (newFlatId: string) => {
    setReservaFlatId(newFlatId);
    const selected = flats.find((f) => f.id === newFlatId);
    if (selected?.valorDiaria) {
      setReservaValorDiaria(selected.valorDiaria.toString());
    }
  };

  const handleCriarNovoLocatario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoLocatarioNome || !novoLocatarioCpf || !novoLocatarioTelefone) {
      alert("Preencha nome, CPF e telefone do locatário.");
      return;
    }

    setSalvandoLocatario(true);
    try {
      const res = await fetch("/api/locatarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: novoLocatarioNome,
          cpf: novoLocatarioCpf,
          telefone: novoLocatarioTelefone,
          email: novoLocatarioEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao cadastrar locatário.");
        return;
      }

      const resLocs = await fetch("/api/locatarios").then((r) => r.json());
      setLocatarios(resLocs.locatarios || []);
      if (data.locatario?.id) {
        setReservaLocatarioId(data.locatario.id);
      }
      setShowNovoLocatarioModal(false);
      setNovoLocatarioNome("");
      setNovoLocatarioCpf("");
      setNovoLocatarioTelefone("");
      setNovoLocatarioEmail("");
    } catch (err) {
      alert("Erro de conexão ao cadastrar locatário.");
    } finally {
      setSalvandoLocatario(false);
    }
  };

  const handleConfirmarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservaFlatId || !reservaLocatarioId || !reservaCheckIn || !reservaCheckOut) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios da reserva.");
      return;
    }

    const dIn = new Date(reservaCheckIn + "T00:00:00");
    const dOut = new Date(reservaCheckOut + "T00:00:00");
    if (dOut <= dIn) {
      setErrorMessage("A data de check-out deve ser posterior à data de check-in.");
      return;
    }

    if (disponibilidadeReserva.checked && !disponibilidadeReserva.disponivel) {
      setErrorMessage(disponibilidadeReserva.mensagem || "O período selecionado está indisponível na agenda.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const diffTime = dOut.getTime() - dIn.getTime();
      const totalDias = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

      const resContrato = await fetch("/api/contratos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locatarioId: reservaLocatarioId,
          flatId: reservaFlatId,
          modeloContratoId: reservaModeloContratoId || undefined,
          dataEmissao: reservaCheckIn,
          tipoValidade: "DIAS",
          validadeValor: totalDias.toString(),
          validadeDias: totalDias,
          valorMensal: reservaValorTotal,
          formaPagamento: reservaFormaPagamento,
          diaVencimento: 1,
        }),
      });

      const dataContrato = await resContrato.json();
      if (!resContrato.ok) {
        setErrorMessage(dataContrato.error || "Erro ao confirmar reserva.");
        return;
      }

      setShowReservaModal(false);
      setSucessoContrato(dataContrato.contrato);
      loadData();
    } catch (err: any) {
      setErrorMessage("Erro inesperado ao emitir contrato da reserva.");
    } finally {
      setSubmitting(false);
    }
  };

  // Gerador dos dias do mês para o Calendário
  const calendarDays = useMemo(() => {
    const year = dataAtual.getFullYear();
    const month = dataAtual.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Dias do mês anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: totalDaysInPrevMonth - i,
        month: month - 1,
        year,
        isCurrentMonth: false,
        dateStr: new Date(year, month - 1, totalDaysInPrevMonth - i).toISOString().split("T")[0],
      });
    }

    // Dias do mês atual
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({
        day: i,
        month,
        year,
        isCurrentMonth: true,
        dateStr: dStr,
      });
    }

    // Dias do próximo mês para completar grade
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        month: month + 1,
        year,
        isCurrentMonth: false,
        dateStr: new Date(year, month + 1, i).toISOString().split("T")[0],
      });
    }

    return days;
  }, [dataAtual]);

  // Estatísticas Rápidas do Mês (Apenas Diárias)
  const totalReservasMes = reservas.length;
  const totalDiariasMes = reservas.reduce((acc, r) => acc + (r.validadeDias || 1), 0);
  const totalFaturamentoPrevisto = reservas.reduce((acc, r) => acc + (r.valorTotal || 0), 0);

  const nomesMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header Superior */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-600/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Agenda de Reservas por Diária & Temporada</span>
                <span className="text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                  ☀️ Diárias & Temporada
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualização exclusiva de imóveis e reservas por diária com prevenção de conflito e emissão de contratos
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenNovaReserva()}
              className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-white text-xs shadow-md flex items-center space-x-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nova Reserva de Diária</span>
            </button>
          </div>
        </div>

        {/* Aviso se não houver imóveis por diária */}
        {!loading && flats.length === 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Info className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                <strong>Atenção:</strong> Nenhum imóvel está configurado para locação por <strong>Diária / Temporada</strong>. Apenas imóveis com modalidade "Por Diária" ou "Diária e Mensal" aparecem nesta agenda.
              </span>
            </div>
            <Link
              href="/flats"
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs whitespace-nowrap shadow-sm"
            >
              Configurar Imóveis
            </Link>
          </div>
        )}

        {/* Cards de Métricas de Diárias do Mês */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Imóveis p/ Diária</p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">{flats.length}</h3>
              <p className="text-[10px] text-slate-500">Flats, salões e chácaras</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reservas no Mês</p>
              <h3 className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">{totalReservasMes}</h3>
              <p className="text-[10px] text-slate-500">Contratos de temporada</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Diárias Reservadas</p>
              <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{totalDiariasMes} diárias</h3>
              <p className="text-[10px] text-slate-500">Dias ocupados no mês</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <Sun className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Faturamento Previsto</p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                {formatCurrency(totalFaturamentoPrevisto)}
              </h3>
              <p className="text-[10px] text-slate-500">Receita total em diárias</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Barra de Navegação e Filtros */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Navegação de Mês / Ano */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-4 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-extrabold text-sm text-slate-900 dark:text-slate-100 min-w-[180px] text-center">
                {nomesMeses[mes - 1]} de {ano}
              </div>

              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                title="Próximo Mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleToday}
                className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition cursor-pointer"
              >
                Hoje
              </button>
            </div>

            {/* Alternador de Modo de Visão */}
            <div className="flex items-center gap-2">
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <button
                  onClick={() => setViewMode("CALENDARIO")}
                  className={`py-1 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    viewMode === "CALENDARIO"
                      ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  📅 Grade Mensal
                </button>
                <button
                  onClick={() => setViewMode("TIMELINE")}
                  className={`py-1 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    viewMode === "TIMELINE"
                      ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  📊 Linha do Tempo
                </button>
              </div>
            </div>
          </div>

          {/* Filtros por Condomínio e Imóvel de Diária */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Condomínio / Local</label>
              <select
                value={filtroLocalId}
                onChange={(e) => {
                  setFiltroLocalId(e.target.value);
                  setFiltroFlatId("");
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="">-- Todos os Condomínios --</option>
                {locais.map((l) => (
                  <option key={l.id} value={l.id}>{l.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Imóvel por Diária</label>
              <select
                value={filtroFlatId}
                onChange={(e) => setFiltroFlatId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="">-- Todos os Imóveis de Diária --</option>
                {flats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.numero} ({f.local?.nome || "Condomínio"}) - {formatCurrency(f.valorDiaria || 0)}/dia
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* GRADE MENSAL DE DIÁRIAS */}
        {viewMode === "CALENDARIO" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <div className="min-w-[650px]">
                {/* Cabeçalho dos dias da semana */}
                <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-center text-xs font-bold text-slate-600 dark:text-slate-400 py-3">
                  <span className="text-red-500">Dom</span>
                  <span>Seg</span>
                  <span>Ter</span>
                  <span>Qua</span>
                  <span>Qui</span>
                  <span>Sex</span>
                  <span className="text-blue-500">Sáb</span>
                </div>

                {/* Células dos Dias */}
                <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/60">
                  {calendarDays.map((calDay, idx) => {
                    const isToday =
                      calDay.dateStr === new Date().toISOString().split("T")[0];

                    const reservasDoDia = reservas.filter((r) => {
                      return r.dataInicio <= calDay.dateStr && r.dataFim >= calDay.dateStr;
                    });

                    return (
                      <div
                        key={idx}
                        className={`min-h-[125px] p-2 flex flex-col justify-between transition group relative ${
                          !calDay.isCurrentMonth
                            ? "bg-slate-50/50 dark:bg-slate-950/20 opacity-40"
                            : isToday
                            ? "bg-amber-50/40 dark:bg-amber-950/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        {/* Topo da Célula com Dia e Botão de Adicionar Reserva */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center ${
                              isToday
                                ? "bg-amber-600 text-white shadow-sm"
                                : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {calDay.day}
                          </span>

                          {calDay.isCurrentMonth && (
                            <button
                              type="button"
                              onClick={() => handleOpenNovaReserva(filtroFlatId, calDay.dateStr)}
                              className="py-0.5 px-1.5 rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/70 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition cursor-pointer"
                              title="Acrescentar Reserva neste dia"
                            >
                              + Reservar
                            </button>
                          )}
                        </div>

                        {/* Lista de Reservas do Dia */}
                        <div className="space-y-1 my-1 overflow-y-auto max-h-[85px] pr-0.5">
                          {reservasDoDia.map((res, rIdx) => {
                            const isCheckIn = res.dataInicio === calDay.dateStr;
                            const isCheckOut = res.dataFim === calDay.dateStr;

                            return (
                              <div
                                key={rIdx}
                                onClick={() => setSelectedReserva(res)}
                                className={`p-1 rounded-md text-[10px] leading-tight truncate border cursor-pointer transition shadow-xs ${
                                  isCheckIn
                                    ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold"
                                  : isCheckOut
                                    ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold"
                                    : "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800 font-medium"
                                }`}
                                title={`${res.flatNumero}: ${res.locatarioNome} (${res.dataInicio} a ${res.dataFim})`}
                              >
                                {res.flatNumero}: {res.locatarioNome}
                              </div>
                            );
                          })}
                        </div>

                        {/* Rodapé da Célula: Botão explícito se estiver vazio */}
                        <div className="text-right">
                          {reservasDoDia.length === 0 && calDay.isCurrentMonth && (
                            <button
                              type="button"
                              onClick={() => handleOpenNovaReserva(filtroFlatId, calDay.dateStr)}
                              className="text-[10px] text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition cursor-pointer"
                            >
                              + Diária
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LINHA DO TEMPO POR IMÓVEL DE DIÁRIA */}
        {viewMode === "TIMELINE" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4 sticky left-0 bg-slate-50 dark:bg-slate-950 z-10 w-52 shadow-sm">
                      Imóvel de Diária
                    </th>
                    {Array.from({ length: new Date(ano, mes, 0).getDate() }, (_, i) => i + 1).map((d) => (
                      <th key={d} className="py-3 px-1 text-center min-w-[32px]">
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {flats.map((flat) => {
                    const totalDiasMes = new Date(ano, mes, 0).getDate();

                    return (
                      <tr key={flat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-sm border-r border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="font-bold">{flat.numero}</span>
                            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              {formatCurrency(flat.valorDiaria || 0)}/dia
                            </span>
                          </div>
                        </td>

                        {Array.from({ length: totalDiasMes }, (_, i) => i + 1).map((d) => {
                          const dateStr = `${ano}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                          const reservaDoDia = reservas.find(
                            (r) => r.flatId === flat.id && r.dataInicio <= dateStr && r.dataFim >= dateStr
                          );

                          return (
                            <td
                              key={d}
                              onClick={() => {
                                if (reservaDoDia) {
                                  setSelectedReserva(reservaDoDia);
                                } else {
                                  handleOpenNovaReserva(flat.id, dateStr);
                                }
                              }}
                              className={`p-1 text-center border-r border-slate-100 dark:border-slate-800/40 cursor-pointer transition ${
                                reservaDoDia
                                  ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300"
                                  : "hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                              }`}
                              title={
                                reservaDoDia
                                  ? `Reservado: ${reservaDoDia.locatarioNome} (${reservaDoDia.dataInicio} a ${reservaDoDia.dataFim})`
                                  : `Livre no dia ${d}/${mes} - Clique para acrescentar reserva`
                              }
                            >
                              {reservaDoDia ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-xs"></span>
                              ) : (
                                <span className="text-[10px] text-slate-300 dark:text-slate-700 opacity-0 hover:opacity-100 font-bold">+</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL DE NOVA RESERVA / EMISSÃO DE CONTRATO POR DIÁRIA */}
        {showReservaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Acrescentar Reserva de Diária
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Gera automaticamente o contrato de locação por temporada e a parcela no financeiro
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReservaModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleConfirmarReserva} className="space-y-4">
                {/* Imóvel de Diária */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Imóvel / Flat para Diária *
                  </label>
                  <select
                    required
                    value={reservaFlatId}
                    onChange={(e) => handleFlatSelectionChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    {flats.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.numero} ({f.local?.nome || "Condomínio"}) - {formatCurrency(f.valorDiaria || 0)}/diária
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cliente / Locatário com Botão de Novo */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Cliente / Hóspede *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNovoLocatarioModal(true)}
                      className="text-xs font-bold text-amber-600 hover:text-amber-500 flex items-center space-x-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Cadastrar Novo</span>
                    </button>
                  </div>
                  <select
                    required
                    value={reservaLocatarioId}
                    onChange={(e) => setReservaLocatarioId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="">-- Selecione o Locatário / Hóspede --</option>
                    {locatarios.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.nome} - CPF: {loc.cpf} ({loc.telefone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Período: Check-in e Check-out */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                  <div>
                    <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-1">
                      Data de Check-in (Entrada) *
                    </label>
                    <input
                      type="date"
                      required
                      value={reservaCheckIn}
                      onChange={(e) => setReservaCheckIn(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-1">
                      Data de Check-out (Saída) *
                    </label>
                    <input
                      type="date"
                      required
                      value={reservaCheckOut}
                      onChange={(e) => setReservaCheckOut(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>
                </div>

                {/* Validação em Tempo Real de Disponibilidade na Agenda */}
                {reservaFlatId && (
                  <div>
                    {disponibilidadeReserva.checking ? (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center space-x-2">
                        <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>Verificando disponibilidade de diárias na agenda...</span>
                      </div>
                    ) : disponibilidadeReserva.checked && !disponibilidadeReserva.disponivel ? (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800/80 text-red-800 dark:text-red-200 space-y-1.5 shadow-xs">
                        <div className="flex items-start space-x-2">
                          <CalendarX className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-black uppercase text-red-700 dark:text-red-300">
                              ❌ Período Indisponível
                            </span>
                            <p className="text-xs font-semibold text-red-900 dark:text-red-200 mt-0.5">
                              {disponibilidadeReserva.mensagem}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : disponibilidadeReserva.checked && disponibilidadeReserva.disponivel ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center space-x-2 shadow-xs">
                        <CalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                          ✅ Período 100% Livre na Agenda para Reserva
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Valores e Forma de Pagamento */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Valor da Diária (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={reservaValorDiaria}
                      onChange={(e) => setReservaValorDiaria(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Valor Total da Reserva *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={reservaValorTotal}
                      onChange={(e) => setReservaValorTotal(e.target.value)}
                      className="w-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300 font-extrabold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Forma de Pagamento
                    </label>
                    <select
                      value={reservaFormaPagamento}
                      onChange={(e) => setReservaFormaPagamento(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="PIX">Pix</option>
                      <option value="CARTAO">Cartão de Crédito/Débito</option>
                      <option value="BOLETO">Boleto Bancário</option>
                      <option value="DINHEIRO">Dinheiro / Espécie</option>
                      <option value="TRANSFERENCIA">Transferência / TED</option>
                    </select>
                  </div>
                </div>

                {/* Modelo de Contrato */}
                {modelosContrato.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Modelo de Contrato (Opcional)
                    </label>
                    <select
                      value={reservaModeloContratoId}
                      onChange={(e) => setReservaModeloContratoId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="">-- Modelo Padrão do Sistema --</option>
                      {modelosContrato.map((m) => (
                        <option key={m.id} value={m.id}>{m.titulo}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowReservaModal(false)}
                    className="w-1/3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || (disponibilidadeReserva.checked && !disponibilidadeReserva.disponivel)}
                    className={`w-2/3 py-2.5 rounded-xl font-bold text-white text-xs shadow-md transition flex items-center justify-center space-x-1.5 ${
                      disponibilidadeReserva.checked && !disponibilidadeReserva.disponivel
                        ? "bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-70"
                        : "bg-amber-600 hover:bg-amber-500 cursor-pointer"
                    }`}
                  >
                    {submitting ? (
                      <span>Verificando & Gerando Contrato...</span>
                    ) : disponibilidadeReserva.checked && !disponibilidadeReserva.disponivel ? (
                      <span>❌ Período Indisponível</span>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Confirmar Reserva & Gerar Contrato</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE CADASTRO RÁPIDO DE LOCATÁRIO */}
        {showNovoLocatarioModal && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
            style={{ zIndex: 100 }}
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-600" />
                  <span>Cadastrar Novo Hóspede / Locatário</span>
                </h3>
                <button
                  onClick={() => setShowNovoLocatarioModal(false)}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCriarNovoLocatario} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoLocatarioNome}
                    onChange={(e) => setNovoLocatarioNome(e.target.value)}
                    placeholder="ex: Carlos Eduardo Santos"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CPF *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoLocatarioCpf}
                    onChange={(e) => setNovoLocatarioCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      WhatsApp / Telefone *
                    </label>
                    <input
                      type="text"
                      required
                      value={novoLocatarioTelefone}
                      onChange={(e) => setNovoLocatarioTelefone(formatPhone(e.target.value))}
                      placeholder="(81) 98888-7777"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={novoLocatarioEmail}
                      onChange={(e) => setNovoLocatarioEmail(e.target.value)}
                      placeholder="hospede@email.com"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNovoLocatarioModal(false)}
                    className="w-1/3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={salvandoLocatario}
                    className="w-2/3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                  >
                    {salvandoLocatario ? "Salvando..." : "Salvar Hóspede"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE DETALHES DA RESERVA */}
        {selectedReserva && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Reserva: {selectedReserva.flatNumero}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedReserva.localNome}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReserva(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Informações do Hóspede */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Hóspede / Locatário:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedReserva.locatarioNome}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">CPF:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{selectedReserva.locatarioCpf}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Telefone:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedReserva.locatarioTelefone}</span>
                </div>
              </div>

              {/* Período e Valor */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Check-in</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                    {new Date(selectedReserva.dataInicio + "T00:00:00").toLocaleDateString("pt-BR")}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Check-out</span>
                  <strong className="text-amber-600 dark:text-amber-400 text-sm">
                    {new Date(selectedReserva.dataFim + "T00:00:00").toLocaleDateString("pt-BR")}
                  </strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-400">Valor Total ({selectedReserva.validadeDias || 1} diárias):</span>
                <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(selectedReserva.valorTotal)}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Link
                  href={`/contratos?buscar=${selectedReserva.locatarioNome}`}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs text-center shadow-md transition"
                >
                  Ver Contrato & Assinatura
                </Link>
                <button
                  onClick={() => setSelectedReserva(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE SUCESSO PÓS-EMISSÃO */}
        {sucessoContrato && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in-95">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  Reserva Confirmada com Sucesso!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  O contrato por diárias e as parcelas a receber foram gerados com sucesso no banco de dados.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-left space-y-1">
                <p><strong>Imóvel:</strong> {sucessoContrato.flat?.numero || "Flat"}</p>
                <p><strong>Hóspede:</strong> {sucessoContrato.locatario?.nome || "Locatário"}</p>
                <p><strong>Período:</strong> {sucessoContrato.validadeDias || 1} diária(s)</p>
                <p><strong>Valor Total:</strong> {formatCurrency(sucessoContrato.valorMensal)}</p>
              </div>

              <div className="space-y-2 pt-2">
                <Link
                  href={`/contratos?buscar=${sucessoContrato.locatario?.nome || ""}`}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>Acessar Gestão de Contratos</span>
                </Link>

                <button
                  onClick={() => setSucessoContrato(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
                >
                  Fechar e Continuar na Agenda
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
