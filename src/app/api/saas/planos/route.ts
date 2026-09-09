import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SAAS_PLANS, PlanDefinition } from "@/lib/plans/planDefinitions";

export async function GET() {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

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

    return NextResponse.json({ planos, hasCustomConfig: Boolean(config?.planosConfigJson) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session || (!session.isSuperAdmin && !session.isMestre)) {
    return NextResponse.json({ error: "Acesso restrito ao Super Administrador." }, { status: 403 });
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
      return NextResponse.json({ success: true, message: "Planos restaurados para o padrão com sucesso!", planos: SAAS_PLANS });
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

    return NextResponse.json({ success: true, message: "Limites e preços dos planos salvos com sucesso!", planos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
