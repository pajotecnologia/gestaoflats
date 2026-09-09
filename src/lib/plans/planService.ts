import { prisma } from "@/lib/prisma";
import { SAAS_PLANS, PlanDefinition, getNextUpgradePlan } from "./planDefinitions";
import { verificarStatusAcesso } from "@/lib/saasConfig";

export interface OrganizationUsage {
  empresaId: string;
  empresaNome: string;
  isMestre: boolean;
  isTrial: boolean;
  statusAcesso: "TRIAL" | "ATIVO" | "EXPIRADO" | "BLOQUEADO";
  diasRestantesTrial: number;
  dataExpiracao: string | null;
  
  plan: PlanDefinition;
  
  // Contadores Atuais
  counts: {
    properties: number;
    users: number;
    signaturesThisMonth: number;
    storageGB: number;
    whatsappMessagesThisMonth: number;
    owners: number;
  };

  // Percentuais de Uso (0 - 100)
  percentages: {
    properties: number;
    users: number;
    signatures: number;
    storage: number;
    whatsapp: number;
  };

  // Flags de Alerta
  warnings: {
    propertiesNearLimit: boolean; // >= 70%
    propertiesLimitReached: boolean; // >= 100%
    usersLimitReached: boolean;
    signaturesLimitReached: boolean;
  };

  nextPlanForUpgrade: PlanDefinition | null;
}

export interface CheckLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
  limitKey: "properties" | "users" | "signatures" | "storage" | "whatsapp";
  message?: string;
  currentPlan: PlanDefinition;
  nextPlan: PlanDefinition | null;
}

/**
 * Retorna os planos ativos do SaaS (mesclando padrões com customizações salvas no banco)
 */
export async function getActiveSaasPlans(): Promise<Record<string, PlanDefinition>> {
  try {
    const config = await prisma.configuracaoSaaS.findFirst();
    if (config?.planosConfigJson) {
      const custom = JSON.parse(config.planosConfigJson);
      return { ...SAAS_PLANS, ...custom };
    }
  } catch (e) {}
  return SAAS_PLANS;
}

/**
 * Normaliza o slug do plano cadastrado no banco para a definição canônica
 */
export function normalizePlanSlug(
  planoString?: string | null,
  isMestre?: boolean,
  isTrial?: boolean,
  customPlans?: Record<string, PlanDefinition>
): PlanDefinition {
  const plans = customPlans || SAAS_PLANS;
  if (isMestre) return plans.MESTRE || SAAS_PLANS.MESTRE;
  if (isTrial) return plans.TRIAL || SAAS_PLANS.TRIAL;

  const raw = (planoString || "").toUpperCase().trim();
  if (raw === "ESSENCIAL") return plans.ESSENCIAL || SAAS_PLANS.ESSENCIAL;
  if (raw === "PROFISSIONAL" || raw === "MENSAL" || raw === "TRIMESTRAL") return plans.PROFISSIONAL || SAAS_PLANS.PROFISSIONAL;
  if (raw === "GESTAO" || raw === "SEMESTRAL") return plans.GESTAO || SAAS_PLANS.GESTAO;
  if (raw === "EMPRESARIAL" || raw === "ANUAL") return plans.EMPRESARIAL || SAAS_PLANS.EMPRESARIAL;
  if (raw === "ENTERPRISE") return plans.ENTERPRISE || SAAS_PLANS.ENTERPRISE;
  if (raw === "TRIAL") return plans.TRIAL || SAAS_PLANS.TRIAL;
  if (raw === "VITALICIO" || raw === "MESTRE") return plans.MESTRE || SAAS_PLANS.MESTRE;

  return plans.PROFISSIONAL || SAAS_PLANS.PROFISSIONAL; // Padrão seguro
}

/**
 * Retorna o plano efetivo de uma empresa
 */
export async function getOrganizationPlan(empresaId: string): Promise<PlanDefinition> {
  const [empresa, activePlans] = await Promise.all([
    prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { isMestre: true, statusAssinatura: true, planoAtual: true },
    }),
    getActiveSaasPlans(),
  ]);

  if (!empresa) return activePlans.ESSENCIAL || SAAS_PLANS.ESSENCIAL;
  const isTrial = empresa.statusAssinatura === "TRIAL";
  return normalizePlanSlug(empresa.planoAtual, Boolean(empresa.isMestre), isTrial, activePlans);
}

/**
 * Calcula o consumo real e métricas de quotas da empresa
 */
