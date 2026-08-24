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
    const state = data.instance?.state || data.state || "unknown";

    if (state === "open" || state === "CONNECTED") {
      return {
        connected: true,
        status: "CONECTADO",
        message: "Instância da Evolution API conectada e operante!",
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
