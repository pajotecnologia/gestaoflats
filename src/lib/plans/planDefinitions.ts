export interface PlanFeature {
  key: string;
  name: string;
  description: string;
  included: boolean | string | number;
}

export interface PlanDefinition {
  id: string;
  slug: string; // "ESSENCIAL" | "PROFISSIONAL" | "GESTAO" | "EMPRESARIAL" | "ENTERPRISE" | "TRIAL" | "MESTRE" | string custom
  name: string;
  badge?: string;
  description: string;
  popular?: boolean;
  isCustom?: boolean;
  visivelPublico?: boolean; // true = aparece na Landing Page e /renovar geral; false = oculto / privado
  empresasAutorizadasIds?: string[]; // IDs de empresas com acesso a este plano exclusivo
  priceMonthly: number;
  priceQuarterly?: number; // Trimestral
  priceSemiannual?: number; // Semestral
  priceYearlyMonthlyEquivalent: number; // valor mensal quando cobrado anualmente (~10% de desconto)
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
    priceMonthly: 69.0,
    priceYearlyMonthlyEquivalent: 62.0,
    priceYearlyTotal: 745.0,
    limits: {
      maxProperties: 2,
      maxUsers: 1,
      maxSignaturesPerMonth: 5,
      maxStorageGB: 2,
      maxWhatsAppMessagesPerMonth: 50,
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
    idealPara: "Proprietários individuais com até 2 imóveis ou chácaras.",
  },

  SMART: {
    id: "plan-smart",
    slug: "SMART",
    name: "Plano Smart",
    description: "Para quem está expandindo de 1 imóvel para uma pequena carteira organizada.",
    popular: false,
    priceMonthly: 169.0,
    priceYearlyMonthlyEquivalent: 152.0,
    priceYearlyTotal: 1825.0,
    limits: {
      maxProperties: 5,
      maxUsers: 2,
      maxSignaturesPerMonth: 10,
      maxStorageGB: 5,
      maxWhatsAppMessagesPerMonth: 250,
      maxOwners: 2,
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
      relatoriosNivel: "BASICOS",
      gestaoProprietarios: true,
      repassesAutomaticos: false,
      permissoesAvancadas: false,
      suporteNivel: "PADRAO",
    },
    idealPara: "Locadores e anfitriões com até 5 imóveis ou flats.",
  },

