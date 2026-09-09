import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sincronizarRepassesEmpresa } from "@/lib/repassesSync";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const mes = body.mes || new Date().toISOString().substring(0, 7); // Ex: "2026-09"

    // Sincroniza todas as contas a receber e contratos do mês
    await sincronizarRepassesEmpresa(session.empresaId, mes);

    const totalRepasses = await prisma.repasseProprietario.count({
      where: {
        empresaId: session.empresaId,
        mesReferencia: mes,
      },
    });

    return NextResponse.json({
      success: true,
      totalRepasses,
      message: `Repasses de ${mes} sincronizados e calculados com sucesso! (${totalRepasses} repasse(s) disponível(is)).`,
    });
  } catch (error: any) {
    console.error("Erro ao gerar repasses automáticos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
