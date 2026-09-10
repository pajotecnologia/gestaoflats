export interface PlanFeature {
  key: string;
  name: string;
  description: string;
  included: boolean | string | number;
}

export interface PlanDefinition {
  id: string;
  slug: "ESSENCIAL" | "PROFISSIONAL" | "GESTAO" | "EMPRESARIAL" | "ENTERPRISE" | "TRIAL" | "MESTRE";
  name: string;
  badge?: string;
  description: string;
  popular?: boolean;
  priceMonthly: number;
  priceYearlyMonthlyEquivalent: number; // valor mensal quando cobrado anualmente (~15-20% desconto)
  priceYearlyTotal: number;
  
  // Limites Numéricos de Capacidade
  limits: {
    maxProperties: number; // Quantidade de imóveis / flats cadastrados
    maxUsers: number; // Quantidade de usuários / operadores
    maxSignaturesPerMonth: number; // Assinaturas digitais de contratos e vistorias por mês
    maxStorageGB: number; // Armazenamento para fotos de vistorias, laudos e documentos
    maxWhatsAppMessagesPerMonth: number; // Estimativa de disparos mensais
    maxOwners: number; // Gestão de múltiplos proprietários terceiros
  };

  // Matriz de Entitlements / Funcionalidades
  features: {
    reservasDiarias: boolean;
    gestaoLocatarios: boolean;
    editorContratos: boolean;
    assinaturaDigital: boolean;
    auditoriaBlockchain: boolean;
    vistoriasComFotos: boolean;
    cameraNativaWebcam: boolean;
    financeiroBasico: boolean;
    boletosInterBolepix: boolean;
    recibosAutomaticos: boolean;
    whatsappEvolutionApi: boolean;
    alertasTempoReal: boolean;
    dashboardNivel: "BASICO" | "COMPLETO" | "AVANCADO";
    relatoriosNivel: "BASICOS" | "COMPLETOS" | "AVANCADOS";
    gestaoProprietarios: boolean;
    repassesAutomaticos: boolean;
    permissoesAvancadas: boolean;
    suporteNivel: "PADRAO" | "PRIORITARIO" | "GERENTE_CONTA" | "SLA_DEDICADO";
  };
  
  idealPara: string;
}

