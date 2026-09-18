import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logoutEvolutionInstance, getEffectiveEvolutionConfig } from "@/lib/evolutionApi";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const effectiveConfig = await getEffectiveEvolutionConfig(session.empresaId, body);

  if (!effectiveConfig.evolutionApiUrl || !effectiveConfig.evolutionApiKey || !effectiveConfig.evolutionInstance) {
    return NextResponse.json(
      { error: "Credenciais da Evolution API incompletas." },
      { status: 400 }
    );
  }

  const result = await logoutEvolutionInstance(effectiveConfig);

  // Atualiza status para DESCONECTADO no banco
  if (session.empresaId) {
    await prisma.configuracaoParametros.updateMany({
      where: { empresaId: session.empresaId },
      data: { statusConexao: "DESCONECTADO" },
    });
  }

  return NextResponse.json(result);
}

