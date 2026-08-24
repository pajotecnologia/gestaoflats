import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/evolutionApi";

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { contaId, dataPagamento, formaPagamento, valorPago, enviarWhatsApp } = await request.json();

    if (!contaId || !dataPagamento || !formaPagamento || valorPago === undefined) {
      return NextResponse.json(
        { error: "ID da conta, Data de Pagamento, Forma e Valor Pago são obrigatórios." },
        { status: 400 }
      );
    }

    const conta = await prisma.contaReceber.findFirst({
      where: { id: contaId, empresaId: session.empresaId },
      include: {
        locatario: true,
        contrato: { include: { flat: true } },
        empresa: { include: { configuracaoParametros: true } },
      },
    });

    if (!conta) {
      return NextResponse.json({ error: "Conta a receber não encontrada." }, { status: 404 });
    }

    const contaAtualizada = await prisma.contaReceber.update({
      where: { id: contaId },
      data: {
        status: "PAGO",
        dataPagamento: new Date(dataPagamento),
        formaPagamento,
        valorPago: parseFloat(valorPago),
      },
    });

    let whatsAppResult = null;
    if (enviarWhatsApp && conta.locatario.telefone) {
      const config = conta.empresa.configuracaoParametros;
      if (config && config.evolutionApiUrl && config.evolutionApiKey && config.evolutionInstance) {
        const msg = `*RECIBO DE PAGAMENTO* - ${conta.empresa.nomeFantasia}\n\nOlá *${conta.locatario.nome}*,\nConfirmamos o recebimento do valor de *R$ ${parseFloat(valorPago).toFixed(2)}* via *${formaPagamento}* referente ao aluguel do *${conta.contrato?.flat.numero || "Flat"}* (Mês: ${conta.mesReferencia}).\n\nObrigado!`;
        
        whatsAppResult = await sendWhatsAppMessage(config, conta.locatario.telefone, msg);
      }
    }

    return NextResponse.json({
      success: true,
      conta: contaAtualizada,
      whatsAppResult,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao dar baixa no pagamento." }, { status: 500 });
  }
}
