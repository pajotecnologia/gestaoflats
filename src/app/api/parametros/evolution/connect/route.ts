import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEvolutionQRCode } from "@/lib/evolutionApi";

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
      { error: "Informe a URL da Evolution API, API Key Global e o Nome da Instância." },
      { status: 400 }
    );
  }

  const result = await getEvolutionQRCode({
    evolutionApiUrl,
    evolutionApiKey,
    evolutionInstance,
  });

  return NextResponse.json(result);
}
