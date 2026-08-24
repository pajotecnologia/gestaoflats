import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const config = await prisma.configuracaoParametros.findUnique({
    where: { empresaId: session.empresaId },
  });

  return NextResponse.json({
    config: config || {
      evolutionApiUrl: "",
      evolutionApiKey: "",
      evolutionInstance: "",
      statusConexao: "DESCONECTADO",
      smtpHost: "smtp.gmail.com",
      smtpPort: 465,
      smtpUser: "",
      smtpPass: "",
      smtpSecure: true,
      smtpFromEmail: "",
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const {
      evolutionApiUrl,
      evolutionApiKey,
      evolutionInstance,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpSecure,
      smtpFromEmail,
    } = await request.json();

    const config = await prisma.configuracaoParametros.upsert({
      where: { empresaId: session.empresaId },
      update: {
        evolutionApiUrl: evolutionApiUrl?.trim() || null,
        evolutionApiKey: evolutionApiKey?.trim() || null,
        evolutionInstance: evolutionInstance?.trim() || null,
        smtpHost: smtpHost?.trim() || "smtp.gmail.com",
        smtpPort: Number(smtpPort) || 465,
        smtpUser: smtpUser?.trim() || null,
        smtpPass: smtpPass?.trim() || null,
        smtpSecure: smtpSecure !== undefined ? Boolean(smtpSecure) : true,
        smtpFromEmail: smtpFromEmail?.trim() || null,
      },
      create: {
        empresaId: session.empresaId,
        evolutionApiUrl: evolutionApiUrl?.trim() || null,
        evolutionApiKey: evolutionApiKey?.trim() || null,
        evolutionInstance: evolutionInstance?.trim() || null,
        statusConexao: "DESCONECTADO",
        smtpHost: smtpHost?.trim() || "smtp.gmail.com",
        smtpPort: Number(smtpPort) || 465,
        smtpUser: smtpUser?.trim() || null,
        smtpPass: smtpPass?.trim() || null,
        smtpSecure: smtpSecure !== undefined ? Boolean(smtpSecure) : true,
        smtpFromEmail: smtpFromEmail?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao salvar parâmetros." }, { status: 500 });
  }
}
