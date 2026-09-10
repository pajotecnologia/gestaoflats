import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback, isUserSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SAAS_PLANS, PlanDefinition, getCommercialPlans } from "@/lib/plans/planDefinitions";

export async function GET() {
  try {
    const config = await prisma.configuracaoSaaS.findFirst();
    let planos = { ...SAAS_PLANS };

    if (config?.planosConfigJson) {
      try {
        const custom = JSON.parse(config.planosConfigJson);
        planos = { ...SAAS_PLANS, ...custom };
      } catch (e) {
        console.error("Erro ao fazer parse de planosConfigJson:", e);
      }
    }

    const commercialPlans = getCommercialPlans(planos);

    return NextResponse.json({
      planos,
      commercialPlans,
      hasCustomConfig: Boolean(config?.planosConfigJson),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return handleSavePlanos(request);
}

export async function POST(request: NextRequest) {
  return handleSavePlanos(request);
}

async function handleSavePlanos(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  let isSuper = false;

  if (session) {
    isSuper = isUserSuperAdmin(session.email, session.cargo) || Boolean(session.isSuperAdmin) || Boolean(session.isMestre);
    
    // Verificação de segurança adicional consultando o usuário no banco
    if (!isSuper && session.userId) {
      try {
        const u = await prisma.usuario.findUnique({ where: { id: session.userId } });
        if (u && isUserSuperAdmin(u.email, u.cargo)) {
          isSuper = true;
        }
      } catch (e) {
        console.error("Erro ao verificar usuario admin no banco:", e);
      }
    }
  }

  if (!isSuper) {
    return NextResponse.json(
      { error: "Acesso restrito ao Super Administrador (pajotecnologia@gmail.com)." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { planos, action } = body;

    if (action === "reset") {
      await prisma.configuracaoSaaS.upsert({
        where: { id: "saas-global-config" },
        update: { planosConfigJson: null },
        create: { id: "saas-global-config", planosConfigJson: null },
      });
      return NextResponse.json({
        success: true,
        message: "Planos restaurados para o padrão com sucesso!",
        planos: SAAS_PLANS,
      });
    }

    if (!planos || typeof planos !== "object") {
      return NextResponse.json({ error: "Formato de planos inválido." }, { status: 400 });
    }

    const jsonString = JSON.stringify(planos);

    await prisma.configuracaoSaaS.upsert({
      where: { id: "saas-global-config" },
      update: { planosConfigJson: jsonString },
      create: { id: "saas-global-config", planosConfigJson: jsonString },
    });

    return NextResponse.json({
      success: true,
      message: "Limites e preços dos planos salvos com sucesso!",
      planos,
    });
  } catch (error: any) {
    console.error("Erro ao salvar planos SaaS:", error);
    return NextResponse.json({ error: error.message || "Erro ao salvar planos" }, { status: 500 });
  }
}
