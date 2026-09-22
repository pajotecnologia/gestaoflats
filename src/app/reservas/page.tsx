"use client";

import { useEffect, useMemo, useState } from "react";
import Shell from "@/components/layout/Shell";
import { CalendarDays, CheckCircle2, Clock3, Plus, RefreshCw, Search, UserRound, XCircle, Filter } from "lucide-react";
import AgendaCalendar from "@/components/reservas/AgendaCalendar";

type Reserva = {
  id: string;
  codigo: string;
  dataEntrada: string;
  dataSaida: string;
  horaEntrada?: string | null;
  horaSaida?: string | null;
  quantidadePessoas: number;
  valorTotal: number;
  valorPendente: number;
  status: string;
  locatario: { id: string; nome: string; telefone?: string | null };
  flat: { id: string; numero: string; local?: { nome: string } | null };
};

type Option = { id: string; nome?: string; numero?: string };

const statusLabels: Record<string, string> = {
  SOLICITADA: "Solicitada",
  PRE_RESERVA: "Pré-reserva",
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  CONFIRMADA: "Confirmada",
  CHECK_IN: "Check-in",
  EM_ESTADIA: "Em estadia",
  CHECK_OUT: "Check-out",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

const statusClasses: Record<string, string> = {
  SOLICITADA: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PRE_RESERVA: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  AGUARDANDO_PAGAMENTO: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300",
  CONFIRMADA: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  CHECK_IN: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300",
  EM_ESTADIA: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  CHECK_OUT: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300",
  FINALIZADA: "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300",
  CANCELADA: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
};

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

const dateBR = (value: string) => new Date(value).toLocaleDateString("pt-BR");

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [locatarios, setLocatarios] = useState<Option[]>([]);
  const [flats, setFlats] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [agendaMonth, setAgendaMonth] = useState(new Date());
  const [selectedFlatId, setSelectedFlatId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedReservation, setSelectedReservation] = useState<Reserva | null>(null);
  const [form, setForm] = useState({
    locatarioId: "",
    flatId: "",
    dataEntrada: "",
    dataSaida: "",
    horaEntrada: "14:00",
    horaSaida: "11:00",
    quantidadePessoas: "1",
    valorDiaria: "",
    desconto: "0",
    taxas: "0",
    caucao: "0",
    valorRecebido: "0",
    origem: "DIRETO",
    observacao: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [r, l, f] = await Promise.all([
        fetch("/api/reservas"),
        fetch("/api/locatarios"),
        fetch("/api/flats"),
      ]);
      const rd = await r.json();
      const ld = await l.json();
      const fd = await f.json();
      setReservas(rd.reservas || []);
      setLocatarios((ld.locatarios || []).map((x: any) => ({ id: x.id, nome: x.nome })));
      setFlats((fd.flats || []).map((x: any) => ({ id: x.id, numero: x.numero, nome: x.local?.nome })));
    } catch {
      setMessage("Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return reservas;
    return reservas.filter((r) =>
      [r.codigo, r.locatario.nome, r.flat.numero, r.flat.local?.nome || "", statusLabels[r.status] || r.status]
        .join(" ").toLowerCase().includes(term)
    );
  }, [reservas, search]);

  const openCreateForDate = (date: string) => {
    setForm(prev => ({ ...prev, dataEntrada: date, dataSaida: date }));
    setShowForm(true);
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível criar a reserva.");
      setMessage("Reserva criada com sucesso.");
      setShowForm(false);
      setForm({ ...form, locatarioId: "", flatId: "", dataEntrada: "", dataSaida: "", valorDiaria: "", observacao: "" });
      await load();
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id: string, status: string) => {
    const response = await fetch("/api/reservas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Não foi possível atualizar a reserva.");
      return;
    }
    await load();
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Reservas & Agenda</h1>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Controle de disponibilidade, reservas, check-in e check-out em um único fluxo.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              <RefreshCw className="h-4 w-4" /> Atualizar
            </button>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700">
              <Plus className="h-4 w-4" /> Nova reserva
            </button>
          </div>
        </div>

        {message && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ["Ativas", reservas.filter(r => !["CANCELADA", "FINALIZADA"].includes(r.status)).length, CalendarDays],
            ["Check-ins", reservas.filter(r => r.status === "CHECK_IN" || r.status === "EM_ESTADIA").length, CheckCircle2],
            ["Pendentes", reservas.filter(r => r.status === "AGUARDANDO_PAGAMENTO" || r.status === "PRE_RESERVA").length, Clock3],
          ].map(([label, value, Icon]: any) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{label}</span>
                <Icon className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
              <Filter className="h-4 w-4 text-blue-600" /> Filtros da agenda
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={selectedFlatId} onChange={e => setSelectedFlatId(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] dark:border-slate-700 dark:bg-slate-950">
                <option value="">Todos os imóveis</option>
                {flats.map(x => <option key={x.id} value={x.id}>{x.nome ? `${x.nome} • ` : ""}Flat {x.numero}</option>)}
              </select>
              <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] dark:border-slate-700 dark:bg-slate-950">
                <option value="">Todos os status</option>
                {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>
          <AgendaCalendar
            reservations={reservas}
            selectedFlatId={selectedFlatId}
            selectedStatus={selectedStatus}
            month={agendaMonth}
            onMonthChange={setAgendaMonth}
            onSelectReservation={(reservation) => setSelectedReservation(reservation as Reserva)}
            onCreate={openCreateForDate}
          />
          <div className="my-5 border-t border-slate-200 dark:border-slate-800" />
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente, imóvel ou reserva..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950" />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Carregando reservas...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs text-slate-500">Nenhuma reserva encontrada.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(r => (
                <div key={r.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{r.codigo}</span>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusClasses[r.status] || statusClasses.SOLICITADA}`}>{statusLabels[r.status] || r.status}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-1 text-[11px] text-slate-500 sm:grid-cols-3">
                        <span className="flex items-center gap-1"><UserRound className="h-3.5 w-3.5" /> {r.locatario.nome}</span>
                        <span>{r.flat.local?.nome ? `${r.flat.local.nome} • ` : ""}Flat {r.flat.numero}</span>
                        <span>{dateBR(r.dataEntrada)} {r.horaEntrada || ""} → {dateBR(r.dataSaida)} {r.horaSaida || ""}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="mr-2 text-right">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{money(r.valorTotal)}</div>
                        {r.valorPendente > 0 && <div className="text-[10px] text-amber-600">Pendente {money(r.valorPendente)}</div>}
                      </div>
                      {r.status === "CONFIRMADA" && <button onClick={() => changeStatus(r.id, "CHECK_IN")} className="rounded-lg bg-cyan-50 px-2.5 py-2 text-[10px] font-bold text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">Check-in</button>}
                      {r.status === "CHECK_IN" && <button onClick={() => changeStatus(r.id, "EM_ESTADIA")} className="rounded-lg bg-emerald-50 px-2.5 py-2 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Em estadia</button>}
                      {r.status === "EM_ESTADIA" && <button onClick={() => changeStatus(r.id, "CHECK_OUT")} className="rounded-lg bg-violet-50 px-2.5 py-2 text-[10px] font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">Check-out</button>}
                      {r.status === "CHECK_OUT" && <button onClick={() => changeStatus(r.id, "FINALIZADA")} className="rounded-lg bg-green-50 px-2.5 py-2 text-[10px] font-bold text-green-700 dark:bg-green-950/40 dark:text-green-300">Finalizar</button>}
                      {!["FINALIZADA", "CANCELADA"].includes(r.status) && <button onClick={() => changeStatus(r.id, "CANCELADA")} className="rounded-lg bg-red-50 px-2.5 py-2 text-[10px] font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300"><XCircle className="h-3.5 w-3.5" /></button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{selectedReservation.codigo}</h2>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{selectedReservation.locatario.nome} • Flat {selectedReservation.flat.numero}</p>
              </div>
              <button type="button" onClick={() => setSelectedReservation(null)}><XCircle className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950"><span className="text-slate-400">Entrada</span><div className="mt-1 font-bold">{dateBR(selectedReservation.dataEntrada)} {selectedReservation.horaEntrada || ""}</div></div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950"><span className="text-slate-400">Saída</span><div className="mt-1 font-bold">{dateBR(selectedReservation.dataSaida)} {selectedReservation.horaSaida || ""}</div></div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950"><span className="text-slate-400">Status</span><div className="mt-1 font-bold">{statusLabels[selectedReservation.status] || selectedReservation.status}</div></div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950"><span className="text-slate-400">Total</span><div className="mt-1 font-bold">{money(selectedReservation.valorTotal)}</div></div>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {selectedReservation.status === "CONFIRMADA" && <button onClick={() => { changeStatus(selectedReservation.id, "CHECK_IN"); setSelectedReservation(null); }} className="rounded-lg bg-cyan-600 px-3 py-2 text-[10px] font-bold text-white">Check-in</button>}
              {selectedReservation.status === "CHECK_IN" && <button onClick={() => { changeStatus(selectedReservation.id, "EM_ESTADIA"); setSelectedReservation(null); }} className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white">Em estadia</button>}
              {selectedReservation.status === "EM_ESTADIA" && <button onClick={() => { changeStatus(selectedReservation.id, "CHECK_OUT"); setSelectedReservation(null); }} className="rounded-lg bg-violet-600 px-3 py-2 text-[10px] font-bold text-white">Check-out</button>}
              {selectedReservation.status === "CHECK_OUT" && <button onClick={() => { changeStatus(selectedReservation.id, "FINALIZADA"); setSelectedReservation(null); }} className="rounded-lg bg-green-600 px-3 py-2 text-[10px] font-bold text-white">Finalizar</button>}
              {![ "FINALIZADA", "CANCELADA" ].includes(selectedReservation.status) && <button onClick={() => { changeStatus(selectedReservation.id, "CANCELADA"); setSelectedReservation(null); }} className="rounded-lg bg-red-600 px-3 py-2 text-[10px] font-bold text-white">Cancelar</button>}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <form onSubmit={create} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Nova reserva</h2>
                <p className="text-[11px] text-slate-500">O sistema bloqueia automaticamente conflitos de período no mesmo imóvel.</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)}><XCircle className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold">Cliente
                <select required value={form.locatarioId} onChange={e => setForm({ ...form, locatarioId: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950">
                  <option value="">Selecione...</option>
                  {locatarios.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold">Imóvel
                <select required value={form.flatId} onChange={e => setForm({ ...form, flatId: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950">
                  <option value="">Selecione...</option>
                  {flats.map(x => <option key={x.id} value={x.id}>{x.nome ? `${x.nome} • ` : ""}Flat {x.numero}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold">Entrada
                <input required type="date" value={form.dataEntrada} onChange={e => setForm({ ...form, dataEntrada: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="text-xs font-semibold">Saída
                <input required type="date" value={form.dataSaida} onChange={e => setForm({ ...form, dataSaida: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="text-xs font-semibold">Horário de entrada
                <input type="time" value={form.horaEntrada} onChange={e => setForm({ ...form, horaEntrada: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="text-xs font-semibold">Horário de saída
                <input type="time" value={form.horaSaida} onChange={e => setForm({ ...form, horaSaida: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="text-xs font-semibold">Pessoas
                <input type="number" min="1" value={form.quantidadePessoas} onChange={e => setForm({ ...form, quantidadePessoas: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="text-xs font-semibold">Valor da diária
                <input type="number" min="0" step="0.01" value={form.valorDiaria} onChange={e => setForm({ ...form, valorDiaria: e.target.value })} placeholder="Usar valor padrão do imóvel" className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="text-xs font-semibold">Desconto
                <input type="number" min="0" step="0.01" value={form.desconto} onChange={e => setForm({ ...form, desconto: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="text-xs font-semibold">Taxas
                <input type="number" min="0" step="0.01" value={form.taxas} onChange={e => setForm({ ...form, taxas: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="text-xs font-semibold">Caução
                <input type="number" min="0" step="0.01" value={form.caucao} onChange={e => setForm({ ...form, caucao: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="text-xs font-semibold">Valor recebido
                <input type="number" min="0" step="0.01" value={form.valorRecebido} onChange={e => setForm({ ...form, valorRecebido: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="text-xs font-semibold">Origem
                <select value={form.origem} onChange={e => setForm({ ...form, origem: e.target.value })} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950">
                  <option>DIRETO</option><option>WHATSAPP</option><option>INDICACAO</option><option>OUTRO</option>
                </select>
              </label>
              <label className="text-xs font-semibold sm:col-span-2">Observações
                <textarea value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} rows={3} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950" />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-xs font-semibold">Cancelar</button>
              <button disabled={saving} type="submit" className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white disabled:opacity-50">{saving ? "Salvando..." : "Criar reserva"}</button>
            </div>
          </form>
        </div>
      )}
    </Shell>
  );
}
