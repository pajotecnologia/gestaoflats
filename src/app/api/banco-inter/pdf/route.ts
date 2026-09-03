import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { baixarPdfBoletoInter } from "@/lib/bancoInter";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const codigoSolicitacao = searchParams.get("codigoSolicitacao");
  const contaId = searchParams.get("contaId");

  if (!codigoSolicitacao && !contaId) {
    return NextResponse.json({ error: "codigoSolicitacao ou contaId é obrigatório." }, { status: 400 });
  }

  // Tenta autenticar ou buscar pela contaId
  let empresaId: string | null = null;
  let codSol: string = codigoSolicitacao || "";

  if (contaId) {
    const conta = await prisma.contaReceber.findUnique({
      where: { id: contaId },
    });
    if (conta) {
      empresaId = conta.empresaId;
      codSol = conta.bancoInterCodigoSolicitacao || codSol;
    }
  }

  if (!empresaId) {
    const session = await getAuthSessionOrFallback();
    if (session) {
      empresaId = session.empresaId;
    }
  }

  if (!empresaId || !codSol) {
    return NextResponse.json({ error: "Não autorizado ou cobrança não encontrada." }, { status: 401 });
  }

  try {
    const pdfBase64 = await baixarPdfBoletoInter(codSol, empresaId);

    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="boleto_${codSol}.pdf"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao obter PDF do boleto." }, { status: 500 });
  }
}
