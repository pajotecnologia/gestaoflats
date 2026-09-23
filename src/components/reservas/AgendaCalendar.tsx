"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

type CalendarReservation = {
  id: string;
  codigo: string;
  dataEntrada: string;
  dataSaida: string;
  status: string;
  locatario: { nome: string };
  flat: { id: string; numero: string };
};

type Props = {
  reservations: CalendarReservation[];
  selectedFlatId: string;
  selectedStatus: string;
  month: Date;
  onMonthChange: (date: Date) => void;
  onSelectReservation: (reservation: CalendarReservation) => void;
  onCreate: (date: string) => void;
};

const statusColors: Record<string, string> = {
  SOLICITADA: "bg-slate-500",
  PRE_RESERVA: "bg-amber-500",
  AGUARDANDO_PAGAMENTO: "bg-orange-500",
  CONFIRMADA: "bg-blue-500",
  CHECK_IN: "bg-cyan-500",
  EM_ESTADIA: "bg-emerald-500",
  CHECK_OUT: "bg-violet-500",
  FINALIZADA: "bg-green-500",
  CANCELADA: "bg-red-500",
};

const dateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const monday = (date: Date) => {
  const day = date.getDay();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + (day === 0 ? -6 : 1 - day));
};

const overlapsDay = (reservation: CalendarReservation, day: Date) => {
  const start = new Date(reservation.dataEntrada);
  const end = new Date(reservation.dataSaida);
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const dayEnd = addDays(dayStart, 1);
  return start < dayEnd && end > dayStart;
};

const dayReservations = (reservations: CalendarReservation[], day: Date) =>
  reservations.filter((reservation) => overlapsDay(reservation, day));

export default function AgendaCalendar(props: Props) {
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const { reservations, selectedFlatId, selectedStatus, month, onMonthChange, onSelectReservation, onCreate } = props;

  const visible = useMemo(
    () => reservations.filter(
      (r) => (!selectedFlatId || r.flat.id === selectedFlatId) && (!selectedStatus || r.status === selectedStatus)
    ),
    [reservations, selectedFlatId, selectedStatus]
  );

  const anchor = useMemo(
    () => (view === "month" ? new Date(month.getFullYear(), month.getMonth(), 1) : month),
    [view, month]
  );
  const monthLabel = anchor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const weekDays = useMemo(() => {
    const start = monday(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [anchor]);
  const monthDays = useMemo(() => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const start = monday(first);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [anchor]);

  const navigate = (delta: number) => {
    if (view === "month") onMonthChange(new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1));
    else if (view === "week") onMonthChange(addDays(anchor, delta * 7));
    else onMonthChange(addDays(anchor, delta));
  };

  const renderDay = (day: Date, compact = false) => {
    const items = dayReservations(visible, day);
    const today = dateKey(day) === dateKey(new Date());
    return (
      <div className={`min-h-[118px] border-b border-r border-slate-200 p-1.5 dark:border-slate-800 ${compact ? "bg-white dark:bg-slate-900" : ""}`}>
        <button type="button" onClick={() => onCreate(dateKey(day))} className="mb-1 flex w-full items-center justify-between rounded-md px-1 py-0.5 text-left hover:bg-blue-50 dark:hover:bg-blue-950/30">
          <span className={`text-[10px] font-bold ${today ? "rounded-full bg-blue-600 px-1.5 py-0.5 text-white" : "text-slate-700 dark:text-slate-300"}`}>{day.getDate()}</span>
          <Plus className="h-3 w-3 text-slate-300" />
        </button>
        <div className="space-y-1">
          {items.slice(0, 5).map((r) => (
            <button key={r.id} type="button" onClick={() => onSelectReservation(r)} className={`block w-full truncate rounded-md px-1.5 py-1 text-left text-[9px] font-semibold text-white shadow-sm hover:opacity-90 ${statusColors[r.status] || "bg-slate-500"}`} title={`${r.codigo} • ${r.locatario.nome} • Flat ${r.flat.numero}`}>
              Flat {r.flat.numero} • {r.locatario.nome}
            </button>
          ))}
          {items.length > 5 && <div className="px-1 text-[9px] font-semibold text-slate-400">+{items.length - 5} reservas</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold capitalize text-slate-900 dark:text-slate-100">{monthLabel}</h2>
          <p className="text-[11px] text-slate-500">Clique em uma reserva para abrir detalhes ou em um dia para iniciar uma nova reserva.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {([["month", "Mês"], ["week", "Semana"], ["day", "Dia"]] as const).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setView(value)} className={`rounded-lg px-3 py-2 text-[10px] font-bold ${view === value ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}>{label}</button>
          ))}
          <button type="button" onClick={() => navigate(-1)} className="rounded-lg border p-2 dark:border-slate-700" aria-label="Anterior"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => onMonthChange(new Date())} className="rounded-lg border px-3 py-2 text-[10px] font-bold dark:border-slate-700">Hoje</button>
          <button type="button" onClick={() => navigate(1)} className="rounded-lg border p-2 dark:border-slate-700" aria-label="Próximo"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {view === "month" && (
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => <div key={d} className="border-r px-2 py-2 text-[10px] font-bold uppercase text-slate-400 dark:border-slate-800">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day) => <div key={dateKey(day)} className={day.getMonth() === anchor.getMonth() ? "" : "opacity-45"}>{renderDay(day, true)}</div>)}
          </div>
        </div>
      )}

      {view === "week" && (
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
            {weekDays.map((day) => <div key={dateKey(day)} className="border-r px-2 py-2 text-[10px] font-bold text-slate-500 dark:border-slate-800">{day.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" })}</div>)}
          </div>
          <div className="grid grid-cols-7">{weekDays.map((day) => <div key={dateKey(day)}>{renderDay(day)}</div>)}</div>
        </div>
      )}

      {view === "day" && (
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{anchor.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</div>
            <button type="button" onClick={() => onCreate(dateKey(anchor))} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-bold text-white"><Plus className="h-3 w-3" /> Nova reserva</button>
          </div>
          <div className="space-y-2">
            {dayReservations(visible, anchor).map((r) => <button key={r.id} type="button" onClick={() => onSelectReservation(r)} className={`block w-full rounded-xl px-3 py-3 text-left text-xs font-semibold text-white ${statusColors[r.status] || "bg-slate-500"}`}> <div>{r.codigo} • Flat {r.flat.numero}</div><div className="mt-1 text-[10px] font-medium opacity-90">{r.locatario.nome}</div></button>)}
            {dayReservations(visible, anchor).length === 0 && <button type="button" onClick={() => onCreate(dateKey(anchor))} className="w-full rounded-xl border border-dashed p-8 text-xs text-slate-500 hover:border-blue-400">Nenhuma reserva neste dia. Clique para criar.</button>}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
        {Object.entries(statusColors).map(([status, color]) => <span key={status} className="flex items-center gap-1 text-[9px] text-slate-500"><span className={`h-2 w-2 rounded-full ${color}`} />{status.replaceAll("_", " ")}</span>)}
      </div>
    </div>
  );
}
