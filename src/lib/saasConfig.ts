import { prisma } from "@/lib/prisma";

export interface SaasConfigData {
  id: string;
  diasTrialPadrao: number;
  chavePix: string;
  tipoChavePix: string;
  nomeBeneficiarioPix: string;
  cidadePix: string;
  valorMensal: number;
  valorTrimestral: number;
  valorSemestral: number;
  valorAnual: number;
  diasAvisoAntesExpirar: number;
  telefoneSuporteWhatsApp: string;
  mensagemAvisoWhatsApp: string;
  emailNotificacaoAdmin?: string;
}

export const DEFAULT_SAAS_CONFIG: SaasConfigData = {
  id: "saas-global-config",
  diasTrialPadrao: 7,
  chavePix: "contato@pajotech.com.br",
  tipoChavePix: "EMAIL",
  nomeBeneficiarioPix: "PAJO TECNOLOGIA",
  cidadePix: "RECIFE",
  valorMensal: 97.0,
  valorTrimestral: 260.0,
  valorSemestral: 490.0,
  valorAnual: 890.0,
  diasAvisoAntesExpirar: 3,
  telefoneSuporteWhatsApp: "(87) 99654-0551",
  emailNotificacaoAdmin: "pajotecnologia@gmail.com",
  mensagemAvisoWhatsApp:
    "Olá, {{nome}}! Informamos que o período de teste do Gestão de Flats para a empresa {{empresa}} irá expirar em {{dias_restantes}} dia(s) (Data: {{data_expiracao}}). Para continuar utilizando todos os recursos sem interrupções, renove seu acesso no link: {{link_renovacao}}",
};

/**
 * Obtém as configurações globais do SaaS (ou cria padrão caso não existam)
 */
export async function getSaasConfig(): Promise<SaasConfigData> {
  try {
    let config = await prisma.configuracaoSaaS.findFirst();
    if (!config) {
      config = await prisma.configuracaoSaaS.create({
        data: {
          id: "saas-global-config",
          diasTrialPadrao: DEFAULT_SAAS_CONFIG.diasTrialPadrao,
          chavePix: DEFAULT_SAAS_CONFIG.chavePix,
          tipoChavePix: DEFAULT_SAAS_CONFIG.tipoChavePix,
          nomeBeneficiarioPix: DEFAULT_SAAS_CONFIG.nomeBeneficiarioPix,
          cidadePix: DEFAULT_SAAS_CONFIG.cidadePix,
          valorMensal: DEFAULT_SAAS_CONFIG.valorMensal,
          valorTrimestral: DEFAULT_SAAS_CONFIG.valorTrimestral,
          valorSemestral: DEFAULT_SAAS_CONFIG.valorSemestral,
          valorAnual: DEFAULT_SAAS_CONFIG.valorAnual,
          diasAvisoAntesExpirar: DEFAULT_SAAS_CONFIG.diasAvisoAntesExpirar,
          telefoneSuporteWhatsApp: DEFAULT_SAAS_CONFIG.telefoneSuporteWhatsApp,
          mensagemAvisoWhatsApp: DEFAULT_SAAS_CONFIG.mensagemAvisoWhatsApp,
        },
      });
    }
    return {
      id: config.id,
      diasTrialPadrao: config.diasTrialPadrao ?? 7,
      chavePix: config.chavePix || DEFAULT_SAAS_CONFIG.chavePix,
      tipoChavePix: config.tipoChavePix || DEFAULT_SAAS_CONFIG.tipoChavePix,
      nomeBeneficiarioPix: config.nomeBeneficiarioPix || DEFAULT_SAAS_CONFIG.nomeBeneficiarioPix,
      cidadePix: config.cidadePix || DEFAULT_SAAS_CONFIG.cidadePix,
      valorMensal: config.valorMensal ?? DEFAULT_SAAS_CONFIG.valorMensal,
      valorTrimestral: config.valorTrimestral ?? DEFAULT_SAAS_CONFIG.valorTrimestral,
      valorSemestral: config.valorSemestral ?? DEFAULT_SAAS_CONFIG.valorSemestral,
      valorAnual: config.valorAnual ?? DEFAULT_SAAS_CONFIG.valorAnual,
      diasAvisoAntesExpirar: config.diasAvisoAntesExpirar ?? DEFAULT_SAAS_CONFIG.diasAvisoAntesExpirar,
      telefoneSuporteWhatsApp: config.telefoneSuporteWhatsApp || DEFAULT_SAAS_CONFIG.telefoneSuporteWhatsApp,
      mensagemAvisoWhatsApp: config.mensagemAvisoWhatsApp || DEFAULT_SAAS_CONFIG.mensagemAvisoWhatsApp,
      emailNotificacaoAdmin: DEFAULT_SAAS_CONFIG.emailNotificacaoAdmin,
    };
  } catch (error) {
    console.error("Erro ao buscar configurações SaaS:", error);
    return DEFAULT_SAAS_CONFIG;
  }
}

export interface StatusAcessoEmpresa {
  status: "TRIAL" | "ATIVO" | "EXPIRADO" | "BLOQUEADO";
  planoAtual: string;
  isTrial: boolean;
  isExpirado: boolean;
  diasRestantes: number;
  dataExpiracao: string | null;
  dataExpiracaoObj: Date | null;
  podeAcessar: boolean;
}

/**
 * Avalia a situação do acesso e dias restantes de uma empresa
 */
export async function verificarStatusAcesso(empresaId: string): Promise<StatusAcessoEmpresa> {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: {
      id: true,
      statusAssinatura: true,
      dataInicioTrial: true,
      dataFimTrial: true,
      dataFimAcesso: true,
      planoAtual: true,
      createdAt: true,
    },
  });

  if (!empresa) {
    return {
      status: "BLOQUEADO",
      planoAtual: "NENHUM",
      isTrial: false,
      isExpirado: true,
      diasRestantes: 0,
      dataExpiracao: null,
      dataExpiracaoObj: null,
      podeAcessar: false,
    };
  }

  const agora = new Date();

  // Determinar data limite de acesso (dataFimAcesso ou dataFimTrial ou 7 dias após criação)
  let dataLimite = empresa.dataFimAcesso || empresa.dataFimTrial;
  if (!dataLimite) {
    const config = await getSaasConfig();
    const dataCriacao = empresa.createdAt || agora;
    dataLimite = new Date(dataCriacao.getTime() + config.diasTrialPadrao * 24 * 60 * 60 * 1000);
  }

  const diffMs = dataLimite.getTime() - agora.getTime();
  const diasRestantes = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const expirou = agora.getTime() > dataLimite.getTime();

  let statusCalculado = empresa.statusAssinatura || "TRIAL";
  if (empresa.statusAssinatura === "BLOQUEADO") {
    statusCalculado = "BLOQUEADO";
  } else if (expirou && empresa.statusAssinatura !== "ATIVO") {
    statusCalculado = "EXPIRADO";
  } else if (empresa.statusAssinatura === "ATIVO" && expirou) {
    statusCalculado = "EXPIRADO";
  }

  const podeAcessar = statusCalculado === "ATIVO" || (statusCalculado === "TRIAL" && !expirou);

  return {
    status: statusCalculado as "TRIAL" | "ATIVO" | "EXPIRADO" | "BLOQUEADO",
    planoAtual: empresa.planoAtual || "TRIAL",
    isTrial: statusCalculado === "TRIAL",
    isExpirado: !podeAcessar,
    diasRestantes,
    dataExpiracao: dataLimite ? dataLimite.toISOString() : null,
    dataExpiracaoObj: dataLimite,
    podeAcessar,
  };
}
