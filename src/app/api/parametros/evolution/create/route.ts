import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createEvolutionInstance } from "@/lib/evolutionApi";

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

  const result = await createEvolutionInstance({
    evolutionApiUrl,
    evolutionApiKey,
    evolutionInstance,
  });

  if (result.success) {
    // Salva as credenciais no banco de dados
    await prisma.configuracaoParametros.upsert({
      where: { empresaId: session.empresaId },
      update: {
        evolutionApiUrl: evolutionApiUrl.trim(),
        evolutionApiKey: evolutionApiKey.trim(),
        evolutionInstance: evolutionInstance.trim(),
      },
      create: {
        empresaId: session.empresaId,
        evolutionApiUrl: evolutionApiUrl.trim(),
        evolutionApiKey: evolutionApiKey.trim(),
        evolutionInstance: evolutionInstance.trim(),
        statusConexao: "DESCONECTADO",
      },
    });

    return NextResponse.json(result);
  }

  return NextResponse.json(result, { status: 400 });
}
