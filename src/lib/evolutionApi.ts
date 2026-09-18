/**
 * Helper para Comunicação com a Evolution API (WhatsApp)
 */

export interface EvolutionConfig {
  evolutionApiUrl?: string | null;
  evolutionApiKey?: string | null;
  evolutionInstance?: string | null;
}

export async function checkEvolutionStatus(config: EvolutionConfig): Promise<{
  connected: boolean;
  status: string;
  message: string;
}> {
  const { evolutionApiUrl, evolutionApiKey, evolutionInstance } = config;

  if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstance) {
    return {
      connected: false,
      status: "DESCONECTADO",
      message: "Credenciais da Evolution API não estão totalmente configuradas.",
    };
  }

  try {
    const cleanUrl = evolutionApiUrl.replace(/\/$/, "");
    const response = await fetch(
      `${cleanUrl}/instance/connectionState/${encodeURIComponent(evolutionInstance)}`,
      {
        method: "GET",
        headers: {
          apikey: evolutionApiKey,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return {
        connected: false,
        status: "ERRO",
        message: `Falha na requisição: ${response.statusText} (${response.status})`,
      };
    }

    const data = await response.json();
    const state = (data.instance?.state || data.state || data.status || "unknown").toLowerCase();

    if (state === "open" || state === "connected") {
      return {
        connected: true,
        status: "CONECTADO",
        message: "Instância da Evolution API conectada e operante!",
      };
    }

    if (state === "connecting") {
      return {
        connected: false,
        status: "CONECTANDO",
        message: "Instância conectando ou aguardando autenticação...",
      };
    }

    if (state === "close" || state === "closed" || state === "disconnected") {
      return {
        connected: false,
        status: "DESCONECTADO",
        message: "Instância desconectada. Leia o QR Code para autenticar.",
      };
    }

    return {
      connected: false,
      status: state.toUpperCase(),
      message: `Status da instância: ${state}`,
    };
  } catch (err: any) {
    return {
      connected: false,
      status: "ERRO",
      message: `Erro ao conectar com a Evolution API: ${err.message || err}`,
    };
  }
}

/**
 * Cria uma nova instância no servidor da Evolution API
 */
export async function createEvolutionInstance(config: EvolutionConfig): Promise<{
  success: boolean;
  message: string;
  alreadyExists?: boolean;
  data?: any;
}> {
  const { evolutionApiUrl, evolutionApiKey, evolutionInstance } = config;

  if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstance) {
    return {
      success: false,
      message: "Preencha a URL da Evolution API, API Key Global e o Nome da Instância.",
    };
  }

  try {
    const cleanUrl = evolutionApiUrl.replace(/\/$/, "");
    const response = await fetch(`${cleanUrl}/instance/create`, {
      method: "POST",
      headers: {
        apikey: evolutionApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instanceName: evolutionInstance.trim(),
        token: "",
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    });

    const responseData = await response.json().catch(() => ({}));

    if (response.ok) {
      return {
        success: true,
        message: "Instância criada com sucesso na Evolution API!",
        data: responseData,
      };
    }

    const errMessage = extractEvolutionErrorMessage(responseData, response.statusText);
    const isAlreadyExists =
      errMessage.toLowerCase().includes("already in use") ||
      errMessage.toLowerCase().includes("already exists") ||
      errMessage.toLowerCase().includes("já existe") ||
      response.status === 403 ||
      response.status === 409;

    if (isAlreadyExists) {
      return {
        success: true,
        alreadyExists: true,
        message: `Instância "${evolutionInstance}" já existe no servidor e está pronta para uso.`,
        data: responseData,
      };
    }

    return {
      success: false,
      message: `Falha ao criar instância: ${errMessage}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao conectar com a Evolution API: ${err.message || err}`,
    };
  }
}

/**
 * Obtém o QR Code ou Pairing Code para conexão com o WhatsApp
 */
export async function getEvolutionQRCode(config: EvolutionConfig): Promise<{
  success: boolean;
  base64?: string;
  code?: string;
  pairingCode?: string;
  count?: number;
  message: string;
}> {
  const { evolutionApiUrl, evolutionApiKey, evolutionInstance } = config;

  if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstance) {
    return {
      success: false,
      message: "Credenciais da Evolution API incompletas.",
    };
  }

  try {
    const cleanUrl = evolutionApiUrl.replace(/\/$/, "");
    let response = await fetch(
      `${cleanUrl}/instance/connect/${encodeURIComponent(evolutionInstance.trim())}`,
      {
        method: "GET",
        headers: {
          apikey: evolutionApiKey,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    // Se o endpoint /connect falhar com 404, tenta fallback para /qrcode
    if (!response.ok && response.status === 404) {
      response = await fetch(
        `${cleanUrl}/instance/qrcode/${encodeURIComponent(evolutionInstance.trim())}`,
        {
          method: "GET",
          headers: {
            apikey: evolutionApiKey,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok && !data.base64 && !data.code && !data.qrcode) {
      const detailed = extractEvolutionErrorMessage(data, response.statusText);
      return {
        success: false,
        message: `Não foi possível gerar o QR Code: ${detailed}`,
      };
    }

    let rawBase64 =
      data.base64 ||
      data.qrcode?.base64 ||
      (typeof data.qrcode === "string" && data.qrcode.startsWith("data:") ? data.qrcode : "");
    const code = data.code || data.qrcode?.code;
    const pairingCode = data.pairingCode || data.qrcode?.pairingCode;

    if (rawBase64 && !rawBase64.startsWith("data:")) {
      rawBase64 = `data:image/png;base64,${rawBase64}`;
    }

    if (!rawBase64 && !code && !pairingCode) {
      // Se a instância já estiver conectada
      const state = (data.instance?.state || data.state || "").toLowerCase();
      if (state === "open" || state === "connected") {
        return {
          success: true,
          message: "A instância já está conectada ao WhatsApp!",
        };
      }

      return {
        success: false,
        message: "O servidor Evolution não retornou imagem do QR Code.",
      };
    }

    return {
      success: true,
      base64: rawBase64,
      code,
      pairingCode,
      count: data.count,
      message: "QR Code gerado com sucesso!",
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao buscar QR Code da Evolution API: ${err.message || err}`,
    };
  }
}

/**
 * Desconecta (Logout) a instância da Evolution API
 */
export async function logoutEvolutionInstance(config: EvolutionConfig): Promise<{
  success: boolean;
  message: string;
}> {
  const { evolutionApiUrl, evolutionApiKey, evolutionInstance } = config;

  if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstance) {
    return { success: false, message: "Credenciais da Evolution API incompletas." };
  }

  try {
    const cleanUrl = evolutionApiUrl.replace(/\/$/, "");
    const response = await fetch(
      `${cleanUrl}/instance/logout/${encodeURIComponent(evolutionInstance.trim())}`,
      {
        method: "DELETE",
        headers: {
          apikey: evolutionApiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json().catch(() => ({}));
    if (response.ok || response.status === 200) {
      return { success: true, message: "WhatsApp desconectado com sucesso!" };
    }

    const detailed = extractEvolutionErrorMessage(data, response.statusText);
    return { success: false, message: `Falha ao desconectar: ${detailed}` };
  } catch (err: any) {
    return { success: false, message: `Erro ao desconectar instância: ${err.message || err}` };
  }
}

/**
 * Reinicia a instância na Evolution API
 */
export async function restartEvolutionInstance(config: EvolutionConfig): Promise<{
  success: boolean;
  message: string;
}> {
  const { evolutionApiUrl, evolutionApiKey, evolutionInstance } = config;

  if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstance) {
    return { success: false, message: "Credenciais da Evolution API incompletas." };
  }

  try {
    const cleanUrl = evolutionApiUrl.replace(/\/$/, "");
    let response = await fetch(
      `${cleanUrl}/instance/restart/${encodeURIComponent(evolutionInstance.trim())}`,
      {
        method: "POST",
        headers: {
          apikey: evolutionApiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok && (response.status === 404 || response.status === 405)) {
      response = await fetch(
        `${cleanUrl}/instance/restart/${encodeURIComponent(evolutionInstance.trim())}`,
        {
          method: "PUT",
          headers: {
            apikey: evolutionApiKey,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      return { success: true, message: "Instância reiniciada com sucesso na Evolution API!" };
    }

    const detailed = extractEvolutionErrorMessage(data, response.statusText);
    return { success: false, message: `Falha ao reiniciar: ${detailed}` };
  } catch (err: any) {
    return { success: false, message: `Erro ao reiniciar instância: ${err.message || err}` };
  }
}

function extractEvolutionErrorMessage(errorData: any, statusText: string): string {
  if (!errorData) return statusText || "Bad Request";
  const msg = errorData.message || errorData.response?.message || errorData.error;
  if (Array.isArray(msg)) {
    return msg.join("; ");
  }
  if (typeof msg === "string" && msg.trim()) {
    return msg;
  }
  if (typeof msg === "object") {
    return JSON.stringify(msg);
  }
  return statusText || "Bad Request";
}

export async function sendWhatsAppMessage(
  config: EvolutionConfig,
  phone: string,
  message: string
): Promise<{ success: boolean; message: string }> {
  const { evolutionApiUrl, evolutionApiKey, evolutionInstance } = config;

  if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstance) {
    return { success: false, message: "Parâmetros da Evolution API não configurados." };
  }

  const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
  if (!cleanPhone || cleanPhone.length < 8) {
    return { success: false, message: "Número de telefone/WhatsApp inválido ou não cadastrado." };
  }
  const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

  try {
    const cleanUrl = evolutionApiUrl.replace(/\/$/, "");

    const response = await fetch(
      `${cleanUrl}/message/sendText/${encodeURIComponent(evolutionInstance)}`,
      {
        method: "POST",
        headers: {
          apikey: evolutionApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: formattedPhone,
          text: message,
          options: {
            delay: 1200,
            presence: "composing",
            linkPreview: true,
          },
        }),
      }
    );

    if (response.ok) {
      return { success: true, message: "Mensagem enviada com sucesso via Evolution API!" };
    } else {
      const errorData = await response.json().catch(() => ({}));
      const detailedError = extractEvolutionErrorMessage(errorData, response.statusText);
      return {
        success: false,
        message: `Erro no envio da Evolution API: ${detailedError}`,
      };
    }
  } catch (err: any) {
    return { success: false, message: `Erro ao enviar via WhatsApp: ${err.message || err}` };
  }
}

export async function sendWhatsAppDocument(
  config: EvolutionConfig,
  phone: string,
  base64OrUrl: string,
  fileName: string,
  caption?: string
): Promise<{ success: boolean; message: string }> {
  const { evolutionApiUrl, evolutionApiKey, evolutionInstance } = config;

  if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstance) {
    return { success: false, message: "Parâmetros da Evolution API não estão configurados." };
  }

  const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
  if (!cleanPhone || cleanPhone.length < 8) {
    return { success: false, message: "Número de telefone/WhatsApp inválido ou não cadastrado." };
  }
  const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

  try {
    const cleanUrl = evolutionApiUrl.replace(/\/$/, "");

    // Tratamento e higienização da mídia para a Evolution API:
    // A Evolution API exige que a propriedade 'media' seja uma URL direta (http/https) OU uma string Base64 PURA (sem prefixos como data:application/pdf;base64,).
    let media = "";
    if (typeof base64OrUrl === "string") {
      media = base64OrUrl;
    } else if (base64OrUrl && typeof (base64OrUrl as any).then === "function") {
      const resolved = await base64OrUrl;
      media = typeof resolved === "string" ? resolved : String(resolved || "");
    } else if (base64OrUrl) {
      media = String(base64OrUrl);
    }

    media = media.trim();

    if (!media.startsWith("http://") && !media.startsWith("https://")) {
      if (media.includes("base64,")) {
        media = media.split("base64,")[1];
      }
      media = media.trim().replace(/[\r\n\s]/g, "");
    }

    const response = await fetch(
      `${cleanUrl}/message/sendMedia/${encodeURIComponent(evolutionInstance)}`,
      {
        method: "POST",
        headers: {
          apikey: evolutionApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: formattedPhone,
          mediatype: "document",
          mimetype: "application/pdf",
          media,
          fileName: fileName || "Documento.pdf",
          caption: caption || "",
          options: {
            delay: 1200,
            presence: "composing",
            linkPreview: true,
          },
        }),
      }
    );

    if (response.ok) {
      return { success: true, message: "Documento enviado via WhatsApp com sucesso!" };
    } else {
      const errorData = await response.json().catch(() => ({}));
      const detailedError = extractEvolutionErrorMessage(errorData, response.statusText);

      // Se o envio do documento PDF exceder o limite de tamanho do servidor (HTTP 413 / Request Entity Too Large),
      // envia automaticamente a mensagem de texto com o link de acesso/assinatura para garantir a entrega ao cliente.
      if (
        response.status === 413 ||
        detailedError.toLowerCase().includes("too large") ||
        detailedError.toLowerCase().includes("entity too large") ||
        detailedError.toLowerCase().includes("payload too large")
      ) {
        const textResult = await sendWhatsAppMessage(config, phone, caption || "");
        if (textResult.success) {
          return {
            success: true,
            message: "Link enviado via WhatsApp com sucesso! (Nota: O arquivo PDF excedeu o limite do servidor e o link direto foi entregue no texto)",
          };
        }
      }

      return {
        success: false,
        message: `Erro no envio da Evolution API: ${detailedError}`,
      };
    }
  } catch (err: any) {
    return { success: false, message: `Erro ao conectar à Evolution API: ${err.message || err}` };
  }
}
