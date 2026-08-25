import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage, sendWhatsAppDocument } from "@/lib/evolutionApi";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { phone, message, pdfBase64, fileName } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: "Telefone de destino é obrigatório." }, { status: 400 });
    }

    const config = await prisma.configuracaoParametros.findUnique({
      where: { empresaId: session.empresaId },
    });

    if (!config || !config.evolutionApiUrl || !config.evolutionApiKey || !config.evolutionInstance) {
      return NextResponse.json(
        {
          error:
            "Evolution API não está totalmente configurada em Parâmetros. Acesse o menu Parâmetros para conectar o WhatsApp.",
        },
        { status: 400 }
      );
    }

    let result;
    if (pdfBase64) {
      // 1. Envia o documento PDF anexado
      result = await sendWhatsAppDocument(
        config,
        phone,
        pdfBase64,
        fileName || "Documento.pdf",
        `📄 *${fileName || "Documento.pdf"}*`
      );

      if (result.success && message && message.trim()) {
        const urlMatch = message.match(/(https?:\/\/[^\s]+)/i);
        const rawUrl = urlMatch ? urlMatch[0] : null;

        // Limpa o texto explicativo
        const textWithoutUrl = rawUrl
          ? message.replace(rawUrl, "").replace(/👉\s*\*[^*]*\*\s*/g, "").trim()
          : message.trim();

        // 2. Envia a mensagem explicativa
        if (textWithoutUrl) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          await sendWhatsAppMessage(config, phone, textWithoutUrl);
        }

        // 3. Envia o link HTTP totalmente isolado como mensagem final.
        // O aplicativo do WhatsApp no Celular exige que o link esteja totalmente isolado (sem marcação de negrito/emojis na mesma mensagem) para transformar o texto em hyperlink azul clicável!
        if (rawUrl) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          await sendWhatsAppMessage(config, phone, rawUrl);
        }
      }
    } else {
      const urlMatch = message ? message.match(/(https?:\/\/[^\s]+)/i) : null;
      const rawUrl = urlMatch ? urlMatch[0] : null;

      result = await sendWhatsAppMessage(config, phone, message || "");

      if (result.success && rawUrl) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        await sendWhatsAppMessage(config, phone, rawUrl);
      }
    }

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao processar envio de WhatsApp." }, { status: 500 });
  }
}
