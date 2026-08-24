import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkEvolutionStatus } from "@/lib/evolutionApi";

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  let { evolutionApiUrl, evolutionApiKey, evolutionInstance } = body;

  if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstance) {
    const config = await prisma.configuracaoParametros.findUnique({
      where: { empresaId: session.empresaId },
    });
    if (config) {
      evolutionApiUrl = config.evolutionApiUrl;
      evolutionApiKey = config.evolutionApiKey;
      evolutionInstance = config.evolutionInstance;
    }
  }

  const result = await checkEvolutionStatus({
    evolutionApiUrl,
    evolutionApiKey,
    evolutionInstance,
  });

  // Atualizar status no banco de dados
  await prisma.configuracaoParametros.upsert({
    where: { empresaId: session.empresaId },
    update: { statusConexao: result.status },
    create: {
      empresaId: session.empresaId,
      evolutionApiUrl,
      evolutionApiKey,
      evolutionInstance,
      statusConexao: result.status,
    },
  });

  return NextResponse.json({
    success: result.connected,
    ...result,
  });
}