export const SAAS_PLANS: Record<string, PlanDefinition> = {
  ESSENCIAL: {
    id: "plan-essencial",
    slug: "ESSENCIAL",
    name: "Plano Essencial",
    description: "Ideal para pequenos proprietários que querem organizar e profissionalizar suas locações.",
    popular: false,
    priceMonthly: 79.0,
    priceYearlyMonthlyEquivalent: 67.0,
    priceYearlyTotal: 799.0,
    limits: {
      maxProperties: 3,
      maxUsers: 1,
      maxSignaturesPerMonth: 5,
      maxStorageGB: 2,
      maxWhatsAppMessagesPerMonth: 150,
      maxOwners: 1,
    },
    features: {
      reservasDiarias: true,
      gestaoLocatarios: true,
      editorContratos: true,
      assinaturaDigital: true,
      auditoriaBlockchain: true,
      vistoriasComFotos: true,
      cameraNativaWebcam: true,
      financeiroBasico: true,
      boletosInterBolepix: true,
      recibosAutomaticos: true,
      whatsappEvolutionApi: true,
      alertasTempoReal: true,
      dashboardNivel: "BASICO",
      relatoriosNivel: "BASICOS",
      gestaoProprietarios: false,
      repassesAutomaticos: false,
      permissoesAvancadas: false,
      suporteNivel: "PADRAO",
    },
    idealPara: "Proprietários individuais com até 3 imóveis ou flats.",
  },

  PROFISSIONAL: {
    id: "plan-profissional",
    slug: "PROFISSIONAL",
    name: "Plano Profissional",
    badge: "MAIS ESCOLHIDO",
    description: "O plano mais equilibrado e completo para investidores e locadores profissionais.",
    popular: true,
    priceMonthly: 149.0,
    priceYearlyMonthlyEquivalent: 125.0,
    priceYearlyTotal: 1490.0,
    limits: {
      maxProperties: 10,
      maxUsers: 3,
      maxSignaturesPerMonth: 20,
      maxStorageGB: 10,
      maxWhatsAppMessagesPerMonth: 500,
      maxOwners: 5,
    },
    features: {
      reservasDiarias: true,
      gestaoLocatarios: true,
      editorContratos: true,
      assinaturaDigital: true,
      auditoriaBlockchain: true,
      vistoriasComFotos: true,
      cameraNativaWebcam: true,
      financeiroBasico: true,
      boletosInterBolepix: true,
      recibosAutomaticos: true,
      whatsappEvolutionApi: true,
      alertasTempoReal: true,
      dashboardNivel: "COMPLETO",
      relatoriosNivel: "COMPLETOS",
      gestaoProprietarios: true,
      repassesAutomaticos: true,
      permissoesAvancadas: true,
      suporteNivel: "PRIORITARIO",
    },
    idealPara: "Gestores e investidores imobiliários com até 10 imóveis.",
  },

  GESTAO: {
    id: "plan-gestao",
    slug: "GESTAO",
    name: "Plano Gestão",
    description: "Perfeito para administradores de imóveis, condomínios e operações em franca expansão.",
    popular: false,
    priceMonthly: 279.0,
    priceYearlyMonthlyEquivalent: 235.0,
    priceYearlyTotal: 2790.0,
    limits: {
      maxProperties: 30,
      maxUsers: 5,
      maxSignaturesPerMonth: 50,
      maxStorageGB: 30,
      maxWhatsAppMessagesPerMonth: 1500,
      maxOwners: 20,
    },
    features: {
      reservasDiarias: true,
      gestaoLocatarios: true,
      editorContratos: true,
      assinaturaDigital: true,
      auditoriaBlockchain: true,
      vistoriasComFotos: true,
      cameraNativaWebcam: true,
      financeiroBasico: true,
      boletosInterBolepix: true,
      recibosAutomaticos: true,
      whatsappEvolutionApi: true,
      alertasTempoReal: true,
      dashboardNivel: "AVANCADO",
      relatoriosNivel: "AVANCADOS",
      gestaoProprietarios: true,
      repassesAutomaticos: true,
      permissoesAvancadas: true,
      suporteNivel: "PRIORITARIO",
    },
    idealPara: "Administradores de locação e chácaras com até 30 imóveis.",
  },

  EMPRESARIAL: {
    id: "plan-empresarial",
    slug: "EMPRESARIAL",
    name: "Plano Empresarial",
    description: "Capacidade máxima, alto volume operacional e suporte dedicado para imobiliárias e empresas de locação.",
    popular: false,
    priceMonthly: 449.0,
    priceYearlyMonthlyEquivalent: 375.0,
    priceYearlyTotal: 4490.0,
    limits: {
      maxProperties: 60,
      maxUsers: 10,
      maxSignaturesPerMonth: 100,
      maxStorageGB: 100,
      maxWhatsAppMessagesPerMonth: 4000,
      maxOwners: 50,
    },
    features: {
      reservasDiarias: true,
      gestaoLocatarios: true,
      editorContratos: true,
      assinaturaDigital: true,
      auditoriaBlockchain: true,
      vistoriasComFotos: true,
      cameraNativaWebcam: true,
      financeiroBasico: true,
      boletosInterBolepix: true,
      recibosAutomaticos: true,
      whatsappEvolutionApi: true,
      alertasTempoReal: true,
      dashboardNivel: "AVANCADO",
      relatoriosNivel: "AVANCADOS",
      gestaoProprietarios: true,
      repassesAutomaticos: true,
      permissoesAvancadas: true,
      suporteNivel: "GERENTE_CONTA",
    },
    idealPara: "Imobiliárias, redes de flats e empresas de locação com até 60 imóveis.",
  },

  ENTERPRISE: {
    id: "plan-enterprise",
    slug: "ENTERPRISE",
    name: "Plano Enterprise",
    description: "Soluções personalizadas, limites customizados e atendimento VIP para grandes redes e administradoras.",
    popular: false,
    priceMonthly: 599.0,
    priceYearlyMonthlyEquivalent: 499.0,
    priceYearlyTotal: 5990.0,
    limits: {
      maxProperties: 9999,
      maxUsers: 999,
      maxSignaturesPerMonth: 9999,
      maxStorageGB: 500,
      maxWhatsAppMessagesPerMonth: 20000,
      maxOwners: 999,
    },
    features: {
      reservasDiarias: true,
      gestaoLocatarios: true,
      editorContratos: true,
      assinaturaDigital: true,
      auditoriaBlockchain: true,
      vistoriasComFotos: true,
      cameraNativaWebcam: true,
      financeiroBasico: true,
      boletosInterBolepix: true,
      recibosAutomaticos: true,
      whatsappEvolutionApi: true,
      alertasTempoReal: true,
      dashboardNivel: "AVANCADO",
      relatoriosNivel: "AVANCADOS",
      gestaoProprietarios: true,
      repassesAutomaticos: true,
      permissoesAvancadas: true,
      suporteNivel: "SLA_DEDICADO",
    },
    idealPara: "Grandes imobiliárias, resorts e administradoras com mais de 60 imóveis.",
  },

  // Período de Avaliação Gratuita (Experimenta recursos do Profissional)
  TRIAL: {
    id: "plan-trial",
    slug: "TRIAL",
    name: "Período de Teste (Trial)",
    description: "Acesso completo de demonstração para você vivenciar todo o valor do IMOB.",
    popular: false,
    priceMonthly: 0,
    priceYearlyMonthlyEquivalent: 0,
    priceYearlyTotal: 0,
    limits: {
      maxProperties: 10,
      maxUsers: 3,
      maxSignaturesPerMonth: 10,
      maxStorageGB: 5,
      maxWhatsAppMessagesPerMonth: 100,
      maxOwners: 3,
    },
    features: {
      reservasDiarias: true,
      gestaoLocatarios: true,
      editorContratos: true,
      assinaturaDigital: true,
      auditoriaBlockchain: true,
      vistoriasComFotos: true,
      cameraNativaWebcam: true,
      financeiroBasico: true,
      boletosInterBolepix: true,
      recibosAutomaticos: true,
      whatsappEvolutionApi: true,
      alertasTempoReal: true,
      dashboardNivel: "COMPLETO",
      relatoriosNivel: "COMPLETOS",
      gestaoProprietarios: true,
      repassesAutomaticos: true,
      permissoesAvancadas: true,
      suporteNivel: "PRIORITARIO",
    },
    idealPara: "Experimentação de todas as funcionalidades da plataforma.",
  },

  // Empresa Mestre (Proprietária da PAJO Tecnologia - Vitalício & Irrestrito)
  MESTRE: {
    id: "plan-mestre",
    slug: "MESTRE",
    name: "Empresa Mestre (Vitalício)",
    description: "Acesso vitalício irrestrito para a gestão central da PAJO Tecnologia.",
    popular: false,
    priceMonthly: 0,
    priceYearlyMonthlyEquivalent: 0,
    priceYearlyTotal: 0,
    limits: {
      maxProperties: 99999,
      maxUsers: 9999,
      maxSignaturesPerMonth: 99999,
      maxStorageGB: 9999,
      maxWhatsAppMessagesPerMonth: 999999,
      maxOwners: 9999,
    },
    features: {
      reservasDiarias: true,
      gestaoLocatarios: true,
      editorContratos: true,
      assinaturaDigital: true,
      auditoriaBlockchain: true,
      vistoriasComFotos: true,
      cameraNativaWebcam: true,
      financeiroBasico: true,
      boletosInterBolepix: true,
      recibosAutomaticos: true,
      whatsappEvolutionApi: true,
      alertasTempoReal: true,
      dashboardNivel: "AVANCADO",
      relatoriosNivel: "AVANCADOS",
      gestaoProprietarios: true,
      repassesAutomaticos: true,
      permissoesAvancadas: true,
      suporteNivel: "SLA_DEDICADO",
    },
    idealPara: "Administração Geral do SaaS.",
  },
};

