import https from "https";
import querystring from "querystring";
import { prisma } from "@/lib/prisma";
import { formatMesReferencia } from "./validation";

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

  // Remove aspas extras se veio de JSON stringificado
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1);
  }

  // Normaliza quebras de linha escapadas \n ou \r\n
  clean = clean.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  // Se for Base64 puro sem headers PEM, tenta decodificar
  if (!clean.includes("-----BEGIN") && /^[A-Za-z0-9+/=\s]+$/.test(clean)) {
    try {
      const decoded = Buffer.from(clean, "base64").toString("utf-8");
      if (decoded.includes("-----BEGIN")) {
        return decoded.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
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
  let cert = sanitizePem(certCrt);
  let key = sanitizePem(certKey);

  if (!cert || !key) {
    throw new Error("Certificado (.crt) e Chave Privada (.key) do Banco Inter são obrigatórios.");
  }

  // Auto-correção: caso o usuário tenha invertido os arquivos de certificado e chave
  if (cert.includes("PRIVATE KEY") && key.includes("CERTIFICATE")) {
    const temp = cert;
    cert = key;
    key = temp;
  }

  return new https.Agent({
    cert,
    key,
    minVersion: "TLSv1.2",
    maxVersion: "TLSv1.3",
    rejectUnauthorized: true,
    keepAlive: false,
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

      req.on("error", (err: any) => {
        const rawMsg = err?.message || "";
        const code = err?.code || "";
        let msg = rawMsg || code || "Erro desconhecido durante o handshake TLS.";

        if (
          rawMsg.includes("unknown ca") ||
          rawMsg.includes("alert number 48") ||
          rawMsg.includes("certificate unknown") ||
          rawMsg.includes("alert number 46") ||
          code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
        ) {
          msg = "O Banco Inter rejeitou o certificado digital (SSL Alert: Unknown CA / Certificate Unknown). Verifique se o certificado foi gerado para PRODUÇÃO (Internet Banking PJ real) e o Ambiente selecionado nos Parâmetros está marcado como PRODUÇÃO.";
        } else if (
          rawMsg.includes("bad certificate") ||
          rawMsg.includes("alert number 42") ||
          rawMsg.includes("handshake failure") ||
          rawMsg.includes("alert number 40") ||
          code === "ERR_SSL_SSLV3_ALERT_HANDSHAKE_FAILURE"
        ) {
          msg = "Falha no Handshake TLS: o certificado (.crt) e a chave privada (.key) enviados não formam um par criptográfico válido correspondente a esta aplicação ou foram rejeitados pelo Banco Inter. Verifique se os arquivos .crt e .key foram extraídos do mesmo arquivo .zip baixado juntamente com o Client ID gerado no Internet Banking PJ.";
        } else if (rawMsg.includes("decrypt error") || rawMsg.includes("alert number 51")) {
          msg = "Erro ao ler a chave privada (.key). Verifique se o arquivo .key possui senha ou está corrompido.";
        } else if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ETIMEDOUT") {
          msg = `Não foi possível conectar ao servidor do Banco Inter (${code}: ${rawMsg}). Verifique sua conexão ou se a API do Inter está online.`;
        }

        reject(new Error(`Falha na conexão mTLS com o Banco Inter: ${msg}`));
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

export function clearInterTokenCache(empresaId?: string) {
  if (empresaId) {
    for (const key of Array.from(tokenCache.keys())) {
      if (key.startsWith(`${empresaId}-`)) {
        tokenCache.delete(key);
      }
    }
  } else {
    tokenCache.clear();
  }
}

/**
 * Obtém ou renova o Token de Acesso OAuth 2.0 do Banco Inter via mTLS
 */
export async function getInterOAuthToken(config: BancoInterConfig, empresaId: string = "default", forceRenew: boolean = false): Promise<string> {
  const cacheKey = `${empresaId}-${config.ambiente}-${config.clientId}`;
  const cached = tokenCache.get(cacheKey);

  // Reutiliza o token se ainda tiver pelo menos 60 segundos de validade
  if (!forceRenew && cached && cached.expiresAt > Date.now() + 60000) {
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

  const cleanClientId = config.clientId.trim();
  const cleanClientSecret = config.clientSecret.trim();

  // Tentativa primária: com os escopos oficiais da API Cobrança v3 do Banco Inter
  let formBody: Record<string, string> = {
    client_id: cleanClientId,
    client_secret: cleanClientSecret,
    grant_type: "client_credentials",
    scope: "boleto-cobranca.read boleto-cobranca.write",
  };

  let res = await makeInterRequest<{ access_token?: string; expires_in?: number; error?: string; error_description?: string; message?: string }>({
    url: tokenUrl,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody,
    agent,
  });

  // Se o servidor rejeitar o escopo explícito, tenta sem escopo (padrão oob do Inter)
  if (res.status !== 200 && res.status !== 429) {
    const errText = typeof res.data === "string" ? res.data : JSON.stringify(res.data || {});
    if (errText.includes("scope") || errText.includes("invalid_scope") || errText.includes("No registered scope")) {
      formBody = {
        client_id: cleanClientId,
        client_secret: cleanClientSecret,
        grant_type: "client_credentials",
      };
      res = await makeInterRequest({
        url: tokenUrl,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody,
        agent,
      });
    }
  }

  if (res.status === 200 && res.data?.access_token) {
    const expiresIn = Number(res.data.expires_in || 3600);
    tokenCache.set(cacheKey, {
      accessToken: res.data.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    });
    return res.data.access_token;
  }

  const errorDetails = res.data?.error_description || res.data?.message || res.data?.error || JSON.stringify(res.data);

  if (res.status === 429) {
    throw new Error("Limite de requisições por minuto atingido no Banco Inter (HTTP 429 - Too Many Requests). O banco bloqueia temporariamente tentativas muito rápidas. Por favor, aguarde 30 a 60 segundos e clique em Testar Conexão novamente.");
  }

  if (res.status === 401 || errorDetails.includes("client credentials were not valid")) {
    throw new Error("As credenciais de Client ID ou Client Secret foram rejeitadas pelo Banco Inter (401: Client credentials not valid). Verifique se o Client ID e o Client Secret copiados do Internet Banking PJ estão corretos e salvos no formulário.");
  }

  throw new Error(`Erro de autenticação OAuth 2.0 no Banco Inter (${res.status}): ${errorDetails}`);
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
  const hoje = new Date();
  const hojeStr = hoje.toISOString().split("T")[0];
  let vencimentoIso = new Date(conta.dataVencimento).toISOString().split("T")[0];
  if (vencimentoIso < hojeStr) {
    vencimentoIso = hojeStr;
  }
  const valorNominal = Number(conta.valor);
  if (valorNominal < 2.50) {
    throw new Error("O Banco Inter exige um valor mínimo de R$ 2,50 para emitir boletos bancários com Pix (Bolepix). Para testes, crie uma cobrança de R$ 2,50 ou superior.");
  }

  // Endereço do pagador
  const enderecoLimpo = (loc.endereco || "Rua Principal").substring(0, 100);
  const cepLimpo = "55290000"; // CEP padrão se não informado
  const cidadeLimpa = "Garanhuns";
  const ufLimpa = "PE";

  // Formatação de DDD e Telefone conforme especificação do Inter (DDD max 2, telefone max 9)
  const telNumeros = loc.telefone ? loc.telefone.replace(/\D/g, "") : "";
  let ddd = undefined;
  let telefone = undefined;
  if (telNumeros.length >= 10) {
    ddd = telNumeros.substring(0, 2);
    telefone = telNumeros.substring(2, 11);
  } else if (telNumeros.length > 0) {
    telefone = telNumeros.substring(0, 9);
  }

  const token = await getInterOAuthToken(config, empresaId);
  const agent = createInterHttpsAgent(config.certCrt, config.certKey);
  const baseUrl = getInterBaseUrl(config.ambiente);

  // Identificador único no sistema (máximo 15 caracteres permitidos pelo Inter)
  const seuNumero = conta.id.replace(/[^a-zA-Z0-9]/g, "").substring(0, 15);

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
      ddd,
      telefone,
    },
    mensagem: {
      linha1: `Aluguel Ref: ${formatMesReferencia(conta.mesReferencia) || "09/2026"}`,
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

  const endpointCobranca = `${baseUrl}/cobranca/v3/cobrancas`;
  const res = await makeInterRequest<{
    codigoSolicitacao?: string;
    nossoNumero?: string;
    linhaDigitavel?: string;
    codigoBarras?: string;
    pixCopiaECola?: string;
    title?: string;
    detail?: string;
    message?: string;
    violacoes?: Array<{ razao: string; propriedade: string; valor?: string }>;
    [key: string]: any;
  }>({
    url: endpointCobranca,
    method: "POST",
    headers,
    body: payloadInter,
    agent,
  });

  if (res.status !== 200 && res.status !== 201) {
    let errMsg = res.data?.detail || res.data?.message || res.data?.title || JSON.stringify(res.data);
    if (res.data?.violacoes && Array.isArray(res.data.violacoes) && res.data.violacoes.length > 0) {
      errMsg = res.data.violacoes.map((v) => v.razao).join("; ");
    }
    
    // Grava mensagem de erro no registro para auditoria
    await prisma.contaReceber.update({
      where: { id: conta.id },
      data: {
        bancoInterMensagemErro: `Falha na emissão (${res.status}): ${errMsg}`,
      },
    });

    throw new Error(`Erro ao emitir cobrança no Banco Inter (${res.status}): ${errMsg}`);
  }

  const resData: any = res.data || {};
  const codigoSolicitacao = resData.codigoSolicitacao || resData.nossoNumero;
  if (!codigoSolicitacao) {
    throw new Error("Banco Inter não retornou o código de solicitação da cobrança.");
  }

  // Agora consulta os dados completos da cobrança gerada para extrair linha digitável, pix e detalhes
  let linhaDigitavel = resData.linhaDigitavel || "";
  let codigoBarras = resData.codigoBarras || "";
  let pixCopiaECola = resData.pixCopiaECola || "";
  let nossoNumero = resData.nossoNumero || "";

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

    // 1. Localiza se é uma parcela de aluguel (ContaReceber)
    const conta = await prisma.contaReceber.findFirst({
      where: {
        OR: [
          { bancoInterCodigoSolicitacao: codigoSolicitacao },
          { bancoInterNossoNumero: codigoSolicitacao },
        ],
      },
    });

    if (conta) {
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

        resultados.push({ codigoSolicitacao, tipo: "CONTA_RECEBER", status: "BAIXADO_COM_SUCESSO", contaId: conta.id });
      } else if (situacao === "CANCELADO" || situacao === "EXPIRADO") {
        await prisma.contaReceber.update({
          where: { id: conta.id },
          data: {
            bancoInterStatus: situacao,
          },
        });
        resultados.push({ codigoSolicitacao, tipo: "CONTA_RECEBER", status: `STATUS_ATUALIZADO_${situacao}` });
      }
      continue;
    }

    // 2. Localiza se é uma assinatura / renovação de SaaS (CobrancaAssinaturaSaaS)
    const cobrancaSaaS = await prisma.cobrancaAssinaturaSaaS.findFirst({
      where: {
        OR: [
          { bancoInterCodigoSolicitacao: codigoSolicitacao },
          { bancoInterNossoNumero: codigoSolicitacao },
        ],
      },
    });

    if (cobrancaSaaS) {
      if (situacao === "RECEBIDO" || situacao === "PAGO" || situacao === "LIQUIDADO") {
        const valorFinal = valorRecebido ? parseFloat(valorRecebido) : cobrancaSaaS.valor;
        const dataPagto = new Date(dataHoraSituacao);

        // Atualiza a cobrança SaaS para PAGO
        await prisma.cobrancaAssinaturaSaaS.update({
          where: { id: cobrancaSaaS.id },
          data: {
            status: "PAGO",
            valorPago: valorFinal,
            dataPagamento: isNaN(dataPagto.getTime()) ? new Date() : dataPagto,
            bancoInterStatus: "RECEBIDO",
          },
        });

        // Atualiza a empresa e calcula a nova data de expiração
        const empresa = await prisma.empresa.findUnique({
          where: { id: cobrancaSaaS.empresaId },
        });

        if (empresa) {
          const agora = new Date();
          let baseDate = agora;

          // Se a empresa já tinha acesso ativo no futuro, estende a partir da data futura
          if (empresa.dataFimAcesso && empresa.dataFimAcesso.getTime() > agora.getTime()) {
            baseDate = new Date(empresa.dataFimAcesso.getTime());
          }

          const diasAdicionar = cobrancaSaaS.ciclo === "ANUAL" ? 365 : 30;
          const novaDataFimAcesso = new Date(baseDate.getTime() + diasAdicionar * 24 * 60 * 60 * 1000);

          await prisma.empresa.update({
            where: { id: empresa.id },
            data: {
              statusAssinatura: "ATIVO",
              planoAtual: cobrancaSaaS.plano,
              dataFimAcesso: novaDataFimAcesso,
            },
          });

          // Envia notificação amigável via WhatsApp (se configurado)
          try {
            const { sendWhatsAppMessage } = await import("@/lib/evolutionApi");
            const evolutionConfig = await prisma.configuracaoParametros.findFirst({
              where: {
                evolutionApiUrl: { not: null },
                evolutionApiKey: { not: null },
                evolutionInstance: { not: null },
              },
            });

            if (evolutionConfig && empresa.telefone) {
              const dataFimFormatada = novaDataFimAcesso.toLocaleDateString("pt-BR");
              const msgWhatsApp = `🎉 *Pagamento Confirmado!*\n\nOlá, informamos que o pagamento da assinatura do *IMOB - Plano ${cobrancaSaaS.plano} (${cobrancaSaaS.ciclo})* foi processado com sucesso pelo Banco Inter.\n\n✅ *Acesso Liberado até:* ${dataFimFormatada}\n\nObrigado pela parceria! 🚀`;
              await sendWhatsAppMessage(evolutionConfig, empresa.telefone, msgWhatsApp);
            }
          } catch (whatsErr) {
            console.warn("Aviso: Falha ao enviar WhatsApp de confirmação de renovação:", whatsErr);
          }
        }

        resultados.push({
          codigoSolicitacao,
          tipo: "ASSINATURA_SAAS",
          status: "LIBERADO_COM_SUCESSO",
          empresaId: cobrancaSaaS.empresaId,
        });
      } else if (situacao === "CANCELADO" || situacao === "EXPIRADO") {
        await prisma.cobrancaAssinaturaSaaS.update({
          where: { id: cobrancaSaaS.id },
          data: {
            bancoInterStatus: situacao,
            status: situacao === "EXPIRADO" ? "EXPIRADO" : "CANCELADO",
          },
        });
        resultados.push({ codigoSolicitacao, tipo: "ASSINATURA_SAAS", status: `STATUS_ATUALIZADO_${situacao}` });
      }
      continue;
    }

    resultados.push({ codigoSolicitacao, status: "NAO_ENCONTRADO" });
  }

  return resultados;
}

