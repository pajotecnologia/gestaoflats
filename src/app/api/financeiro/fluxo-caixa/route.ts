import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request:NextRequest){
 const session=await getAuthSessionOrFallback();if(!session)return NextResponse.json({error:"Não autorizado."},{status:401});
 try{
  const sp=new URL(request.url).searchParams;const inicio=sp.get("inicio");const fim=sp.get("fim");
  const hoje=new Date();const start=inicio?new Date(inicio):new Date(hoje.getFullYear(),hoje.getMonth()-5,1);const end=fim?new Date(fim+"T23:59:59"):new Date(hoje.getFullYear(),hoje.getMonth()+1,0,23,59,59);
  await prisma.contaReceber.updateMany({where:{empresaId:session.empresaId,status:{in:["PENDENTE","PARCIAL"]},dataVencimento:{lt:hoje}},data:{status:"ATRASADO"}});
  await prisma.contaPagar.updateMany({where:{empresaId:session.empresaId,status:{in:["PENDENTE","PARCIAL"]},dataVencimento:{lt:hoje}},data:{status:"ATRASADO"}});
  const [receber,pagar]=await Promise.all([
   prisma.contaReceber.findMany({where:{empresaId:session.empresaId,dataVencimento:{gte:start,lte:end}},include:{locatario:true,contrato:{include:{flat:true}}},orderBy:{dataVencimento:"asc"}}),
   prisma.contaPagar.findMany({where:{empresaId:session.empresaId,dataVencimento:{gte:start,lte:end}},include:{fornecedor:true,flat:true,local:true},orderBy:{dataVencimento:"asc"}})
  ]);
  const recebimentos=receber.filter(x=>x.status==="PAGO"||x.status==="PARCIAL").reduce((a,x)=>a+Number(x.valorPago||0),0);
  const pagamentos=pagar.filter(x=>x.status==="PAGO"||x.status==="PARCIAL").reduce((a,x)=>a+Number(x.valorPago||0),0);
  const abertoReceber=receber.reduce((a,x)=>a+Math.max(0,x.valor-Number(x.valorPago||0)),0);
  const abertoPagar=pagar.reduce((a,x)=>a+Math.max(0,x.valor-Number(x.valorPago||0)),0);
  const porMes=new Map<string,{mes:string,previstoReceber:number,recebido:number,previstoPagar:number,pago:number,saldo:number}>();
  const add=(date:Date,key:"previstoReceber"|"recebido"|"previstoPagar"|"pago",value:number)=>{const mes=date.toISOString().slice(0,7);const item=porMes.get(mes)||{mes,previstoReceber:0,recebido:0,previstoPagar:0,pago:0,saldo:0};(item as any)[key]=((item as any)[key]||0)+value;item.saldo=item.recebido-item.pago;porMes.set(mes,item)};
  receber.forEach(x=>{add(new Date(x.dataVencimento),"previstoReceber",x.valor);if(x.dataPagamento)add(new Date(x.dataPagamento),"recebido",Number(x.valorPago||0));});
  pagar.forEach(x=>{add(new Date(x.dataVencimento),"previstoPagar",x.valor);if(x.dataPagamento)add(new Date(x.dataPagamento),"pago",Number(x.valorPago||0));});
  return NextResponse.json({kpis:{recebimentos,pagamentos,saldo:recebimentos-pagamentos,abertoReceber,abertoPagar,inadimplenteReceber:receber.filter(x=>x.status==="ATRASADO").reduce((a,x)=>a+Math.max(0,x.valor-Number(x.valorPago||0)),0),atrasadoPagar:pagar.filter(x=>x.status==="ATRASADO").reduce((a,x)=>a+Math.max(0,x.valor-Number(x.valorPago||0)),0)},meses:Array.from(porMes.values()).sort((a,b)=>a.mes.localeCompare(b.mes)),receber,pagar});
 }catch(e:any){return NextResponse.json({error:e.message},{status:500});}
}
