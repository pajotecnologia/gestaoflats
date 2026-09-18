import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { restartEvolutionInstance } from "@/lib/evolutionApi";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
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
      evolutionApiUrl = evolutionApiUrl || config.evolutionApiUrl;
      evolutionApiKey = evolutionApiKey || config.evolutionApiKey;
      evolutionInstance = evolutionInstance || config.evolutionInstance;
    }
  }

  if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstance) {
    return NextResponse.json(
      { error: "Credenciais da Evolution API incompletas." },
      { status: 400 }
    );
  }

  const result = await restartEvolutionInstance({
    evolutionApiUrl,
    evolutionApiKey,
    evolutionInstance,
  });

  return NextResponse.json(result);
}
