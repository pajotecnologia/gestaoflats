import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { consultarBolepixInter } from "@/lib/bancoInter";

export async function GET(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const codigoSolicitacao = searchParams.get("codigoSolicitacao");

    if (!codigoSolicitacao) {
      return NextResponse.json({ error: "codigoSolicitacao é obrigatório." }, { status: 400 });
    }

    const detalhe = await consultarBolepixInter(codigoSolicitacao, session.empresaId);
    return NextResponse.json({ detalhe });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Sincroniza em lote todas as cobranças pendentes da empresa com o Banco Inter
 */
export async function POST() {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const contasPendentes = await prisma.contaReceber.findMany({
      where: {
        empresaId: session.empresaId,
        status: { not: "PAGO" },
        bancoInterCodigoSolicitacao: { not: null },
      },
    });

    let sincronizadas = 0;
    let baixadas = 0;
    const erros: any[] = [];

    for (const conta of contasPendentes) {
      if (!conta.bancoInterCodigoSolicitacao) continue;

      try {
        const detalhe = await consultarBolepixInter(conta.bancoInterCodigoSolicitacao, session.empresaId);
        sincronizadas++;

        if (detalhe.situacao === "RECEBIDO" || detalhe.situacao === "PAGO" || detalhe.situacao === "LIQUIDADO") {
          const valorPago = detalhe.valorTotalRecebido ? parseFloat(detalhe.valorTotalRecebido) : conta.valor;
          const dataPagto = detalhe.dataPagamento ? new Date(detalhe.dataPagamento) : new Date();

          await prisma.contaReceber.update({
            where: { id: conta.id },
            data: {
              status: "PAGO",
              formaPagamento: "BOLETO",
              valorPago,
              dataPagamento: isNaN(dataPagto.getTime()) ? new Date() : dataPagto,
              bancoInterStatus: "RECEBIDO",
              bancoInterLinhaDigitavel: detalhe.linhaDigitavel || conta.bancoInterLinhaDigitavel,
              bancoInterPixCopiaECola: detalhe.pixCopiaECola || conta.bancoInterPixCopiaECola,
            },
          });
          baixadas++;
        } else {
          await prisma.contaReceber.update({
            where: { id: conta.id },
            data: {
              bancoInterStatus: detalhe.situacao || conta.bancoInterStatus,
              bancoInterLinhaDigitavel: detalhe.linhaDigitavel || conta.bancoInterLinhaDigitavel,
              bancoInterPixCopiaECola: detalhe.pixCopiaECola || conta.bancoInterPixCopiaECola,
            },
          });
        }
      } catch (err: any) {
        erros.push({
          contaId: conta.id,
          codigoSolicitacao: conta.bancoInterCodigoSolicitacao,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalVerificadas: contasPendentes.length,
      sincronizadas,
      baixadas,
      erros,
      message: `Sincronização concluída: ${baixadas} recebimento(s) liquidado(s) de ${contasPendentes.length} cobrança(s) verificada(s).`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
