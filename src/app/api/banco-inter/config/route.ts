import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEmpresaInterConfig } from "@/lib/bancoInter";

export async function GET() {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const config = await getEmpresaInterConfig(session.empresaId);
    return NextResponse.json({
      config: {
        clientId: config.clientId,
        clientSecret: config.clientSecret || "",
        hasClientSecret: Boolean(config.clientSecret),
        hasCertCrt: Boolean(config.certCrt),
        hasCertKey: Boolean(config.certKey),
        contaCorrente: config.contaCorrente || "",
        ambiente: config.ambiente,
        chavePix: config.chavePix || "",
        ativo: config.ativo,
        webhookUrl: config.webhookUrl || "",
      },
    });
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
    const body = await request.json();
    const {
      clientId,
      clientSecret,
      certCrt,
      certKey,
      contaCorrente,
      ambiente,
      chavePix,
      ativo,
      webhookUrl,
    } = body;

    const updateData: any = {};
    if (clientId !== undefined) updateData.bancoInterClientId = clientId?.trim() || null;
    if (clientSecret && !clientSecret.includes("...")) updateData.bancoInterClientSecret = clientSecret?.trim() || null;
    if (certCrt !== undefined && certCrt !== "") updateData.bancoInterCertCrt = certCrt?.trim() || null;
    if (certKey !== undefined && certKey !== "") updateData.bancoInterCertKey = certKey?.trim() || null;
    if (contaCorrente !== undefined) updateData.bancoInterContaCorrente = contaCorrente?.trim() || null;
    if (ambiente !== undefined) updateData.bancoInterAmbiente = ambiente;
    if (chavePix !== undefined) updateData.bancoInterChavePix = chavePix?.trim() || null;
    if (ativo !== undefined) updateData.bancoInterAtivo = Boolean(ativo);
    if (webhookUrl !== undefined) updateData.bancoInterWebhookUrl = webhookUrl?.trim() || null;

    const saved = await prisma.configuracaoParametros.upsert({
      where: { empresaId: session.empresaId },
      create: {
        empresaId: session.empresaId,
        ...updateData,
      },
      update: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Configurações do Banco Inter salvas com sucesso!",
      config: {
        clientId: saved.bancoInterClientId,
        hasCertCrt: Boolean(saved.bancoInterCertCrt),
        hasCertKey: Boolean(saved.bancoInterCertKey),
        contaCorrente: saved.bancoInterContaCorrente,
        ambiente: saved.bancoInterAmbiente,
        chavePix: saved.bancoInterChavePix,
        ativo: saved.bancoInterAtivo,
        webhookUrl: saved.bancoInterWebhookUrl,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
