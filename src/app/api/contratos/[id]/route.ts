import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthSessionOrFallback();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const contrato = await prisma.contrato.findFirst({
      where: { id: params.id, empresaId: session.empresaId },
      include: {
        empresa: true,
        locatario: true,
        flat: { include: { local: true } },
        modeloContrato: true,
        contasReceber: { orderBy: { numeroParcela: "asc" } },
        vistoriasChecklist: true,
        eventos: { orderBy: { criadoEm: "desc" }, take: 50 },
      },
    });
    if (!contrato) return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
    return NextResponse.json({ contrato });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
