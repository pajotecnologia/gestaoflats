import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback, isUserSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SAAS_PLANS, PlanDefinition, getCommercialPlans, getPlansForCompany } from "@/lib/plans/planDefinitions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedPlanoId = searchParams.get("planoId") || undefined;
    const session = await getAuthSessionOrFallback();

    const isSuper = session
      ? isUserSuperAdmin(session.email, session.cargo) || Boolean(session.isSuperAdmin) || Boolean(session.isMestre)
      : false;

    const config = await prisma.configuracaoSaaS.findFirst();
    let planos: Record<string, PlanDefinition> = { ...SAAS_PLANS };

    if (config?.planosConfigJson) {
      try {
        const custom = JSON.parse(config.planosConfigJson);
        planos = { ...SAAS_PLANS, ...custom };
      } catch (e) {
        console.error("Erro ao fazer parse de planosConfigJson:", e);
      }
    }

    // Se for SuperAdmin, retorna todos os planos para gestão no painel
    if (isSuper) {
      return NextResponse.json({
        planos,
        allPlansList: Object.values(planos),
        commercialPlans: getCommercialPlans(planos),
        hasCustomConfig: Boolean(config?.planosConfigJson),
      });
    }

    // Se for um cliente regular ou checkout público:
    const clientEligiblePlans = getPlansForCompany(session?.empresaId, planos, requestedPlanoId);
    const commercialPlans = getCommercialPlans(planos);

    return NextResponse.json({
      planos,
      clientEligiblePlans,
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

export async function DELETE(request: NextRequest) {
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
    const { planos, plano, planoId, action } = body;

    const config = await prisma.configuracaoSaaS.findFirst();
    let currentPlans: Record<string, PlanDefinition> = { ...SAAS_PLANS };
    if (config?.planosConfigJson) {
      try {
        currentPlans = { ...SAAS_PLANS, ...JSON.parse(config.planosConfigJson) };
      } catch (e) {}
    }

    // 1. Restaurar Padrão de Fábrica
    if (action === "reset") {
      await prisma.configuracaoSaaS.upsert({
        where: { id: "saas-global-config" },
        update: { planosConfigJson: null },
        create: { id: "saas-global-config", planosConfigJson: null },
      });
      return NextResponse.json({
        success: true,
        message: "Planos restaurados para o padrão de fábrica com sucesso!",
        planos: SAAS_PLANS,
      });
    }

    // 2. Criar ou Atualizar um Plano Específico (Upsert)
    if (action === "upsert_plano" && plano) {
      const planSlug = (plano.slug || plano.id || `CUSTOM_${Date.now()}`).toUpperCase().replace(/[^A-Z0-9_]/g, "_");
      const planId = plano.id || `plan-${planSlug.toLowerCase()}`;

      const updatedPlan: PlanDefinition = {
        ...SAAS_PLANS.PROFISSIONAL, // Base fallback com todas as features
        ...plano,
        id: planId,
        slug: planSlug,
        isCustom: true,
        visivelPublico: plano.visivelPublico !== false,
        empresasAutorizadasIds: plano.empresasAutorizadasIds || [],
        priceMonthly: parseFloat(plano.priceMonthly) || 0,
        priceQuarterly: parseFloat(plano.priceQuarterly) || undefined,
        priceSemiannual: parseFloat(plano.priceSemiannual) || undefined,
        priceYearlyMonthlyEquivalent: parseFloat(plano.priceYearlyMonthlyEquivalent) || Math.round((parseFloat(plano.priceYearlyTotal) || (parseFloat(plano.priceMonthly) * 10)) / 12),
        priceYearlyTotal: parseFloat(plano.priceYearlyTotal) || (parseFloat(plano.priceMonthly) * 10),
        limits: {
          maxProperties: parseInt(plano.limits?.maxProperties, 10) || 10,
          maxUsers: parseInt(plano.limits?.maxUsers, 10) || 3,
          maxSignaturesPerMonth: parseInt(plano.limits?.maxSignaturesPerMonth, 10) || 20,
          maxStorageGB: parseInt(plano.limits?.maxStorageGB, 10) || 5,
          maxWhatsAppMessagesPerMonth: parseInt(plano.limits?.maxWhatsAppMessagesPerMonth, 10) || 500,
          maxOwners: parseInt(plano.limits?.maxOwners, 10) || 5,
        },
      };

      currentPlans[planSlug] = updatedPlan;
      const jsonString = JSON.stringify(currentPlans);

      await prisma.configuracaoSaaS.upsert({
        where: { id: "saas-global-config" },
        update: { planosConfigJson: jsonString },
        create: { id: "saas-global-config", planosConfigJson: jsonString },
      });

      return NextResponse.json({
        success: true,
        message: `Plano "${updatedPlan.name}" salvo com sucesso!`,
        plano: updatedPlan,
        planos: currentPlans,
      });
    }

    // 3. Excluir Plano Customizado
    if (action === "delete_plano" && (planoId || body.slug)) {
      const targetSlug = body.slug || Object.keys(currentPlans).find((k) => currentPlans[k].id === planoId);
      if (targetSlug && currentPlans[targetSlug]) {
        // Não permite excluir planos base obrigatórios (Essencial, Profissional, Gestão, Empresarial)
        const isCore = ["ESSENCIAL", "PROFISSIONAL", "GESTAO", "EMPRESARIAL", "TRIAL", "MESTRE"].includes(targetSlug);
        if (isCore) {
          return NextResponse.json({ error: "Os 4 planos base do sistema não podem ser excluídos, apenas editados." }, { status: 400 });
        }

        delete currentPlans[targetSlug];
        const jsonString = JSON.stringify(currentPlans);

        await prisma.configuracaoSaaS.upsert({
          where: { id: "saas-global-config" },
          update: { planosConfigJson: jsonString },
          create: { id: "saas-global-config", planosConfigJson: jsonString },
        });

        return NextResponse.json({
          success: true,
          message: "Plano personalizado excluído com sucesso!",
          planos: currentPlans,
        });
      }
    }

    // 4. Salvar Todos os Planos em Lote
    if (planos && typeof planos === "object") {
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
    }

    return NextResponse.json({ error: "Ação ou formato de planos inválido." }, { status: 400 });
  } catch (error: any) {
    console.error("Erro ao salvar planos SaaS:", error);
    return NextResponse.json({ error: error.message || "Erro ao salvar planos" }, { status: 500 });
  }
}
