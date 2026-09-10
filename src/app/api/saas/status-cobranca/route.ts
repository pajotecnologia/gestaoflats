import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarStatusAcesso } from "@/lib/saasConfig";
import { consultarEBaixarCobrancaSaaS } from "@/lib/bancoInterSaaS";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cobrancaId = searchParams.get("cobrancaId");
    const empresaId = searchParams.get("empresaId");

    if (!empresaId && !cobrancaId) {
      return NextResponse.json({ error: "Parâmetros insuficientes." }, { status: 400 });
    }

    let cobranca = null;
    if (cobrancaId) {
      cobranca = await prisma.cobrancaAssinaturaSaaS.findUnique({
        where: { id: cobrancaId },
      });
    } else if (empresaId) {
      cobranca = await prisma.cobrancaAssinaturaSaaS.findFirst({
        where: { empresaId },
        orderBy: { createdAt: "desc" },
      });
    }

    // Se ainda estiver PENDENTE e tiver código de solicitação no Inter, consulta ativamente a API do Inter
    if (cobranca && cobranca.status !== "PAGO" && cobranca.bancoInterCodigoSolicitacao) {
      const foiBaixado = await consultarEBaixarCobrancaSaaS(cobranca.id).catch(() => false);
      if (foiBaixado) {
        cobranca = await prisma.cobrancaAssinaturaSaaS.findUnique({
          where: { id: cobranca.id },
        });
      }
    }

    const targetEmpresaId = cobranca?.empresaId || empresaId;
    let statusAcesso = null;
    if (targetEmpresaId) {
      statusAcesso = await verificarStatusAcesso(targetEmpresaId);
    }

    const isPago = cobranca?.status === "PAGO";

    return NextResponse.json({
      success: true,
      pago: isPago,
      statusCobranca: cobranca?.status || "PENDENTE",
      statusAcesso,
      cobranca,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
