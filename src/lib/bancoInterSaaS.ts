import { prisma } from "@/lib/prisma";
import {
  BancoInterConfig,
  createInterHttpsAgent,
  getInterBaseUrl,
  getInterOAuthToken,
  makeInterRequest,
} from "@/lib/bancoInter";
import { SAAS_PLANS } from "@/lib/plans/planDefinitions";
import { generatePixQRCode } from "@/lib/pix";

/**
 * Localiza a configuração ativa do Banco Inter do SaaS (Empresa Mestre ou primeira com Inter ativo)
 */
export async function getMasterBancoInterConfig(): Promise<{
  config: BancoInterConfig;
  empresaId: string;
}> {
  // 1. Tenta buscar parâmetros da empresa mestre
  let params = await prisma.configuracaoParametros.findFirst({
    where: {
      bancoInterAtivo: true,
      bancoInterClientId: { not: null },
      bancoInterCertCrt: { not: null },
      empresa: { isMestre: true },
    },
  });

  // 2. Se a empresa mestre não estiver configurada, busca a primeira empresa com Inter ativo e certificado
  if (!params) {
    params = await prisma.configuracaoParametros.findFirst({
      where: {
        bancoInterAtivo: true,
        bancoInterClientId: { not: null },
        bancoInterCertCrt: { not: null },
      },
    });
  }

  if (!params || !params.bancoInterClientId || !params.bancoInterCertCrt) {
    throw new Error("Nenhuma conta do Banco Inter com credenciais ativas foi configurada para o SaaS.");
  }

  return {
    empresaId: params.empresaId,
    config: {
      clientId: params.bancoInterClientId,
      clientSecret: params.bancoInterClientSecret || "",
      certCrt: params.bancoInterCertCrt,
      certKey: params.bancoInterCertKey || "",
      contaCorrente: params.bancoInterContaCorrente || undefined,
      ambiente: (params.bancoInterAmbiente as "PRODUCAO" | "SANDBOX") || "PRODUCAO",
      chavePix: params.bancoInterChavePix || undefined,
      ativo: Boolean(params.bancoInterAtivo),
      webhookUrl: params.bancoInterWebhookUrl || undefined,
    },
  };
}

export interface EmitirCobrancaSaaSParams {
  empresaId: string;
  planoSlug: string;
  ciclo: "MENSAL" | "ANUAL";
}

/**
 * Emite uma cobrança oficial Boleto com Pix (Bolepix) no Banco Inter para renovação do SaaS
 */
