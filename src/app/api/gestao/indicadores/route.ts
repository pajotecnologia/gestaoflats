import { NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSessionOrFallback(); if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const [flats, contratos, receber, pagar, reservas, ordens] = await Promise.all([
      prisma.flat.findMany({ where: { empresaId: session.empresaId }, include: { local: true } }),
      prisma.contrato.findMany({ where: { empresaId: session.empresaId }, include: { flat: true, locatario: true } }),
      prisma.contaReceber.findMany({ where: { empresaId: session.empresaId }, select: { valor: true, valorPago: true, dataVencimento: true, status: true, contratoId: true, locatarioId: true } }),
      prisma.contaPagar.findMany({ where: { empresaId: session.empresaId }, select: { valor: true, valorPago: true, dataVencimento: true, status: true, flatId: true } }),
      prisma.reserva.findMany({ where: { empresaId: session.empresaId, status: { not: "CANCELADA" } }, select: { flatId: true, dataEntrada: true, dataSaida: true, valorTotal: true } }),
      prisma.ordemServico.findMany({ where: { empresaId: session.empresaId }, select: { id: true, status: true, prioridade: true, prazo: true, flatId: true, valorReal: true } }),
    ]);
    const now = new Date(); const in90 = new Date(now); in90.setDate(in90.getDate()+90);
    const ativos = contratos.filter(c=>c.status==="ATIVO");
    const ocupados = new Set(ativos.map(c=>c.flatId)).size;
    const receita = receber.reduce((s,c)=>s+(c.valorPago||0),0);
    const despesas = pagar.reduce((s,c)=>s+(c.valorPago||0),0);
    const abertoReceber = receber.reduce((s,c)=>s+Math.max(c.valor-(c.valorPago||0),0),0);
    const abertoPagar = pagar.reduce((s,c)=>s+Math.max(c.valor-(c.valorPago||0),0),0);
    const vencidasReceber = receber.filter(c=>c.dataVencimento<now && Math.max(c.valor-(c.valorPago||0),0)>0).length;
    const contratosVencendo = ativos.filter(c=>c.dataFinal<=in90).sort((a,b)=>a.dataFinal.getTime()-b.dataFinal.getTime()).slice(0,10).map(c=>({id:c.id,locatario:c.locatario.nome,flat:c.flat.numero,dataFinal:c.dataFinal}));
    const osAbertas = ordens.filter(o=>!["CONCLUIDA","CANCELADA"].includes(o.status));
    const porFlat = flats.map(flat=>{
      const rec=receber.filter(c=>c.contratoId && ativos.some(a=>a.id===c.contratoId && a.flatId===flat.id)).reduce((s,c)=>s+(c.valorPago||0),0);
      const pag=pagar.filter(c=>c.flatId===flat.id).reduce((s,c)=>s+(c.valorPago||0),0);
      const reservasFlat=reservas.filter(r=>r.flatId===flat.id).reduce((s,r)=>s+r.valorTotal,0);
      return {id:flat.id,numero:flat.numero,local:flat.local.nome,status:flat.status,receita:rec,reservaBruta:reservasFlat,despesas:pag,saldo:rec-pag,ordens:ordens.filter(o=>o.flatId===flat.id && !["CONCLUIDA","CANCELADA"].includes(o.status)).length};
    }).sort((a,b)=>b.saldo-a.saldo);
    return NextResponse.json({ indicadores:{totalFlats:flats.length,ocupados,taxaOcupacao:flats.length?Math.round(ocupados/flats.length*100):0,receita,despesas,saldo:receita-despesas,abertoReceber,abertoPagar,vencidasReceber,osAbertas:osAbertas.length}, contratosVencendo, porFlat });
  } catch(error:any){ return NextResponse.json({error:error.message},{status:500}); }
}