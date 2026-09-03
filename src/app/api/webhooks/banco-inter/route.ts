import { NextRequest, NextResponse } from "next/server";
import { processarWebhookNotificacaoInter } from "@/lib/bancoInter";

/**
 * Endpoint público para recepção de Webhooks do Banco Inter (Boleto com Pix)
 * Rota: POST /api/webhooks/banco-inter
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null);

    if (!payload) {
      return NextResponse.json({ message: "Payload vazio recebido." }, { status: 200 });
    }

    console.log("🔔 [Webhook Banco Inter] Notificação recebida:", JSON.stringify(payload));

    const resultados = await processarWebhookNotificacaoInter(payload);

    return NextResponse.json({
      success: true,
      message: "Notificação processada com sucesso!",
      resultados,
    });
  } catch (error: any) {
    console.error("❌ [Webhook Banco Inter] Erro ao processar notificação:", error);
    // Retorna 200 para evitar retentativas infinitas do webhook em caso de payload não reconhecido
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}

/**
 * Responde a requisições GET ou HEAD de verificação de integridade de Webhook
 */
export async function GET() {
  return NextResponse.json({
    status: "online",
    servico: "Webhook Banco Inter - Gestão de Flats / Sistema de Locações",
    timestamp: new Date().toISOString(),
  });
}
