import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { contratoId } = await request.json();

    if (!contratoId) {
      return NextResponse.json({ error: "contratoId é obrigatório." }, { status: 400 });
    }

    let contrato = await prisma.contrato.findUnique({
      where: { id: contratoId },
    });

    if (!contrato) {
      return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
    }

    let token = contrato.tokenAssinatura;

    if (!token) {
      token = crypto.randomBytes(16).toString("hex");
      contrato = await prisma.contrato.update({
        where: { id: contratoId },
        data: {
          tokenAssinatura: token,
          statusAssinatura: contrato.statusAssinatura || "PENDENTE",
        },
      });
    }

    return NextResponse.json({
      success: true,
      tokenAssinatura: token,
      statusAssinatura: contrato.statusAssinatura,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