/**
 * Retorna a lista dos 4 planos comerciais padrão para a Landing Page e página de Preços
 */
export const COMMERCIAL_PLANS = [
  SAAS_PLANS.ESSENCIAL,
  SAAS_PLANS.PROFISSIONAL,
  SAAS_PLANS.GESTAO,
  SAAS_PLANS.EMPRESARIAL,
];

/**
 * Retorna a lista dos planos comerciais considerando customizações salvas no banco
 */
export function getCommercialPlans(customPlans?: Record<string, PlanDefinition>): PlanDefinition[] {
  const plans = customPlans || SAAS_PLANS;
  return [
    plans.ESSENCIAL || SAAS_PLANS.ESSENCIAL,
    plans.PROFISSIONAL || SAAS_PLANS.PROFISSIONAL,
    plans.GESTAO || SAAS_PLANS.GESTAO,
    plans.EMPRESARIAL || SAAS_PLANS.EMPRESARIAL,
  ];
}

/**
 * Retorna o próximo plano sugerido para upgrade quando o limite for atingido
 */
export function getNextUpgradePlan(currentSlug: string): PlanDefinition | null {
  const normalized = currentSlug?.toUpperCase();
  if (normalized === "ESSENCIAL") return SAAS_PLANS.PROFISSIONAL;
  if (normalized === "PROFISSIONAL") return SAAS_PLANS.GESTAO;
  if (normalized === "GESTAO") return SAAS_PLANS.EMPRESARIAL;
  if (normalized === "EMPRESARIAL") return SAAS_PLANS.ENTERPRISE;
  return SAAS_PLANS.PROFISSIONAL; // Padrão se for Trial
}
