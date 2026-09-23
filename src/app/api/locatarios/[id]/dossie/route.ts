import { NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAuthSessionOrFallback(); if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const locatario = await prisma.locatario.findFirst({
      where: { id: params.id, empresaId: session.empresaId },
      include: {
        contratos: { include: { flat: { include: { local: true } }, contasReceber: { orderBy: { dataVencimento: "asc" } } }, orderBy: { dataFinal: "desc" } },
        reservas: { include: { flat: true }, orderBy: { dataEntrada: "desc" }, take: 30 },
        vistoriasChecklist: { include: { flat: true, contrato: true }, orderBy: { dataVistoria: "desc" }, take: 30 },
        documentos: { orderBy: { validade: "asc" } },
        ordensServico: { include: { flat: true }, orderBy: { criadoEm: "desc" }, take: 30 },
        contasReceber: {
          include: {
            contrato: {
              include: {
                flat: {
                  include: { local: true },
                },
              },
            },
          },
          orderBy: { dataVencimento: "desc" },
          take: 50,
        },
      },
    });
    if (!locatario) return NextResponse.json({ error: "Locatário não encontrado." }, { status: 404 });
    const totalReceber = locatario.contasReceber.reduce((s,c)=>s+c.valor,0);
    const totalPago = locatario.contasReceber.reduce((s,c)=>s+(c.valorPago||0),0);
    const emAberto = Math.max(totalReceber-totalPago,0);
    return NextResponse.json({ locatario, resumo: { totalReceber, totalPago, emAberto, contratosAtivos: locatario.contratos.filter(c=>c.status==="ATIVO").length } });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}