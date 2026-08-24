import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token de assinatura é obrigatório." }, { status: 400 });
  }

  try {
    const contrato = await prisma.contrato.findUnique({
      where: { tokenAssinatura: token },
      include: {
        empresa: true,
        locatario: true,
        flat: {
          include: { local: true },
        },
        modeloContrato: true,
      },
    });

    if (!contrato) {
      return NextResponse.json({ error: "Contrato não encontrado ou link expirado." }, { status: 404 });
    }

    return NextResponse.json({ contrato });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, assinaturaBase64 } = await request.json();

    if (!token || !assinaturaBase64) {
      return NextResponse.json({ error: "Token e assinatura em imagem são obrigatórios." }, { status: 400 });
    }

    const contrato = await prisma.contrato.findUnique({
      where: { tokenAssinatura: token },
    });

    if (!contrato) {
      return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
    }

    const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";

    const updatedContrato = await prisma.contrato.update({
      where: { id: contrato.id },
      data: {
        statusAssinatura: "ASSINADO",
        assinaturaLocatarioUrl: assinaturaBase64,
        dataAssinaturaLocatario: new Date(),
        ipAssinaturaLocatario: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      contrato: updatedContrato,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
