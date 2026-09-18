import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createEvolutionInstance, getEffectiveEvolutionConfig } from "@/lib/evolutionApi";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const effectiveConfig = await getEffectiveEvolutionConfig(session.empresaId, body);

  if (!effectiveConfig.evolutionApiUrl || !effectiveConfig.evolutionApiKey || !effectiveConfig.evolutionInstance) {
    return NextResponse.json(
      { error: "Credenciais da Evolution API não encontradas no servidor nem no cadastro da empresa." },
      { status: 400 }
    );
  }

  const result = await createEvolutionInstance(effectiveConfig);

  if (result.success) {
    // Salva o nome da instância e, caso o usuário tenha informado explicitamente chaves próprias (BYOS), salva-as também
    if (session.empresaId) {
      await prisma.configuracaoParametros.upsert({
        where: { empresaId: session.empresaId },
        update: {
          evolutionInstance: effectiveConfig.evolutionInstance,
          ...(body.evolutionApiUrl ? { evolutionApiUrl: body.evolutionApiUrl.trim() } : {}),
          ...(body.evolutionApiKey ? { evolutionApiKey: body.evolutionApiKey.trim() } : {}),
        },
        create: {
          empresaId: session.empresaId,
          evolutionInstance: effectiveConfig.evolutionInstance,
          evolutionApiUrl: body.evolutionApiUrl ? body.evolutionApiUrl.trim() : null,
          evolutionApiKey: body.evolutionApiKey ? body.evolutionApiKey.trim() : null,
          statusConexao: "DESCONECTADO",
        },
      });
    }

    return NextResponse.json({
      ...result,
      instanceName: effectiveConfig.evolutionInstance,
    });
  }

  return NextResponse.json(result, { status: 400 });
}