export async function emitirCobrancaSaaSBancoInter({
  empresaId,
  planoSlug,
  ciclo,
}: EmitirCobrancaSaaSParams) {
  const targetPlan = SAAS_PLANS[planoSlug.toUpperCase()] || SAAS_PLANS.PROFISSIONAL;
  const valor = ciclo === "ANUAL" ? targetPlan.priceYearlyTotal : targetPlan.priceMonthly;

  // 1. Busca os dados da empresa cliente pagadora
  const empresaPagadora = await prisma.empresa.findUnique({
    where: { id: empresaId },
  });

  if (!empresaPagadora) {
    throw new Error("Empresa pagadora não encontrada no sistema.");
  }

  // 2. Verifica se já existe uma cobrança pendente recente (últimas 12 horas) para o mesmo plano e valor
  const dozeHorasAtras = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const cobrancaExistente = await prisma.cobrancaAssinaturaSaaS.findFirst({
    where: {
      empresaId,
      plano: targetPlan.slug,
      ciclo,
      status: "PENDENTE",
      bancoInterPixCopiaECola: { not: null },
      createdAt: { gte: dozeHorasAtras },
    },
    orderBy: { createdAt: "desc" },
  });

  if (cobrancaExistente && cobrancaExistente.bancoInterPixCopiaECola) {
    const qrCodeBase64 =
      cobrancaExistente.bancoInterPixQrCode ||
      (await generatePixQRCode(cobrancaExistente.bancoInterPixCopiaECola));

    return {
      cobrancaId: cobrancaExistente.id,
      codigoSolicitacao: cobrancaExistente.bancoInterCodigoSolicitacao,
      pixCopiaECola: cobrancaExistente.bancoInterPixCopiaECola,
      qrCodeBase64,
      linhaDigitavel: cobrancaExistente.bancoInterLinhaDigitavel,
      pdfUrl: cobrancaExistente.bancoInterPdfUrl,
      valor,
      plano: targetPlan,
      ciclo,
    };
  }

  // 3. Obtém as credenciais mTLS do Banco Inter
  const { config: interConfig, empresaId: interEmpresaId } = await getMasterBancoInterConfig();
  const token = await getInterOAuthToken(interConfig, interEmpresaId);
  const agent = createInterHttpsAgent(interConfig.certCrt, interConfig.certKey);
  const baseUrl = getInterBaseUrl(interConfig.ambiente);

  // 4. Prepara dados do pagador
  let cnpjCpf = (empresaPagadora.cnpj || "").replace(/\D/g, "");
  if (!cnpjCpf || (cnpjCpf.length !== 11 && cnpjCpf.length !== 14)) {
    // Se o CNPJ da empresa não estiver preenchido com 14 dígitos, busca CPF do primeiro usuário admin
    const adminUser = await prisma.usuario.findFirst({
      where: { empresaId },
      orderBy: { createdAt: "asc" },
    });
    // Se ainda assim não tiver, usa fallback válido para emissão
    cnpjCpf = "00000000000191";
  }

  const tipoPessoa = cnpjCpf.length === 14 ? "JURIDICA" : "FISICA";
  const hoje = new Date();
  const vencimento = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 dias de validade
  const vencimentoIso = vencimento.toISOString().split("T")[0];

  const telNumeros = (empresaPagadora.telefone || "").replace(/\D/g, "");
  let ddd = undefined;
  let telefone = undefined;
  if (telNumeros.length >= 10) {
    ddd = telNumeros.substring(0, 2);
    telefone = telNumeros.substring(2, 11);
  }

  const seuNumero = `S${Date.now().toString().slice(-14)}`;

  const payloadInter: any = {
    seuNumero,
    valorNominal: valor,
    dataVencimento: vencimentoIso,
    numDiasAgendaRecebimento: 30,
    pagador: {
      cpfCnpj: cnpjCpf,
      tipoPessoa,
      nome: (empresaPagadora.razaoSocial || empresaPagadora.nomeFantasia || "Assinante IMOB").substring(0, 100),
      endereco: (empresaPagadora.endereco || "Av Principal").substring(0, 100),
      bairro: empresaPagadora.bairro || "Centro",
      cidade: empresaPagadora.cidade || "Recife",
      uf: empresaPagadora.estado || "PE",
      cep: (empresaPagadora.cep || "50000000").replace(/\D/g, "").padStart(8, "0").substring(0, 8),
      email: empresaPagadora.email || undefined,
      ddd,
      telefone,
    },
    mensagem: {
      linha1: `Assinatura IMOB - Plano ${targetPlan.name} (${ciclo})`,
      linha2: `Liberacao automatica instantanea apos pagamento Pix`,
    },
  };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const endpointCobranca = `${baseUrl}/cobranca/v3/cobrancas`;
  const res = await makeInterRequest({
    url: endpointCobranca,
    method: "POST",
    headers,
    body: payloadInter,
    agent,
  });

  if (res.status !== 200 && res.status !== 201 && res.status !== 202) {
    const errorMsg =
      res.data?.error_description ||
      res.data?.message ||
      res.data?.error ||
      JSON.stringify(res.data);
    throw new Error(`Erro ao gerar Bolepix no Banco Inter (${res.status}): ${errorMsg}`);
  }

  const codigoSolicitacao = res.data?.codigoSolicitacao;
  if (!codigoSolicitacao) {
    throw new Error("O Banco Inter não retornou o código de solicitação da cobrança.");
  }

  // 5. Consulta os detalhes da cobrança para obter o Pix Copia e Cola e Linha Digitável
  let pixCopiaECola = res.data?.pixCopiaECola;
  let linhaDigitavel = res.data?.linhaDigitavel;
  let codigoBarras = res.data?.codigoBarras;
  let nossoNumero = res.data?.nossoNumero;

  if (!pixCopiaECola) {
    try {
      const endpointDetalhe = `${baseUrl}/cobranca/v3/cobrancas/${codigoSolicitacao}`;
      const resDetalhe = await makeInterRequest({
        url: endpointDetalhe,
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        agent,
      });

      if (resDetalhe.status === 200 && resDetalhe.data) {
        pixCopiaECola = resDetalhe.data.pixCopiaECola || resDetalhe.data.cobranca?.pixCopiaECola;
        linhaDigitavel = resDetalhe.data.linhaDigitavel || resDetalhe.data.boleto?.linhaDigitavel;
        codigoBarras = resDetalhe.data.codigoBarras || resDetalhe.data.boleto?.codigoBarras;
        nossoNumero = resDetalhe.data.nossoNumero || resDetalhe.data.boleto?.nossoNumero;
      }
    } catch (e) {
      console.warn("Aviso ao buscar detalhes do Pix no Inter:", e);
    }
  }

  const qrCodeBase64 = pixCopiaECola ? await generatePixQRCode(pixCopiaECola) : "";

  // 6. Grava no banco de dados na tabela CobrancaAssinaturaSaaS
  const cobranca = await prisma.cobrancaAssinaturaSaaS.create({
    data: {
      empresaId,
      plano: targetPlan.slug,
      ciclo,
      valor,
      status: "PENDENTE",
      bancoInterCodigoSolicitacao: codigoSolicitacao,
      bancoInterNossoNumero: nossoNumero,
      bancoInterLinhaDigitavel: linhaDigitavel,
      bancoInterCodigoBarras: codigoBarras,
      bancoInterPixCopiaECola: pixCopiaECola,
      bancoInterPixQrCode: qrCodeBase64,
      bancoInterStatus: "EMABERTO",
      dataVencimento: vencimento,
    },
  });

  return {
    cobrancaId: cobranca.id,
    codigoSolicitacao,
    pixCopiaECola,
    qrCodeBase64,
    linhaDigitavel,
    valor,
    plano: targetPlan,
    ciclo,
  };
}