  PROFISSIONAL: {
    id: "plan-profissional",
    slug: "PROFISSIONAL",
    name: "Plano Profissional",
    badge: "MAIS ESCOLHIDO",
    description: "O plano mais equilibrado e completo para investidores e locadores profissionais.",
    popular: true,
    priceMonthly: 289.0,
    priceYearlyMonthlyEquivalent: 260.0,
    priceYearlyTotal: 3120.0,
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

  PERFORMANCE: {
    id: "plan-performance",
    slug: "PERFORMANCE",
    name: "Plano Performance",
    description: "Perfeito para locadores que superaram 10 imóveis e buscam alta produtividade.",
    popular: false,
    priceMonthly: 389.0,
    priceYearlyMonthlyEquivalent: 350.0,
    priceYearlyTotal: 4200.0,
    limits: {
      maxProperties: 15,
      maxUsers: 4,
      maxSignaturesPerMonth: 30,
      maxStorageGB: 15,
      maxWhatsAppMessagesPerMonth: 750,
      maxOwners: 10,
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
    idealPara: "Administradores de locação com até 15 imóveis.",
  },

  PREMIUM: {
    id: "plan-premium",
    slug: "PREMIUM",
    name: "Plano Premium",
    description: "Capacidade intermediária robusta para empresas e pousadas com até 20 imóveis.",
    popular: false,
    priceMonthly: 489.0,
    priceYearlyMonthlyEquivalent: 440.0,
    priceYearlyTotal: 5280.0,
    limits: {
      maxProperties: 20,
      maxUsers: 4,
      maxSignaturesPerMonth: 40,
      maxStorageGB: 20,
      maxWhatsAppMessagesPerMonth: 1000,
      maxOwners: 15,
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
    idealPara: "Empresas de locação e condomínios com até 20 imóveis.",
  },

  GESTAO: {
    id: "plan-gestao",
    slug: "GESTAO",
    name: "Plano Gestão",
    description: "Perfeito para administradores de imóveis, condomínios e operações em franca expansão.",
    popular: false,
    priceMonthly: 600.0,
    priceYearlyMonthlyEquivalent: 540.0,
    priceYearlyTotal: 6480.0,
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
    priceMonthly: 990.0,
    priceYearlyMonthlyEquivalent: 891.0,
    priceYearlyTotal: 10692.0,
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
    priceMonthly: 1690.0,
    priceYearlyMonthlyEquivalent: 1521.0,
    priceYearlyTotal: 18252.0,
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
 * Retorna a lista dos planos comerciais padrão para a Landing Page e página de Preços
 */
export const COMMERCIAL_PLANS = [
  SAAS_PLANS.ESSENCIAL,
  SAAS_PLANS.SMART,
  SAAS_PLANS.PROFISSIONAL,
  SAAS_PLANS.PERFORMANCE,
  SAAS_PLANS.PREMIUM,
  SAAS_PLANS.GESTAO,
  SAAS_PLANS.EMPRESARIAL,
];

/**
 * Retorna a lista dos planos comerciais considerando customizações salvas no banco
 * Inclui os planos públicos e omite planos privados/ocultos por padrão.
 */
export function getCommercialPlans(customPlans?: Record<string, PlanDefinition>): PlanDefinition[] {
  const plans = customPlans || SAAS_PLANS;
  const list = Object.values(plans).filter((p) => {
    // Excluir Trial e Mestre da vitrine pública
    if (p.slug === "TRIAL" || p.slug === "MESTRE") return false;
    // Se explicitamente marcado como privado / oculto, não exibe na landing page
    if (p.visivelPublico === false) return false;
    return true;
  });

  return list.length > 0 ? list : [
    SAAS_PLANS.ESSENCIAL,
    SAAS_PLANS.SMART,
    SAAS_PLANS.PROFISSIONAL,
    SAAS_PLANS.PERFORMANCE,
    SAAS_PLANS.PREMIUM,
    SAAS_PLANS.GESTAO,
    SAAS_PLANS.EMPRESARIAL,
  ];
}

/**
 * Retorna todos os planos elegíveis para uma empresa específica na tela /renovar:
 * - Todos os planos públicos
 * - Planos privados onde a empresa está na lista autorizada
 * - Plano solicitado especificamente via requestedPlanoId (Link Direto VIP)
 */
export function getPlansForCompany(
  empresaId?: string,
  customPlans?: Record<string, PlanDefinition>,
  requestedPlanoId?: string
): PlanDefinition[] {
  const plans = customPlans || SAAS_PLANS;
  return Object.values(plans).filter((p) => {
    if (p.slug === "TRIAL" || p.slug === "MESTRE") return false;

    // Se é o plano requisitado diretamente por ID (link VIP)
    if (requestedPlanoId && (p.id === requestedPlanoId || p.slug === requestedPlanoId)) {
      return true;
    }

    // Se é um plano público
    if (p.visivelPublico !== false) {
      return true;
    }

    // Se é um plano privado direcionado a esta empresa
    if (empresaId && p.empresasAutorizadasIds && p.empresasAutorizadasIds.includes(empresaId)) {
      return true;
    }

    return false;
  });
}

/**
 * Retorna o próximo plano sugerido para upgrade quando o limite for atingido
 */
export function getNextUpgradePlan(currentSlug: string): PlanDefinition | null {
  const normalized = currentSlug?.toUpperCase();
  if (normalized === "ESSENCIAL") return SAAS_PLANS.SMART || SAAS_PLANS.PROFISSIONAL;
  if (normalized === "SMART") return SAAS_PLANS.PROFISSIONAL;
  if (normalized === "PROFISSIONAL") return SAAS_PLANS.PERFORMANCE || SAAS_PLANS.GESTAO;
  if (normalized === "PERFORMANCE") return SAAS_PLANS.PREMIUM || SAAS_PLANS.GESTAO;
  if (normalized === "PREMIUM") return SAAS_PLANS.GESTAO;
  if (normalized === "GESTAO") return SAAS_PLANS.EMPRESARIAL;
  if (normalized === "EMPRESARIAL") return SAAS_PLANS.ENTERPRISE;
  return SAAS_PLANS.PROFISSIONAL; // Padrão se for Trial
}
