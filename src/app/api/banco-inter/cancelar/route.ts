import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { cancelarBolepixInter } from "@/lib/bancoInter";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { codigoSolicitacao, motivo } = await request.json();

    if (!codigoSolicitacao) {
      return NextResponse.json({ error: "codigoSolicitacao é obrigatório." }, { status: 400 });
    }

    const resultado = await cancelarBolepixInter(codigoSolicitacao, motivo || "SUBSTITUICAO", session.empresaId);
    return NextResponse.json({
      success: true,
      message: "Cobrança cancelada com sucesso no Banco Inter!",
      resultado,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
