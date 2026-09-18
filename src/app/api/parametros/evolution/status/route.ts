import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkEvolutionStatus, getEffectiveEvolutionConfig } from "@/lib/evolutionApi";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const effectiveConfig = await getEffectiveEvolutionConfig(session.empresaId, body);

  const result = await checkEvolutionStatus(effectiveConfig);

  // Atualiza statusConexao no banco de dados
  if (session.empresaId) {
    await prisma.configuracaoParametros.upsert({
      where: { empresaId: session.empresaId },
      update: { statusConexao: result.status },
      create: {
        empresaId: session.empresaId,
        evolutionInstance: effectiveConfig.evolutionInstance,
        statusConexao: result.status,
      },
    });
  }

  return NextResponse.json({
    success: result.connected,
    instanceName: effectiveConfig.evolutionInstance,
    ...result,
  });
}

