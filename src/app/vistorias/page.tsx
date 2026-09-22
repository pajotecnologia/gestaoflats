"use client";

import { useEffect, useMemo, useState } from "react";
import Shell from "@/components/layout/Shell";
import { Camera, CheckCircle2, ClipboardCheck, FilePlus2, Plus, Save, Trash2, X } from "lucide-react";

type Item = {
  id: string;
  categoria: string;
  item: string;
  estado: string;
  observacao: string;
  avaria: boolean;
  valorDano: number;
  fotoUrl?: string | null;
};

type Modelo = { id: string; nome: string; descricao?: string | null; itensJson: string };

type Vistoria = {
  id: string;
  tipoVistoria: string;
  status: string;
  dataVistoria: string;
  responsavelVistoria: string;
  valorDanos: number;
  itensJson: string;
  limpezaStatus: string;
  manutencaoStatus: string;
  flat: { numero: string; local?: { nome: string } | null };
  locatario?: { nome: string } | null;
};

const blankItem = (): Item => ({
  id: crypto.randomUUID(),
  categoria: "Geral",
  item: "",
  estado: "BOM",
  observacao: "",
  avaria: false,
  valorDano: 0,
});

const money = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function VistoriasPage() {
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [locatarios, setLocatarios] = useState<any[]>([]);
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showModelo, setShowModelo] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    flatId: "", locatarioId: "", reservaId: "", contratoId: "", modeloId: "",
    tipoVistoria: "ENTRADA", responsavelVistoria: "", limpezaStatus: "PENDENTE",
    manutencaoStatus: "PENDENTE", observacaoGeral: "", status: "RASCUNHO",
  });
  const [items, setItems] = useState<Item[]>([blankItem()]);
  const [fotos, setFotos] = useState<string[]>([]);
  const [modeloForm, setModeloForm] = useState({ nome: "", descricao: "" });
  const [modeloItems, setModeloItems] = useState<Item[]>([blankItem()]);
  const [saving, setSaving] = useState(false);
  const [entradaCompare, setEntradaCompare] = useState<Vistoria | null>(null);
  const [saidaCompare, setSaidaCompare] = useState<Vistoria | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [v, m, f, l, r] = await Promise.all([
        fetch("/api/vistorias").then(x => x.json()),
        fetch("/api/checklist-modelos").then(x => x.json()),
        fetch("/api/flats").then(x => x.json()),
        fetch("/api/locatarios").then(x => x.json()),
        fetch("/api/reservas").then(x => x.json()),
      ]);
      setVistorias(v.vistorias || []);
      setModelos(m.modelos || []);
      setFlats(f.flats || []);
      setLocatarios(l.locatarios || []);
      setReservas(r.reservas || []);
    } catch { setMessage("Não foi possível carregar as vistorias."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = filter.toLowerCase().trim();
    if (!term) return vistorias;
    return vistorias.filter(v => [v.flat.numero, v.flat.local?.nome || "", v.locatario?.nome || "", v.tipoVistoria, v.status].join(" ").toLowerCase().includes(term));
  }, [vistorias, filter]);

  const updateItem = (index: number, patch: Partial<Item>) => setItems(current => current.map((item, i) => i === index ? { ...item, ...patch } : item));
  const updateModeloItem = (index: number, patch: Partial<Item>) => setModeloItems(current => current.map((item, i) => i === index ? { ...item, ...patch } : item));

  const applyModel = (id: string) => {
    setForm(f => ({ ...f, modeloId: id }));
    const model = modelos.find(x => x.id === id);
    if (model) setItems(JSON.parse(model.itensJson || "[]"));
  };

  const uploadPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const fd = new FormData();
    Array.from(files).forEach(file => fd.append("fotoFiles", file));
    const res = await fetch("/api/vistorias/upload-foto", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error || "Erro no upload."); return; }
    setFotos(current => [...current, ...(data.fotoUrls || [])]);
  };

  const saveVistoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.flatId || !form.responsavelVistoria || !items.some(x => x.item.trim())) {
      setMessage("Informe o imóvel, responsável e pelo menos um item do checklist.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/vistorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, itens: items.filter(x => x.item.trim()), fotos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage("Vistoria salva com sucesso.");
      setShowForm(false);
      setItems([blankItem()]);
      setFotos([]);
      await load();
    } catch (e: any) { setMessage(e.message || "Erro ao salvar vistoria."); }
    finally { setSaving(false); }
  };

  const saveModelo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modeloForm.nome || !modeloItems.some(x => x.item.trim())) return setMessage("Informe nome e itens do modelo.");
    const res = await fetch("/api/checklist-modelos", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...modeloForm, itens: modeloItems.filter(x => x.item.trim()) }),
    });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error || "Erro ao criar modelo.");
    setShowModelo(false);
    setModeloForm({ nome: "", descricao: "" });
    setModeloItems([blankItem()]);
    setMessage("Modelo de checklist criado.");
    load();
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-2.5 text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/30"><ClipboardCheck className="h-6 w-6" /></div>
            <div>
              <h1 className="text-lg font-bold">Checklists & Vistorias</h1>
              <p className="text-xs text-slate-500">Entrada, saída, avarias, fotos, limpeza e manutenção do imóvel.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowModelo(true)} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold dark:border-slate-700"><FilePlus2 className="h-4 w-4" /> Novo modelo</button>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Nova vistoria</button>
          </div>
        </div>

        {message && <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">{message}</div>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            ["Total", vistorias.length],
            ["Entrada", vistorias.filter(v => v.tipoVistoria === "ENTRADA").length],
            ["Saída", vistorias.filter(v => v.tipoVistoria === "SAIDA").length],
            ["Danos", money(vistorias.reduce((s, v) => s + (v.valorDanos || 0), 0))],
          ].map(([label, value]) => <div key={String(label)} className="rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="text-[10px] font-semibold text-slate-500">{label}</div><div className="mt-2 text-xl font-bold">{value}</div></div>)}
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar por imóvel, locatário, tipo ou status..." className="w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950" />
        </div>

        {loading ? <div className="py-12 text-center text-xs text-slate-500">Carregando...</div> : filtered.length === 0 ? (
          <div className="rounded-2xl border bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900"><ClipboardCheck className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 text-xs text-slate-500">Nenhuma vistoria cadastrada.</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(v => <div key={v.id} className="rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">{v.tipoVistoria}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold">{v.status}</span></div><div className="mt-2 text-sm font-bold">{v.flat.local?.nome ? v.flat.local.nome + " • " : ""}Flat {v.flat.numero}</div><div className="text-[11px] text-slate-500">{v.locatario?.nome || "Sem locatário"} • {new Date(v.dataVistoria).toLocaleDateString("pt-BR")} • Resp.: {v.responsavelVistoria}</div></div>
                <div className="flex flex-wrap items-end justify-end gap-2"><div className="text-right"><div className="text-xs font-bold">{money(v.valorDanos)}</div><div className="text-[10px] text-slate-500">danos identificados</div><div className="mt-1 text-[10px]">{v.limpezaStatus} • {v.manutencaoStatus}</div></div><button onClick={() => v.tipoVistoria === "ENTRADA" ? setEntradaCompare(v) : setSaidaCompare(v)} className="rounded-lg border px-2.5 py-2 text-[10px] font-bold dark:border-slate-700">{v.tipoVistoria === "ENTRADA" ? "Usar entrada" : "Usar saída"}</button></div>
              </div>
            </div>)}
          </div>
        )}

        {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><form onSubmit={saveVistoria} className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="text-base font-bold">Nova vistoria</h2><p className="text-[11px] text-slate-500">Registre o estado real do imóvel antes ou depois da hospedagem.</p></div><button type="button" onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-semibold">Imóvel<select required value={form.flatId} onChange={e => setForm({...form,flatId:e.target.value})} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"><option value="">Selecione</option>{flats.map(f=><option key={f.id} value={f.id}>{f.local?.nome ? f.local.nome+" • " : ""}Flat {f.numero}</option>)}</select></label>
            <label className="text-xs font-semibold">Locatário<select value={form.locatarioId} onChange={e => setForm({...form,locatarioId:e.target.value})} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"><option value="">Opcional</option>{locatarios.map(l=><option key={l.id} value={l.id}>{l.nome}</option>)}</select></label>
            <label className="text-xs font-semibold">Reserva<select value={form.reservaId} onChange={e => setForm({...form,reservaId:e.target.value})} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"><option value="">Opcional</option>{reservas.map(r=><option key={r.id} value={r.id}>{r.codigo} • Flat {r.flat.numero}</option>)}</select></label>
            <label className="text-xs font-semibold">Tipo<select value={form.tipoVistoria} onChange={e => setForm({...form,tipoVistoria:e.target.value})} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"><option value="ENTRADA">Entrada</option><option value="SAIDA">Saída</option></select></label>
            <label className="text-xs font-semibold">Modelo<select value={form.modeloId} onChange={e => applyModel(e.target.value)} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"><option value="">Sem modelo</option>{modelos.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}</select></label>
            <label className="text-xs font-semibold">Responsável<input required value={form.responsavelVistoria} onChange={e => setForm({...form,responsavelVistoria:e.target.value})} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950" /></label>
            <label className="text-xs font-semibold">Limpeza<select value={form.limpezaStatus} onChange={e => setForm({...form,limpezaStatus:e.target.value})} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"><option>PENDENTE</option><option>OK</option><option>NECESSITA_LIMPEZA</option></select></label>
            <label className="text-xs font-semibold">Manutenção<select value={form.manutencaoStatus} onChange={e => setForm({...form,manutencaoStatus:e.target.value})} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"><option>PENDENTE</option><option>OK</option><option>NECESSITA_MANUTENCAO</option></select></label>
          </div>

          <div className="mt-5 rounded-xl border dark:border-slate-800">
            <div className="flex items-center justify-between border-b p-3 dark:border-slate-800"><div className="text-xs font-bold">Itens vistoriados</div><button type="button" onClick={() => setItems([...items,blankItem()])} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-2 text-[10px] font-bold text-blue-700"><Plus className="h-3 w-3"/> Item</button></div>
            <div className="space-y-2 p-3">
              {items.map((item,i)=><div key={item.id} className="grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-950 sm:grid-cols-12">
                <input value={item.categoria} onChange={e=>updateItem(i,{categoria:e.target.value})} placeholder="Categoria" className="rounded-lg border p-2 text-[10px] sm:col-span-2 dark:border-slate-700 dark:bg-slate-900"/>
                <input value={item.item} onChange={e=>updateItem(i,{item:e.target.value})} placeholder="Item (ex.: TV, cama, torneira)" className="rounded-lg border p-2 text-[10px] sm:col-span-3 dark:border-slate-700 dark:bg-slate-900"/>
                <select value={item.estado} onChange={e=>updateItem(i,{estado:e.target.value})} className="rounded-lg border p-2 text-[10px] sm:col-span-2 dark:border-slate-700 dark:bg-slate-900"><option>BOM</option><option>NOVO</option><option>REGULAR</option><option>RUIM</option><option>NAO_FUNCIONA</option><option>AUSENTE</option></select>
                <input value={item.observacao} onChange={e=>updateItem(i,{observacao:e.target.value})} placeholder="Observação" className="rounded-lg border p-2 text-[10px] sm:col-span-2 dark:border-slate-700 dark:bg-slate-900"/>
                <label className="flex items-center gap-1 text-[10px] sm:col-span-1"><input type="checkbox" checked={item.avaria} onChange={e=>updateItem(i,{avaria:e.target.checked})}/> Avaria</label>
                <input type="number" min="0" step="0.01" value={item.valorDano} disabled={!item.avaria} onChange={e=>updateItem(i,{valorDano:Number(e.target.value)})} placeholder="R$" className="rounded-lg border p-2 text-[10px] sm:col-span-1 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"/>
                <button type="button" onClick={()=>setItems(items.filter((_,x)=>x!==i))} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4"/></button>
              </div>)}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold">Fotos da vistoria<input type="file" multiple accept="image/*" onChange={e=>uploadPhotos(e.target.files)} className="mt-1 w-full rounded-xl border p-2 text-xs dark:border-slate-700"/></label>
            <div className="rounded-xl border p-3 text-[10px] text-slate-500 dark:border-slate-800"><Camera className="mb-2 h-4 w-4 text-blue-600"/> {fotos.length} foto(s) anexada(s){fotos.length > 0 && <div className="mt-2 grid grid-cols-4 gap-2">{fotos.map(url=><img key={url} src={url} alt="Vistoria" className="h-14 w-full rounded object-cover"/>)}</div>}</div>
          </div>
          <label className="mt-4 block text-xs font-semibold">Observação geral<textarea value={form.observacaoGeral} onChange={e=>setForm({...form,observacaoGeral:e.target.value})} rows={3} className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"/></label>
          <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={()=>setShowForm(false)} className="rounded-xl border px-4 py-2 text-xs font-semibold">Cancelar</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white disabled:opacity-50"><Save className="h-4 w-4"/>{saving?"Salvando...":"Salvar vistoria"}</button></div>
        </form></div>}

        {entradaCompare && saidaCompare && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><div className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
          <div className="flex items-center justify-between"><div><h2 className="text-base font-bold">Comparação Entrada × Saída</h2><p className="text-[11px] text-slate-500">Itens com alteração de estado ou avaria ficam destacados.</p></div><button onClick={()=>{setEntradaCompare(null);setSaidaCompare(null)}}><X className="h-5 w-5"/></button></div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950"><div className="text-[10px] text-slate-500">Entrada</div><div className="text-xs font-bold">{entradaCompare.flat.local?.nome || ""} • Flat {entradaCompare.flat.numero}</div><div className="text-[10px]">{new Date(entradaCompare.dataVistoria).toLocaleDateString("pt-BR")}</div></div><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950"><div className="text-[10px] text-slate-500">Saída</div><div className="text-xs font-bold">{saidaCompare.flat.local?.nome || ""} • Flat {saidaCompare.flat.numero}</div><div className="text-[10px]">{new Date(saidaCompare.dataVistoria).toLocaleDateString("pt-BR")}</div></div></div>
          <div className="mt-4 space-y-2">{(() => { const a: Item[] = JSON.parse(entradaCompare.itensJson || "[]"); const b: Item[] = JSON.parse(saidaCompare.itensJson || "[]"); const map = new Map(b.map(x=>[x.item,x])); return a.map(x=>{ const y=map.get(x.item); const changed=!!y && (x.estado!==y.estado || x.avaria!==y.avaria || x.observacao!==y.observacao); return <div key={x.id} className={`rounded-xl border p-3 ${changed ? "border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20" : "dark:border-slate-800"}`}><div className="flex flex-col gap-1 sm:flex-row sm:justify-between"><span className="text-xs font-bold">{x.item}</span><span className="text-[10px]">{x.estado} → {y?.estado || "Não informado"} {changed ? "• ALTERADO" : "• OK"}</span></div>{changed && <div className="mt-1 text-[10px] text-slate-600 dark:text-slate-300">{y?.observacao || x.observacao || "Alteração identificada"} {y?.avaria ? ` • Dano: ${money(y.valorDano)}` : ""}</div>}</div>})})()}</div>
          <div className="mt-5 flex justify-end"><button onClick={()=>{setEntradaCompare(null);setSaidaCompare(null)}} className="rounded-xl border px-4 py-2 text-xs font-semibold dark:border-slate-700">Fechar</button></div>
        </div></div>}

        {showModelo && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><form onSubmit={saveModelo} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="text-base font-bold">Modelo de checklist</h2><p className="text-[11px] text-slate-500">Crie um padrão reutilizável para entradas e saídas.</p></div><button type="button" onClick={()=>setShowModelo(false)}><X className="h-5 w-5"/></button></div>
          <div className="grid gap-3 sm:grid-cols-2"><input required value={modeloForm.nome} onChange={e=>setModeloForm({...modeloForm,nome:e.target.value})} placeholder="Nome do modelo" className="rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"/><input value={modeloForm.descricao} onChange={e=>setModeloForm({...modeloForm,descricao:e.target.value})} placeholder="Descrição" className="rounded-xl border p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"/></div>
          <div className="mt-4 space-y-2">{modeloItems.map((item,i)=><div key={item.id} className="grid grid-cols-1 gap-2 sm:grid-cols-4"><input value={item.categoria} onChange={e=>updateModeloItem(i,{categoria:e.target.value})} placeholder="Categoria" className="rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-950"/><input value={item.item} onChange={e=>updateModeloItem(i,{item:e.target.value})} placeholder="Item" className="rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-950"/><input value={item.observacao} onChange={e=>updateModeloItem(i,{observacao:e.target.value})} placeholder="Orientação" className="rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-950"/><button type="button" onClick={()=>setModeloItems(modeloItems.filter((_,x)=>x!==i))} className="rounded-lg border text-red-500"><Trash2 className="mx-auto h-4 w-4"/></button></div>)}</div>
          <button type="button" onClick={()=>setModeloItems([...modeloItems,blankItem()])} className="mt-3 inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-bold dark:bg-slate-800"><Plus className="h-3 w-3"/> Adicionar item</button>
          <div className="mt-5 flex justify-end"><button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white"><Save className="h-4 w-4"/> Salvar modelo</button></div>
        </form></div>}
      </div>
    </Shell>
  );
}
