"use client";

import React, { useEffect, useState } from "react";
import Shell from "@/components/layout/Shell";
import { ArrowLeft, RefreshCw, Percent, Ban, XCircle, History, FileText, CheckCircle2, Printer } from "lucide-react";

export default function ContratoDetalhePage({ params }: { params: { id: string } }) {
  const [contrato, setContrato] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<string | null>(null);
  const [valor, setValor] = useState("");
  const [quantidade, setQuantidade] = useState("12");
  const [unidade, setUnidade] = useState("MESES");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/contratos/${params.id}`);
    const data = await res.json();
    setContrato(data.contrato || null);
    setLoading(false);
  };
  useEffect(() => { load(); }, [params.id]);

  const action = async (acao: string, payload: any = {}) => {
    setSaving(true);
    try {
      const res = await fetch("/api/contratos", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: params.id, acao, ...payload }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível concluir a operação.");
      setModal(null);
      await load();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  };

  if (loading) return <Shell><div className="p-8 text-sm text-slate-500">Carregando contrato...</div></Shell>;
  if (!contrato) return <Shell><div className="p-8 text-sm text-rose-500">Contrato não encontrado.</div></Shell>;

  const eventos = contrato.eventos || [];
  const conteudo = contrato.modeloContrato?.conteudoHtml || "<p>Sem conteúdo de modelo associado.</p>";
  const statusColor = contrato.status === "ATIVO" ? "emerald" : contrato.status === "FINALIZADO" ? "slate" : "rose";

  return <Shell>
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => window.location.href="/contratos"} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><ArrowLeft className="w-4 h-4"/></button>
          <div><p className="text-[10px] uppercase font-bold text-blue-600">Fase 3 • Gestão contratual</p><h1 className="text-xl font-extrabold">Contrato de {contrato.locatario?.nome}</h1><p className="text-xs text-slate-500">{contrato.flat?.local?.nome} • Flat {contrato.flat?.numero}</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>window.print()} className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold flex items-center gap-2"><Printer className="w-4 h-4"/> Imprimir</button>
          <button onClick={()=>setModal("renovar")} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-2"><RefreshCw className="w-4 h-4"/> Renovar</button>
          <button onClick={()=>{setValor(String(contrato.valorMensal));setModal("reajustar")}} className="px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold flex items-center gap-2"><Percent className="w-4 h-4"/> Reajustar</button>
          {contrato.status==="ATIVO" && <button onClick={()=>setModal("rescindir")} className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-2"><XCircle className="w-4 h-4"/> Rescindir</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          ["Status", contrato.status, statusColor],
          ["Assinatura", contrato.statusAssinatura, "blue"],
          ["Valor mensal", `R$ ${Number(contrato.valorMensal||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}`, "emerald"],
          ["Emissão", new Date(contrato.dataEmissao).toLocaleDateString("pt-BR"), "slate"],
          ["Vencimento", new Date(contrato.dataFinal).toLocaleDateString("pt-BR"), "slate"]
        ].map(([label,value,color])=><div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4"><span className="text-[10px] uppercase font-bold text-slate-400">{label}</span><p className={`mt-1 text-sm font-extrabold text-${color}-600`}>{value}</p></div>)}
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600"/><h2 className="font-bold">Prévia do contrato</h2></div>
          <div className="p-6 prose prose-sm dark:prose-invert max-w-none print:text-black" dangerouslySetInnerHTML={{__html: conteudo}} />
        </section>
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2"><History className="w-5 h-5 text-blue-600"/><h2 className="font-bold">Histórico e auditoria</h2></div>
          <div className="p-4 space-y-3">
            {eventos.length===0 ? <p className="text-xs text-slate-500">Nenhum evento registrado.</p> : eventos.map((e:any)=><div key={e.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><div className="flex justify-between gap-2"><span className="text-[10px] font-extrabold text-blue-600">{e.tipo}</span><span className="text-[10px] text-slate-400">{new Date(e.criadoEm).toLocaleString("pt-BR")}</span></div><p className="text-xs mt-1">{e.descricao}</p></div>)}
          </div>
        </section>
      </div>

      {modal && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl space-y-4">
        {modal==="renovar" && <><h3 className="font-bold text-lg">Renovar contrato</h3><div className="grid grid-cols-2 gap-3"><input value={quantidade} onChange={e=>setQuantidade(e.target.value)} type="number" min="1" className="p-3 rounded-xl border bg-transparent"/><select value={unidade} onChange={e=>setUnidade(e.target.value)} className="p-3 rounded-xl border bg-transparent"><option>MESES</option><option>DIAS</option></select></div><p className="text-xs text-slate-500">A nova vigência será adicionada à data final atual.</p><button disabled={saving} onClick={()=>action("RENOVAR",{quantidade:Number(quantidade),unidade})} className="w-full p-3 rounded-xl bg-blue-600 text-white font-bold">{saving?"Salvando...":"Confirmar renovação"}</button></>}
        {modal==="reajustar" && <><h3 className="font-bold text-lg">Reajustar valor</h3><input value={valor} onChange={e=>setValor(e.target.value)} type="number" step="0.01" className="w-full p-3 rounded-xl border bg-transparent"/><p className="text-xs text-slate-500">As parcelas futuras ainda pendentes deste contrato serão atualizadas.</p><button disabled={saving} onClick={()=>action("REAJUSTAR",{valorMensal:Number(valor)})} className="w-full p-3 rounded-xl bg-amber-500 text-white font-bold">{saving?"Salvando...":"Confirmar reajuste"}</button></>}
        {modal==="rescindir" && <><h3 className="font-bold text-lg">Rescindir contrato</h3><textarea value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Motivo da rescisão" className="w-full p-3 rounded-xl border bg-transparent min-h-24"/><button disabled={saving} onClick={()=>action("RESCINDIR",{motivo})} className="w-full p-3 rounded-xl bg-rose-600 text-white font-bold">{saving?"Salvando...":"Confirmar rescisão"}</button></>}
        <button onClick={()=>setModal(null)} className="w-full p-2 text-xs font-bold text-slate-500">Cancelar</button>
      </div></div>}
    </div>
  </Shell>;
}
