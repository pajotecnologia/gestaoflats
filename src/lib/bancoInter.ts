import https from "https";
import querystring from "querystring";
import { prisma } from "@/lib/prisma";

export interface BancoInterConfig {
  clientId: string;
  clientSecret: string;
  certCrt: string; // Conteúdo PEM do certificado .crt ou Base64
  certKey: string; // Conteúdo PEM da chave privada .key ou Base64
  contaCorrente?: string;
  ambiente: "PRODUCAO" | "SANDBOX";
  chavePix?: string;
  ativo?: boolean;
  webhookUrl?: string;
}

interface TokenCacheItem {
  accessToken: string;
  expiresAt: number; // Timestamp em milissegundos
}

const tokenCache = new Map<string, TokenCacheItem>();

/**
 * Retorna as URLs base de acordo com o ambiente selecionado
 */
export function getInterBaseUrl(ambiente: "PRODUCAO" | "SANDBOX" = "PRODUCAO"): string {
  if (ambiente === "SANDBOX") {
    return "https://cdpj-sandbox.partners.uatinter.co";
  }
  return "https://cdpj.partners.bancointer.com.br";
}

/**
 * Higieniza certificados e chaves privadas garantindo formato PEM válido
 */
export function sanitizePem(pemOrBase64: string): string {
  if (!pemOrBase64) return "";
  let clean = pemOrBase64.trim();
  
  // Se for Base64 puro sem headers PEM, tenta decodificar
  if (!clean.includes("-----BEGIN") && /^[A-Za-z0-9+/=\s]+$/.test(clean)) {
    try {
      const decoded = Buffer.from(clean, "base64").toString("utf-8");
      if (decoded.includes("-----BEGIN")) {
        return decoded;
      }
    } catch {
      // Ignora erro e usa o original
    }
  }
  return clean;
}

/**
 * Cria o agente HTTPS com suporte a Mutual TLS (mTLS) do Banco Inter
 */
export function createInterHttpsAgent(certCrt: string, certKey: string): https.Agent {
  const cert = sanitizePem(certCrt);
  const key = sanitizePem(certKey);

  if (!cert || !key) {
    throw new Error("Certificado (.crt) e Chave Privada (.key) do Banco Inter são obrigatórios.");
  }

  return new https.Agent({
    cert,
    key,
    rejectUnauthorized: true,
    keepAlive: true,
  });
}

/**
 * Executa requisição HTTP nativa com mTLS
 */
export async function makeInterRequest<T = any>({
  url,
  method,
  headers = {},
  body,
  agent,
  isBinary = false,
}: {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  agent: https.Agent;
  isBinary?: boolean;
}): Promise<{ status: number; data: T }> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      let payloadData: string | Buffer | undefined = undefined;

      const requestHeaders: Record<string, string> = {
        ...headers,
      };

      if (body) {
        if (typeof body === "string" || Buffer.isBuffer(body)) {
          payloadData = body;
        } else if (headers["Content-Type"] === "application/x-www-form-urlencoded") {
          payloadData = querystring.stringify(body);
        } else {
          payloadData = JSON.stringify(body);
          if (!requestHeaders["Content-Type"]) {
            requestHeaders["Content-Type"] = "application/json";
          }
        }
        requestHeaders["Content-Length"] = Buffer.byteLength(payloadData).toString();
      }

      const options: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method,
        headers: requestHeaders,
        agent,
        timeout: 30000,
      };

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];

        res.on("data", (chunk) => {
          chunks.push(Buffer.from(chunk));
        });

        res.on("end", () => {
          const bufferResult = Buffer.concat(chunks);
          const status = res.statusCode || 500;

          if (isBinary) {
            return resolve({
              status,
              data: bufferResult as unknown as T,
            });
          }

          const responseText = bufferResult.toString("utf-8");
          try {
            const json = responseText ? JSON.parse(responseText) : {};
            resolve({ status, data: json });
          } catch {
            resolve({ status, data: responseText as unknown as T });
          }
        });
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Tempo limite de conexão esgotado ao contatar o Banco Inter (30s)."));
      });

      req.on("error", (err) => {
        reject(new Error(`Falha na conexão mTLS com o Banco Inter: ${err.message}`));
      });

      if (payloadData) {
        req.write(payloadData);
      }
      req.end();
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Busca as credenciais configuradas para uma empresa
 */