export async function getOrganizationUsage(empresaId: string): Promise<OrganizationUsage> {
  const [empresa, activePlans] = await Promise.all([
    prisma.empresa.findUnique({
      where: { id: empresaId },
      select: {
        id: true,
        nomeFantasia: true,
        isMestre: true,
        statusAssinatura: true,
        planoAtual: true,
        createdAt: true,
      },
    }),
    getActiveSaasPlans(),
  ]);

  if (!empresa) {
    throw new Error("Empresa não encontrada.");
  }

  const statusAcesso = await verificarStatusAcesso(empresaId);
  const plan = normalizePlanSlug(empresa.planoAtual, Boolean(empresa.isMestre), statusAcesso.isTrial, activePlans);

  // Início e fim do mês corrente para cota de assinaturas
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Consultas paralelas no banco para máxima performance
  const [
    propertiesCount,
    usersCount,
    contractsSignedThisMonth,
    vistoriasSignedThisMonth,
  ] = await Promise.all([
    prisma.flat.count({ where: { empresaId } }),
    prisma.usuario.count({ where: { empresaId } }),
    prisma.contrato.count({
      where: {
        empresaId,
        statusAssinatura: "ASSINADO",
        dataAssinaturaLocatario: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    prisma.vistoriaChecklist.count({
      where: {
        empresaId,
        statusAssinatura: { in: ["ASSINADO", "ASSINADO (IMPRESSO)"] },
        dataAssinaturaLocatario: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
  ]);

  const totalSignaturesThisMonth = contractsSignedThisMonth + vistoriasSignedThisMonth;
  // Estimativa aproximada de storage em GB com base em flats e assinaturas (ex: ~15MB por imóvel/vistoria)
  const estimatedStorageGB = Math.max(0.1, Number(((propertiesCount * 0.08) + (totalSignaturesThisMonth * 0.02)).toFixed(2)));

  const maxProps = plan.limits.maxProperties;
  const maxUsers = plan.limits.maxUsers;
  const maxSigs = plan.limits.maxSignaturesPerMonth;
  const maxStorage = plan.limits.maxStorageGB;
  const maxWhats = plan.limits.maxWhatsAppMessagesPerMonth;

  const propPercentage = maxProps >= 9999 ? 0 : Math.min(100, Math.round((propertiesCount / maxProps) * 100));
  const usersPercentage = maxUsers >= 999 ? 0 : Math.min(100, Math.round((usersCount / maxUsers) * 100));
  const sigsPercentage = maxSigs >= 9999 ? 0 : Math.min(100, Math.round((totalSignaturesThisMonth / maxSigs) * 100));
  const storagePercentage = maxStorage >= 9999 ? 0 : Math.min(100, Math.round((estimatedStorageGB / maxStorage) * 100));

  const nextPlan = getNextUpgradePlan(plan.slug);

  return {
    empresaId: empresa.id,
    empresaNome: empresa.nomeFantasia,
    isMestre: Boolean(empresa.isMestre),
    isTrial: statusAcesso.isTrial,
    statusAcesso: statusAcesso.status,
    diasRestantesTrial: statusAcesso.diasRestantes,
    dataExpiracao: statusAcesso.dataExpiracao,
    plan,
    counts: {
      properties: propertiesCount,
      users: usersCount,
      signaturesThisMonth: totalSignaturesThisMonth,
      storageGB: estimatedStorageGB,
      whatsappMessagesThisMonth: Math.min(propertiesCount * 8, maxWhats), // estimativa
      owners: 1,
    },
    percentages: {
      properties: propPercentage,
      users: usersPercentage,
      signatures: sigsPercentage,
      storage: storagePercentage,
      whatsapp: Math.round(((propertiesCount * 8) / maxWhats) * 100),
    },
    warnings: {
      propertiesNearLimit: propPercentage >= 70 && propPercentage < 100,
      propertiesLimitReached: propPercentage >= 100,
      usersLimitReached: usersPercentage >= 100,
      signaturesLimitReached: sigsPercentage >= 100,
    },
    nextPlanForUpgrade: nextPlan,
  };
}

/**
 * Validação centralizada e estrita de Limite de Quota no Backend
 */
export async function checkLimit(
  empresaId: string,
  limitKey: "properties" | "users" | "signatures" | "storage" | "whatsapp",
  increment: number = 1
): Promise<CheckLimitResult> {
  const usage = await getOrganizationUsage(empresaId);

  // Empresas Mestre possuem acesso irrestrito
  if (usage.isMestre) {
    return {
      allowed: true,
      current: usage.counts.properties,
      limit: 99999,
      remaining: 99999,
      isUnlimited: true,
      limitKey,
      currentPlan: usage.plan,
      nextPlan: null,
    };
  }

  let current = 0;
  let limit = 0;
  let resourceName = "";

  switch (limitKey) {
    case "properties":
      current = usage.counts.properties;
      limit = usage.plan.limits.maxProperties;
      resourceName = "imóveis cadastrados";
      break;
    case "users":
      current = usage.counts.users;
      limit = usage.plan.limits.maxUsers;
      resourceName = "usuários/colaboradores";
      break;
    case "signatures":
      current = usage.counts.signaturesThisMonth;
      limit = usage.plan.limits.maxSignaturesPerMonth;
      resourceName = "assinaturas digitais neste mês";
      break;
    case "storage":
      current = usage.counts.storageGB;
      limit = usage.plan.limits.maxStorageGB;
      resourceName = "GB de armazenamento";
      break;
    case "whatsapp":
      current = usage.counts.whatsappMessagesThisMonth;
      limit = usage.plan.limits.maxWhatsAppMessagesPerMonth;
      resourceName = "mensagens WhatsApp";
      break;
  }

  const isUnlimited = limit >= 9999;
  const nextVal = current + increment;
  const allowed = isUnlimited || nextVal <= limit;
  const remaining = Math.max(0, limit - current);

  let message: string | undefined = undefined;
  if (!allowed) {
    const nextPlanName = usage.nextPlanForUpgrade?.name || "superior";
    const nextPlanProps = usage.nextPlanForUpgrade?.limits.maxProperties || "+";
    message = `Você atingiu o limite de ${limit} ${resourceName} do seu ${usage.plan.name}. Faça upgrade para o ${nextPlanName} e gerencie até ${nextPlanProps} imóveis com muito mais capacidade!`;
  }

  return {
    allowed,
    current,
    limit,
    remaining,
    isUnlimited,
    limitKey,
    message,
    currentPlan: usage.plan,
    nextPlan: usage.nextPlanForUpgrade,
  };
}
