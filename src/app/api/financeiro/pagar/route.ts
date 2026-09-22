import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request:NextRequest){
 const session=await getAuthSessionOrFallback();if(!session)return NextResponse.json({error:"Não autorizado."},{status:401});
 try{const sp=new URL(request.url).searchParams;const status=sp.get("status");const hoje=new Date();await prisma.contaPagar.updateMany({where:{empresaId:session.empresaId,status:{in:["PENDENTE","PARCIAL"]},dataVencimento:{lt:hoje}},data:{status:"ATRASADO"}});
 const contas=await prisma.contaPagar.findMany({where:{empresaId:session.empresaId,...status&&status!=="TODOS"?{status}:{}},include:{fornecedor:true,local:true,flat:true},orderBy:{dataVencimento:"asc"}});return NextResponse.json({contas});}
 catch(e:any){return NextResponse.json({error:e.message},{status:500});}
}
export async function POST(request:NextRequest){
 const session=await getAuthSessionOrFallback();if(!session)return NextResponse.json({error:"Não autorizado."},{status:401});
 try{const b=await request.json();const valor=Number(b.valor);const venc=new Date(b.dataVencimento);if(!b.descricao||!Number.isFinite(valor)||valor<=0||Number.isNaN(venc.getTime()))return NextResponse.json({error:"Descrição, valor e vencimento válidos são obrigatórios."},{status:400});
 const conta=await prisma.contaPagar.create({data:{empresaId:session.empresaId,fornecedorId:b.fornecedorId||null,localId:b.localId||null,flatId:b.flatId||null,descricao:b.descricao,valor,dataCompra:b.dataCompra?new Date(b.dataCompra):new Date(),dataVencimento:venc,status:"PENDENTE",valorPago:0,observacao:b.observacao||null}});
 await prisma.financeiroEvento.create({data:{empresaId:session.empresaId,contaPagarId:conta.id,tipo:"LANCAMENTO",valor,descricao:"Conta a pagar lançada."}});
 return NextResponse.json({conta});}catch(e:any){return NextResponse.json({error:e.message},{status:500});}
}
export async function PUT(request:NextRequest){
 const session=await getAuthSessionOrFallback();if(!session)return NextResponse.json({error:"Não autorizado."},{status:401});
 try{const b=await request.json();if(!b.id)return NextResponse.json({error:"ID do lançamento é obrigatório."},{status:400});const conta=await prisma.contaPagar.findFirst({where:{id:b.id,empresaId:session.empresaId}});if(!conta)return NextResponse.json({error:"Conta não encontrada."},{status:404});
 if(b.acao==="BAIXAR"){const pago=Number(b.valorPago);if(!Number.isFinite(pago)||pago<=0)return NextResponse.json({error:"Valor pago inválido."},{status:400});const acumulado=Number(conta.valorPago||0)+pago;const status=acumulado>=conta.valor?"PAGO":"PARCIAL";const atual=await prisma.contaPagar.update({where:{id:conta.id},data:{status,valorPago:acumulado,dataPagamento:new Date(b.dataPagamento||new Date()),formaPagamento:b.formaPagamento||"PIX"}});await prisma.financeiroEvento.create({data:{empresaId:session.empresaId,contaPagarId:conta.id,tipo:status==="PAGO"?"BAIXA":"PARCIAL",valor:pago,descricao:status==="PAGO"?"Conta a pagar quitada.":"Pagamento parcial registrado."}});return NextResponse.json({conta:atual});}
 const data:any={};for(const k of ["fornecedorId","localId","flatId","descricao","formaPagamento","observacao"])if(b[k]!==undefined)data[k]=b[k]||null;if(b.valor!==undefined)data.valor=Number(b.valor);if(b.dataVencimento)data.dataVencimento=new Date(b.dataVencimento);if(b.status!==undefined)data.status=b.status;if(b.dataPagamento!==undefined)data.dataPagamento=b.dataPagamento?new Date(b.dataPagamento):null;if(b.valorPago!==undefined)data.valorPago=b.valorPago===null?null:Number(b.valorPago);
 const atual=await prisma.contaPagar.update({where:{id:conta.id},data});await prisma.financeiroEvento.create({data:{empresaId:session.empresaId,contaPagarId:conta.id,tipo:"ALTERACAO",valor:data.valor??conta.valor,descricao:"Conta a pagar alterada.",dadosJson:JSON.stringify(data)}});return NextResponse.json({conta:atual});
 }catch(e:any){return NextResponse.json({error:e.message},{status:500});}
}
export async function DELETE(request:NextRequest){const session=await getAuthSessionOrFallback();if(!session)return NextResponse.json({error:"Não autorizado."},{status:401});try{const id=new URL(request.url).searchParams.get("id");if(!id)return NextResponse.json({error:"ID é obrigatório."},{status:400});await prisma.contaPagar.delete({where:{id,empresaId:session.empresaId}});return NextResponse.json({success:true});}catch(e:any){return NextResponse.json({error:e.message},{status:500});}}