export async function getEmpresaInterConfig(empresaId: string): Promise<BancoInterConfig> {
  const config = await prisma.configuracaoParametros.findUnique({
    where: { empresaId },
  });

  if (!config) {
    throw new Error("Parâmetros do sistema não encontrados para esta empresa.");
  }

  return {
    clientId: config.bancoInterClientId || "",
    clientSecret: config.bancoInterClientSecret || "",
    certCrt: config.bancoInterCertCrt || "",
    certKey: config.bancoInterCertKey || "",
    contaCorrente: config.bancoInterContaCorrente || undefined,
    ambiente: (config.bancoInterAmbiente as "PRODUCAO" | "SANDBOX") || "PRODUCAO",
    chavePix: config.bancoInterChavePix || undefined,
    ativo: Boolean(config.bancoInterAtivo),
    webhookUrl: config.bancoInterWebhookUrl || undefined,
  };
}

/**
 * Obtém ou renova o Token de Acesso OAuth 2.0 do Banco Inter via mTLS
 */
export async function getInterOAuthToken(config: BancoInterConfig, empresaId: string = "default"): Promise<string> {
  const cacheKey = `${empresaId}-${config.ambiente}-${config.clientId}`;
  const cached = tokenCache.get(cacheKey);

  // Reutiliza o token se ainda tiver pelo menos 60 segundos de validade
  if (cached && cached.expiresAt > Date.now() + 60000) {
    return cached.accessToken;
  }

  if (!config.clientId || !config.clientSecret) {
    throw new Error("Client ID e Client Secret do Banco Inter não estão configurados.");
  }
  if (!config.certCrt || !config.certKey) {
    throw new Error("Certificado (.crt) e Chave Privada (.key) do Banco Inter não estão configurados.");
  }

  const baseUrl = getInterBaseUrl(config.ambiente);
  const tokenUrl = `${baseUrl}/oauth/v2/token`;
  const agent = createInterHttpsAgent(config.certCrt, config.certKey);

  const formBody = {
    client_id: config.clientId.trim(),
    client_secret: config.clientSecret.trim(),
    grant_type: "client_credentials",
    scope: "boleto-cobranca.read boleto-cobranca.write",
  };

  const res = await makeInterRequest({
    url: tokenUrl,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody,
    agent,
  });

  if (res.status !== 200 || !res.data?.access_token) {
    const errorDetails = res.data?.error_description || res.data?.message || res.data?.error || JSON.stringify(res.data);
    throw new Error(`Erro de autenticação OAuth 2.0 no Banco Inter (${res.status}): ${errorDetails}`);
  }

  const expiresIn = Number(res.data.expires_in || 3600);
  tokenCache.set(cacheKey, {
    accessToken: res.data.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  });

  return res.data.access_token;
}

/**
 * Testa a conexão mTLS e validação de credenciais com o Banco Inter
 */
export async function testarConexaoBancoInter(config: BancoInterConfig): Promise<{ success: boolean; message: string }> {
  try {
    const token = await getInterOAuthToken(config, "test-connection");
    if (token) {
      return {
        success: true,
        message: `Conexão mTLS e Autenticação OAuth 2.0 estabelecidas com sucesso no ambiente [${config.ambiente}]!`,
      };
    }
    return { success: false, message: "Não foi possível obter o token de acesso do Banco Inter." };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Erro desconhecido ao testar conexão com Banco Inter.",
    };
  }
}

