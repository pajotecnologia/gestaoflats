"use client";

import { useMemo } from "react";
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

const startOfGrid = (date: Date) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const day = first.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return new Date(date.getFullYear(), date.getMonth(), 1 + mondayOffset);
};

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const overlapsDay = (reservation: CalendarReservation, day: Date) => {
  const start = new Date(reservation.dataEntrada);
  const end = new Date(reservation.dataSaida);
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  return start < dayEnd && end > dayStart;
};

export default function AgendaCalendar({
  reservations,
  selectedFlatId,
  selectedStatus,
  month,
  onMonthChange,
  onSelectReservation,
  onCreate,
}: Props) {
  const days = useMemo(() => {
    const start = startOfGrid(month);
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [month]);

  const visible = useMemo(
    () =>
      reservations.filter(
        (reservation) =>
          (!selectedFlatId || reservation.flat.id === selectedFlatId) &&
          (!selectedStatus || reservation.status === selectedStatus)
      ),
    [reservations, selectedFlatId, selectedStatus]
  );

  const monthLabel = month.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold capitalize text-slate-900 dark:text-slate-100">{monthLabel}</h2>
          <p className="text-[11px] text-slate-500">Clique em uma reserva para abrir seus detalhes ou em um dia para criar uma reserva.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-lg border p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => onMonthChange(new Date())} className="rounded-lg border px-3 py-2 text-[10px] font-bold dark:border-slate-700">Hoje</button>
          <button type="button" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-lg border p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Próximo mês">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid min-w-[760px] grid-cols-7 border-b border-slate-200 dark:border-slate-800">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
          <div key={day} className="border-r border-slate-200 px-2 py-2 text-[10px] font-bold uppercase text-slate-400 dark:border-slate-800">{day}</div>
        ))}
      </div>

      <div className="grid min-w-[760px] grid-cols-7">
        {days.map((day) => {
          const inMonth = day.getMonth() === month.getMonth();
          const dayReservations = visible.filter((reservation) => overlapsDay(reservation, day));
          const isToday = dateKey(day) === dateKey(new Date());

          return (
            <div key={dateKey(day)} className={`min-h-[118px] border-b border-r border-slate-200 p-1.5 dark:border-slate-800 ${inMonth ? "bg-white dark:bg-slate-900" : "bg-slate-50/70 dark:bg-slate-950/40"}`}>
              <button type="button" onClick={() => onCreate(dateKey(day))} className="mb-1 flex w-full items-center justify-between rounded-md px-1 py-0.5 text-left hover:bg-blue-50 dark:hover:bg-blue-950/30">
                <span className={`text-[10px] font-bold ${isToday ? "rounded-full bg-blue-600 px-1.5 py-0.5 text-white" : inMonth ? "text-slate-700 dark:text-slate-300" : "text-slate-400"}`}>{day.getDate()}</span>
                <Plus className="h-3 w-3 text-slate-300" />
              </button>
              <div className="space-y-1">
                {dayReservations.slice(0, 4).map((reservation) => (
                  <button key={reservation.id} type="button" onClick={() => onSelectReservation(reservation)} className="block w-full truncate rounded-md px-1.5 py-1 text-left text-[9px] font-semibold text-white shadow-sm hover:opacity-90" title={`${reservation.codigo} • ${reservation.locatario.nome} • Flat ${reservation.flat.numero}`}>
                    <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle ${statusColors[reservation.status] || "bg-slate-500"}`} />
                    <span className="truncate">{reservation.flat.numero} • {reservation.locatario.nome}</span>
                  </button>
                ))}
                {dayReservations.length > 4 && <div className="px-1 text-[9px] font-semibold text-slate-400">+{dayReservations.length - 4} reservas</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
        {Object.entries(statusColors).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1 text-[9px] text-slate-500">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            {status.replaceAll("_", " ")}
          </span>
        ))}
      </div>
    </div>
  );
}
