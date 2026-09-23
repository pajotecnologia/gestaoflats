import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getAuthSessionOrFallback(); if (!session) return NextResponse.json({error:"Não autorizado."},{status:401});
  try {
    const {searchParams}=new URL(request.url); const status=searchParams.get("status"); const inicio=searchParams.get("inicio"); const fim=searchParams.get("fim");
    const hoje=new Date();
    await prisma.contaReceber.updateMany({where:{empresaId:session.empresaId,status:{in:["PENDENTE","PARCIAL"]},dataVencimento:{lt:hoje}},data:{status:"ATRASADO"}});
    const contas=await prisma.contaReceber.findMany({where:{empresaId:session.empresaId,...status&&status!=="TODOS"?{status}: {},...(inicio||fim)?{dataVencimento:{...(inicio?{gte:new Date(inicio)}:{}),...(fim?{lte:new Date(fim+"T23:59:59")}: {})}}:{}},include:{locatario:true,contrato:{include:{flat:true}}},orderBy:{dataVencimento:"asc"}});
    return NextResponse.json({contas});
  } catch(error:any){return NextResponse.json({error:error.message},{status:500});}
}

export async function POST(request:NextRequest){
  const session=await getAuthSessionOrFallback(); if(!session)return NextResponse.json({error:"Não autorizado."},{status:401});
  try{
    const b=await request.json(); const valor=Number(b.valor); const dateVenc=new Date(b.dataVencimento);
    if(!b.locatarioId||!Number.isFinite(valor)||valor<=0||Number.isNaN(dateVenc.getTime()))return NextResponse.json({error:"Locatário, valor e vencimento válidos são obrigatórios."},{status:400});
    const mesRef=`${dateVenc.getFullYear()}-${String(dateVenc.getMonth()+1).padStart(2,"0")}`;
    const conta=await prisma.contaReceber.create({data:{empresaId:session.empresaId,locatarioId:b.locatarioId,contratoId:b.contratoId||null,mesReferencia:mesRef,numeroParcela:Number(b.numeroParcela||1),valor,dataVencimento:dateVenc,status:"PENDENTE",observacao:b.observacao||null}});
    await prisma.financeiroEvento.create({data:{empresaId:session.empresaId,contaReceberId:conta.id,tipo:"LANCAMENTO",valor,descricao:"Conta a receber lançada.",dadosJson:JSON.stringify({mesReferencia:mesRef})}});
    return NextResponse.json({conta});
  }catch(error:any){return NextResponse.json({error:error.message},{status:500});}
}

export async function PUT(request:NextRequest){
  const session=await getAuthSessionOrFallback(); if(!session)return NextResponse.json({error:"Não autorizado."},{status:401});
  try{
    const b=await request.json(); if(!b.id)return NextResponse.json({error:"ID do lançamento é obrigatório."},{status:400});
    const conta=await prisma.contaReceber.findFirst({where:{id:b.id,empresaId:session.empresaId}}); if(!conta)return NextResponse.json({error:"Conta não encontrada."},{status:404});
    if(b.acao==="BAIXAR"){
      const pago=Number(b.valorPago); if(!Number.isFinite(pago)||pago<=0)return NextResponse.json({error:"Valor pago inválido."},{status:400});
      const acumulado=Number(conta.valorPago||0)+pago; const status=acumulado>=conta.valor?"PAGO":"PARCIAL";
      const atual=await prisma.contaReceber.update({where:{id:conta.id},data:{status,valorPago:acumulado,dataPagamento:new Date(b.dataPagamento||new Date()),formaPagamento:b.formaPagamento||"PIX"}});
      await prisma.financeiroEvento.create({data:{empresaId:session.empresaId,contaReceberId:conta.id,tipo:status==="PAGO"?"BAIXA":"PARCIAL",valor:pago,descricao:status==="PAGO"?"Conta a receber quitada.":"Recebimento parcial registrado.",dadosJson:JSON.stringify({valorAnterior:conta.valorPago||0,valorAcumulado:acumulado,formaPagamento:b.formaPagamento||"PIX"})}});
      return NextResponse.json({conta:atual});
    }
    const data:any={}; if(b.status!==undefined)data.status=b.status; if(b.formaPagamento!==undefined)data.formaPagamento=b.formaPagamento; if(b.observacao!==undefined)data.observacao=b.observacao; if(b.locatarioId)data.locatarioId=b.locatarioId; if(b.contratoId!==undefined)data.contratoId=b.contratoId||null; if(b.valor!==undefined)data.valor=Number(b.valor); if(b.dataPagamento!==undefined)data.dataPagamento=b.dataPagamento?new Date(b.dataPagamento):null; if(b.valorPago!==undefined)data.valorPago=b.valorPago===null?null:Number(b.valorPago);
    if(b.dataVencimento){const d=new Date(b.dataVencimento);data.dataVencimento=d;data.mesReferencia=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;}
    const atual=await prisma.contaReceber.update({where:{id:conta.id},data}); await prisma.financeiroEvento.create({data:{empresaId:session.empresaId,contaReceberId:conta.id,tipo:"ALTERACAO",valor:data.valor??conta.valor,descricao:"Conta a receber alterada.",dadosJson:JSON.stringify(data)}});
    return NextResponse.json({conta:atual});
  }catch(error:any){return NextResponse.json({error:error.message},{status:500});}
}

export async function DELETE(request:NextRequest){
  const session=await getAuthSessionOrFallback();if(!session)return NextResponse.json({error:"Não autorizado."},{status:401});
  try{const id=new URL(request.url).searchParams.get("id");if(!id)return NextResponse.json({error:"ID é obrigatório."},{status:400});await prisma.contaReceber.delete({where:{id,empresaId:session.empresaId}});return NextResponse.json({success:true});}
  catch(error:any){return NextResponse.json({error:error.message},{status:500});}
}