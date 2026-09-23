import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSessionOrFallback();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const {
      locatarioId,
      contratoId,
      descricaoAvaria,
      valorAvaria,
      dataVencimento,
      observacao,
    } = await request.json();

    if (!locatarioId) {
      return NextResponse.json(
        { error: "Locatário é obrigatório para lançar a cobrança." },
        { status: 400 }
      );
    }

    const valorNum = parseFloat(String(valorAvaria || 0));
    if (isNaN(valorNum) || valorNum <= 0) {
      return NextResponse.json(
        { error: "O valor da avaria deve ser maior que zero." },
        { status: 400 }
      );
    }

    const agora = new Date();
    const dtVenc = dataVencimento ? new Date(dataVencimento) : new Date(agora.getTime() + 5 * 86400000);
    const mesRef = `${dtVenc.getFullYear()}-${String(dtVenc.getMonth() + 1).padStart(2, "0")}`;

    // Criar conta a receber
    const novaConta = await prisma.contaReceber.create({
      data: {
        empresaId: session.empresaId,
        locatarioId,
        contratoId: contratoId || null,
        mesReferencia: mesRef,
        numeroParcela: 1,
        valor: valorNum,
        dataVencimento: dtVenc,
        status: "PENDENTE",
        formaPagamento: "PIX",
        observacao: `[Cobrança de Avaria / Vistoria de Saída] ${descricaoAvaria || "Ressarcimento de danos ao imóvel"}${
          observacao ? ` - ${observacao}` : ""
        }`,
      },
      include: {
        locatario: true,
      },
    });

    // Registrar evento financeiro
    try {
      await prisma.financeiroEvento.create({
        data: {
          empresaId: session.empresaId,
          contaReceberId: novaConta.id,
          tipo: "LANCAMENTO",
          valor: valorNum,
          descricao: `Lançamento de cobrança por avaria detectada em vistoria: ${descricaoAvaria}`,
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Cobrança de avaria lançada no Contas a Receber com sucesso!",
      conta: novaConta,
    });
  } catch (error: any) {
    console.error("Erro ao lançar cobrança de avaria:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar cobrança de avaria." },
      { status: 500 }
    );
  }
}
