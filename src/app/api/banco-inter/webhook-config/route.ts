import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { configurarWebhookInter, obterWebhookInter } from "@/lib/bancoInter";
import { getAppBaseUrl } from "@/lib/baseUrl";

export async function GET() {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const webhookData = await obterWebhookInter(session.empresaId);
    return NextResponse.json({ webhook: webhookData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    let webhookUrl = body.webhookUrl;

    if (!webhookUrl) {
      const baseUrl = getAppBaseUrl(request);
      webhookUrl = `${baseUrl}/api/webhooks/banco-inter`;
    }

    const resultado = await configurarWebhookInter(webhookUrl, session.empresaId);
    return NextResponse.json({
      success: true,
      message: `Webhook registrado com sucesso no Banco Inter!`,
      webhookUrl: resultado.webhookUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
