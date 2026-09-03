import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { emitirBolepixInter } from "@/lib/bancoInter";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { contaId } = await request.json();

    if (!contaId) {
      return NextResponse.json({ error: "ID da conta a receber é obrigatório." }, { status: 400 });
    }

    const contaAtualizada = await emitirBolepixInter(contaId, session.empresaId);

    return NextResponse.json({
      success: true,
      message: "Boleto com Pix emitido com sucesso no Banco Inter!",
      conta: contaAtualizada,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao emitir cobrança no Banco Inter." }, { status: 500 });
  }
}
