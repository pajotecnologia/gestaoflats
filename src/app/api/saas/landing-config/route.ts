import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback, isUserSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_LANDING_CONFIG, LandingPageConfig } from "@/lib/landingConfig";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const config = await prisma.configuracaoSaaS.findFirst();
    let landingConfig: LandingPageConfig = { ...DEFAULT_LANDING_CONFIG };

    if (config?.landingConfigJson) {
      try {
        const custom = JSON.parse(config.landingConfigJson);
        landingConfig = {
          ...DEFAULT_LANDING_CONFIG,
          ...custom,
        };
      } catch (e) {
        console.error("Erro ao fazer parse de landingConfigJson:", e);
      }
    }

    return NextResponse.json({
      success: true,
      config: landingConfig,
      hasCustomConfig: Boolean(config?.landingConfigJson),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  let isSuper = false;

  if (session) {
    isSuper =
      isUserSuperAdmin(session.email, session.cargo) ||
      Boolean(session.isSuperAdmin) ||
      Boolean(session.isMestre);

    if (!isSuper && session.userId) {
      try {
        const u = await prisma.usuario.findUnique({ where: { id: session.userId } });
        if (u && isUserSuperAdmin(u.email, u.cargo)) {
          isSuper = true;
        }
      } catch (e) {
        console.error("Erro ao verificar admin:", e);
      }
    }
  }

  if (!isSuper) {
    return NextResponse.json(
      { error: "Acesso restrito ao Super Administrador." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { config: incomingConfig, action } = body;

    // Resetar para padrão
    if (action === "reset") {
      await prisma.configuracaoSaaS.upsert({
        where: { id: "saas-global-config" },
        update: { landingConfigJson: null },
        create: { id: "saas-global-config", landingConfigJson: null },
      });

      return NextResponse.json({
        success: true,
        message: "Configurações da Landing Page restauradas para o padrão de fábrica!",
        config: DEFAULT_LANDING_CONFIG,
      });
    }

    if (!incomingConfig || typeof incomingConfig !== "object") {
      return NextResponse.json({ error: "Dados de configuração inválidos." }, { status: 400 });
    }

    const jsonString = JSON.stringify(incomingConfig);

    await prisma.configuracaoSaaS.upsert({
      where: { id: "saas-global-config" },
      update: { landingConfigJson: jsonString },
      create: { id: "saas-global-config", landingConfigJson: jsonString },
    });

    return NextResponse.json({
      success: true,
      message: "Personalização da Landing Page salva com sucesso!",
      config: incomingConfig,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