/**
 * Emite uma cobrança Boleto com Pix (Bolepix) no Banco Inter para uma parcela
 */
export async function emitirBolepixInter(contaReceberId: string, empresaId: string) {
  const config = await getEmpresaInterConfig(empresaId);
  if (!config.ativo && config.ambiente !== "SANDBOX") {
    throw new Error("A integração com o Banco Inter está desativada nos Parâmetros.");
  }

  const conta = await prisma.contaReceber.findUnique({
    where: { id: contaReceberId, empresaId },
    include: {
      locatario: true,
      contrato: {
        include: {
          flat: {
            include: { local: true },
          },
        },
      },
    },
  });

  if (!conta) {
    throw new Error("Lançamento a receber não encontrado.");
  }

  if (!conta.locatario) {
    throw new Error("Locatário vinculado não encontrado.");
  }

  const loc = conta.locatario;
  const cpfCnpjLimpo = (loc.cpf || "").replace(/\D/g, "");
  if (!cpfCnpjLimpo || (cpfCnpjLimpo.length !== 11 && cpfCnpjLimpo.length !== 14)) {
    throw new Error(`CPF/CNPJ do locatário (${loc.cpf}) é inválido para emissão de boleto bancário.`);
  }

  const tipoPessoa = cpfCnpjLimpo.length === 14 ? "JURIDICA" : "FISICA";
  const vencimentoIso = new Date(conta.dataVencimento).toISOString().split("T")[0];
  const valorNominal = Number(conta.valor.toFixed(2));

  // Endereço do pagador
  const enderecoLimpo = (loc.endereco || "Rua Principal").substring(0, 100);
  const cepLimpo = "50000000"; // CEP padrão se não informado
  const cidadeLimpa = "Recife";
  const ufLimpa = "PE";

  const token = await getInterOAuthToken(config, empresaId);
  const agent = createInterHttpsAgent(config.certCrt, config.certKey);
  const baseUrl = getInterBaseUrl(config.ambiente);

  // Identificador único no sistema
  const seuNumero = `LOC_${conta.id.replace(/-/g, "").substring(0, 15)}`;

  // Payload padrão da API Cobrança v3 do Banco Inter (Boleto com Pix)
  const payloadInter: any = {
    seuNumero,
    valorNominal,
    dataVencimento: vencimentoIso,
    numDiasAgendaRecebimento: 60,
    pagador: {
      cpfCnpj: cpfCnpjLimpo,
      tipoPessoa,
      nome: loc.nome.substring(0, 100),
      endereco: enderecoLimpo,
      bairro: "Centro",
      cidade: cidadeLimpa,
      uf: ufLimpa,
      cep: cepLimpo,
      email: loc.email || undefined,
      telefone: loc.telefone ? loc.telefone.replace(/\D/g, "") : undefined,
    },
    mensagem: {
      linha1: `Aluguel Ref: ${conta.mesReferencia}`,
      linha2: conta.contrato?.flat?.numero ? `Imovel: Flat ${conta.contrato.flat.numero}` : "Locacao de Imovel",
    },
  };

  // Se houver regras de multa e juros do contrato
  if (conta.contrato?.multaAtrasoPercentual && conta.contrato.multaAtrasoPercentual > 0) {
    payloadInter.multa = {
      codigoMulta: "PERCENTUAL",
      taxa: conta.contrato.multaAtrasoPercentual,
    };
  }

  if (conta.contrato?.jurosAtrasoPercentual && conta.contrato.jurosAtrasoPercentual > 0) {
    payloadInter.mora = {
      codigoMora: "TAXAMENSAL",
      taxa: conta.contrato.jurosAtrasoPercentual,
    };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  if (config.contaCorrente) {
    headers["x-conta-corrente"] = config.contaCorrente.trim();
  }

  const endpointCobranca = `${baseUrl}/cobranca/v3/cobrancas`;
  const res = await makeInterRequest({
    url: endpointCobranca,
    method: "POST",
    headers,
    body: payloadInter,
    agent,
  });

  if (res.status !== 200 && res.status !== 201) {
    const errMsg = res.data?.detail || res.data?.message || res.data?.title || JSON.stringify(res.data);
    
    // Grava mensagem de erro no registro para auditoria
    await prisma.contaReceber.update({
      where: { id: conta.id },
      data: {
        bancoInterMensagemErro: `Falha na emissão (${res.status}): ${errMsg}`,
      },
    });

    throw new Error(`Erro ao emitir cobrança no Banco Inter (${res.status}): ${errMsg}`);
  }

  const codigoSolicitacao = res.data.codigoSolicitacao || res.data.nossoNumero;
  if (!codigoSolicitacao) {
    throw new Error("Banco Inter não retornou o código de solicitação da cobrança.");
  }

  // Agora consulta os dados completos da cobrança gerada para extrair linha digitável, pix e detalhes
  let linhaDigitavel = res.data.linhaDigitavel || "";
  let codigoBarras = res.data.codigoBarras || "";
  let pixCopiaECola = res.data.pixCopiaECola || "";
  let nossoNumero = res.data.nossoNumero || "";

  try {
    const detalheRes = await consultarBolepixInter(codigoSolicitacao, empresaId);
    if (detalheRes) {
      linhaDigitavel = detalheRes.linhaDigitavel || linhaDigitavel;
      codigoBarras = detalheRes.codigoBarras || codigoBarras;
      pixCopiaECola = detalheRes.pixCopiaECola || pixCopiaECola;
      nossoNumero = detalheRes.nossoNumero || nossoNumero;
    }
  } catch {
    // Prossegue com os dados recebidos da emissão
  }

  // Atualiza a ContaReceber com os dados da cobrança do Banco Inter
  const contaAtualizada = await prisma.contaReceber.update({
    where: { id: conta.id },
    data: {
      bancoInterCodigoSolicitacao: codigoSolicitacao,
      bancoInterNossoNumero: nossoNumero || null,
      bancoInterLinhaDigitavel: linhaDigitavel || null,
      bancoInterCodigoBarras: codigoBarras || null,
      bancoInterPixCopiaECola: pixCopiaECola || null,
      bancoInterStatus: "EMABERTO",
      bancoInterDataEmissao: new Date(),
      bancoInterMensagemErro: null,
      formaPagamento: "BOLETO",
    },
    include: {
      locatario: true,
      contrato: {
        include: { flat: true },
      },
    },
  });

  return contaAtualizada;
}

/**
 * Consulta a situação e dados detalhados de uma cobrança no Banco Inter
 */
export async function consultarBolepixInter(codigoSolicitacao: string, empresaId: string) {
  const config = await getEmpresaInterConfig(empresaId);
  const token = await getInterOAuthToken(config, empresaId);
  const agent = createInterHttpsAgent(config.certCrt, config.certKey);
  const baseUrl = getInterBaseUrl(config.ambiente);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (config.contaCorrente) {
    headers["x-conta-corrente"] = config.contaCorrente.trim();
  }

  const endpoint = `${baseUrl}/cobranca/v3/cobrancas/${codigoSolicitacao}`;
  const res = await makeInterRequest({
    url: endpoint,
    method: "GET",
    headers,
    agent,
  });

  if (res.status !== 200) {
    throw new Error(`Falha ao consultar cobrança ${codigoSolicitacao} no Inter (${res.status}): ${JSON.stringify(res.data)}`);
  }

  return {
    codigoSolicitacao: res.data.cobranca?.codigoSolicitacao || codigoSolicitacao,
    situacao: res.data.cobranca?.situacao || res.data.situacao,
    dataVencimento: res.data.cobranca?.dataVencimento,
    valorNominal: res.data.cobranca?.valorNominal,
    valorTotalRecebido: res.data.cobranca?.valorTotalRecebido || res.data.cobranca?.valorRecebido,
    dataPagamento: res.data.cobranca?.dataHoraSituacao || res.data.cobranca?.dataPagamento,
    linhaDigitavel: res.data.boleto?.linhaDigitavel || res.data.linhaDigitavel,
    codigoBarras: res.data.boleto?.codigoBarras || res.data.codigoBarras,
    nossoNumero: res.data.boleto?.nossoNumero || res.data.nossoNumero,
    pixCopiaECola: res.data.pix?.pixCopiaECola || res.data.pixCopiaECola,
    raw: res.data,
  };
}

/**
 * Faz o download do PDF oficial do Boleto com Pix gerado pelo Banco Inter
 * Retorna uma string Base64 pura do documento .PDF
 */
export async function baixarPdfBoletoInter(codigoSolicitacao: string, empresaId: string): Promise<string> {
  const config = await getEmpresaInterConfig(empresaId);
  const token = await getInterOAuthToken(config, empresaId);
  const agent = createInterHttpsAgent(config.certCrt, config.certKey);
  const baseUrl = getInterBaseUrl(config.ambiente);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (config.contaCorrente) {
    headers["x-conta-corrente"] = config.contaCorrente.trim();
  }

  const endpoint = `${baseUrl}/cobranca/v3/cobrancas/${codigoSolicitacao}/pdf`;
  const res = await makeInterRequest({
    url: endpoint,
    method: "GET",
    headers,
    agent,
    isBinary: true,
  });

  if (res.status !== 200) {
    throw new Error(`Erro ao baixar PDF do boleto ${codigoSolicitacao} (${res.status})`);
  }

  const buffer = res.data as unknown as Buffer;
  
  // O Inter pode retornar um JSON com a propriedade "pdf" contendo base64, ou o binário puro do PDF
  if (buffer.toString("utf-8").startsWith("{")) {
    try {
      const json = JSON.parse(buffer.toString("utf-8"));
      if (json.pdf) {
        return json.pdf;
      }
    } catch {
      // Segue como binário
    }
  }

  return buffer.toString("base64");
}

/**
 * Cancela/Baixa uma cobrança em aberto no Banco Inter
 */
export async function cancelarBolepixInter(codigoSolicitacao: string, motivo: string = "SUBSTITUICAO", empresaId: string) {
  const config = await getEmpresaInterConfig(empresaId);
  const token = await getInterOAuthToken(config, empresaId);
  const agent = createInterHttpsAgent(config.certCrt, config.certKey);
  const baseUrl = getInterBaseUrl(config.ambiente);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  if (config.contaCorrente) {
    headers["x-conta-corrente"] = config.contaCorrente.trim();
  }

  const endpoint = `${baseUrl}/cobranca/v3/cobrancas/${codigoSolicitacao}/cancelar`;
  const res = await makeInterRequest({
    url: endpoint,
    method: "POST",
    headers,
    body: { motivoCancelamento: motivo || "SUBSTITUICAO" },
    agent,
  });

  if (res.status !== 200 && res.status !== 204) {
    throw new Error(`Erro ao cancelar cobrança no Banco Inter (${res.status}): ${JSON.stringify(res.data)}`);
  }

  // Atualiza no banco local
  await prisma.contaReceber.updateMany({
    where: { bancoInterCodigoSolicitacao: codigoSolicitacao, empresaId },
    data: {
      bancoInterStatus: "CANCELADO",
    },
  });

  return { success: true };
}

/**
 * Configura ou atualiza a URL do Webhook de Cobrança no Banco Inter
 */
export async function configurarWebhookInter(urlWebhook: string, empresaId: string) {
  const config = await getEmpresaInterConfig(empresaId);
  const token = await getInterOAuthToken(config, empresaId);
  const agent = createInterHttpsAgent(config.certCrt, config.certKey);
  const baseUrl = getInterBaseUrl(config.ambiente);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  if (config.contaCorrente) {
    headers["x-conta-corrente"] = config.contaCorrente.trim();
  }

  const endpoint = `${baseUrl}/cobranca/v3/cobrancas/webhook`;
  const res = await makeInterRequest({
    url: endpoint,
    method: "PUT",
    headers,
    body: { webhookUrl: urlWebhook },
    agent,
  });

  if (res.status !== 200 && res.status !== 204) {
    throw new Error(`Erro ao registrar Webhook no Banco Inter (${res.status}): ${JSON.stringify(res.data)}`);
  }

  await prisma.configuracaoParametros.update({
    where: { empresaId },
    data: { bancoInterWebhookUrl: urlWebhook },
  });

  return { success: true, webhookUrl: urlWebhook };
}

/**
 * Consulta a URL do Webhook atualmente cadastrada no Banco Inter
 */
export async function obterWebhookInter(empresaId: string) {
  const config = await getEmpresaInterConfig(empresaId);
  const token = await getInterOAuthToken(config, empresaId);
  const agent = createInterHttpsAgent(config.certCrt, config.certKey);
  const baseUrl = getInterBaseUrl(config.ambiente);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (config.contaCorrente) {
    headers["x-conta-corrente"] = config.contaCorrente.trim();
  }

  const endpoint = `${baseUrl}/cobranca/v3/cobrancas/webhook`;
  const res = await makeInterRequest({
    url: endpoint,
    method: "GET",
    headers,
    agent,
  });

  if (res.status === 200) {
    return res.data;
  }
  return null;
}

/**
 * Processa a notificação recebida via Webhook do Banco Inter e aplica a liquidação automática
 */
export async function processarWebhookNotificacaoInter(payload: any) {
  // O Inter pode enviar um objeto individual ou um array de eventos
  const eventos = Array.isArray(payload) ? payload : [payload];
  const resultados = [];

  for (const item of eventos) {
    const codigoSolicitacao = item.codigoSolicitacao || item.nossoNumero;
    const situacao = item.situacao || item.status;
    const valorRecebido = item.valorTotalRecebido || item.valorRecebido || item.valorNominal;
    const dataHoraSituacao = item.dataHoraSituacao || item.dataPagamento || new Date();

    if (!codigoSolicitacao) continue;

    // Localiza a parcela associada no banco de dados
    const conta = await prisma.contaReceber.findFirst({
      where: {
        OR: [
          { bancoInterCodigoSolicitacao: codigoSolicitacao },
          { bancoInterNossoNumero: codigoSolicitacao },
        ],
      },
    });

    if (!conta) {
      resultados.push({ codigoSolicitacao, status: "NAO_ENCONTRADO" });
      continue;
    }

    if (situacao === "RECEBIDO" || situacao === "PAGO" || situacao === "LIQUIDADO") {
      const valorFinal = valorRecebido ? parseFloat(valorRecebido) : conta.valor;
      const dataPagto = new Date(dataHoraSituacao);

      await prisma.contaReceber.update({
        where: { id: conta.id },
        data: {
          status: "PAGO",
          formaPagamento: "BOLETO",
          valorPago: valorFinal,
          dataPagamento: isNaN(dataPagto.getTime()) ? new Date() : dataPagto,
          bancoInterStatus: "RECEBIDO",
        },
      });

      resultados.push({ codigoSolicitacao, status: "BAIXADO_COM_SUCESSO", contaId: conta.id });
    } else if (situacao === "CANCELADO" || situacao === "EXPIRADO") {
      await prisma.contaReceber.update({
        where: { id: conta.id },
        data: {
          bancoInterStatus: situacao,
        },
      });
      resultados.push({ codigoSolicitacao, status: `STATUS_ATUALIZADO_${situacao}` });
    }
  }

  return resultados;
}
