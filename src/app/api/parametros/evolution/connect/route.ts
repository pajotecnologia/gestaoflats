import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getEvolutionQRCode,
  createEvolutionInstance,
  getEffectiveEvolutionConfig,
} from "@/lib/evolutionApi";

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

  // Tenta buscar o QR Code
  let result = await getEvolutionQRCode(effectiveConfig);

  // Se a instância ainda não existia no servidor (404), cria automaticamente e refaz a busca do QR Code
  if (!result.success && result.message.includes("404")) {
    const createRes = await createEvolutionInstance(effectiveConfig);
    if (createRes.success) {
      if (session.empresaId) {
        await prisma.configuracaoParametros.upsert({
          where: { empresaId: session.empresaId },
          update: { evolutionInstance: effectiveConfig.evolutionInstance },
          create: {
            empresaId: session.empresaId,
            evolutionInstance: effectiveConfig.evolutionInstance,
            statusConexao: "DESCONECTADO",
          },
        });
      }

      // Pequeno delay para a Evolution inicializar os sockets da instância
      await new Promise((resolve) => setTimeout(resolve, 1000));
      result = await getEvolutionQRCode(effectiveConfig);
    }
  }

  return NextResponse.json({
    ...result,
    instanceName: effectiveConfig.evolutionInstance,
  });
}

