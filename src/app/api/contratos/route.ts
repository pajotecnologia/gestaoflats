import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const contratos = await prisma.contrato.findMany({
      where: { empresaId: session.empresaId },
      include: {
        locatario: true,
        flat: {
          include: { local: true },
        },
        modeloContrato: true,
        contasReceber: {
          orderBy: { numeroParcela: "asc" },
        },
        vistoriasChecklist: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ contratos });
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
    const {
      locatarioId,
      flatId,
      modeloContratoId,
      dataEmissao,
      tipoValidade = "MESES",
      validadeValor,
      validadeMeses = "12",
      valorMensal,
      fotosAnexadasUrl,
      diaVencimento = 5,
      formaPagamento = "PIX",
      bancoNome,
      bancoDadosConta,
      multaAtrasoPercentual = 2.0,
      jurosAtrasoPercentual = 1.0,
      valorCaucao = 0.0,
      caucaoParcelas = 0,
      multaRescisaoMeses = 3,
    } = await request.json();

    const dtEmissao = new Date(dataEmissao);
    const vlrMensalNum = parseFloat(valorMensal);
    const isDias = tipoValidade === "DIAS";
    const duracaoValor = parseInt(validadeValor || validadeMeses || (isDias ? "30" : "12"), 10);

    const diaVencNum = diaVencimento ? parseInt(String(diaVencimento), 10) : 5;
    const multaNum = multaAtrasoPercentual !== undefined && multaAtrasoPercentual !== null ? parseFloat(String(multaAtrasoPercentual)) : 2.0;
    const jurosNum = jurosAtrasoPercentual !== undefined && jurosAtrasoPercentual !== null ? parseFloat(String(jurosAtrasoPercentual)) : 1.0;
    const caucaoNum = valorCaucao !== undefined && valorCaucao !== null ? parseFloat(String(valorCaucao)) : 0.0;
    const caucaoParcNum = caucaoParcelas ? parseInt(String(caucaoParcelas), 10) : 0;
    const multaRescisaoNum = multaRescisaoMeses ? parseInt(String(multaRescisaoMeses), 10) : 3;

    const mesesInt = isDias ? Math.max(1, Math.ceil(duracaoValor / 30)) : duracaoValor;
    const diasInt: number | null = isDias ? duracaoValor : null;

    const dtFinal = new Date(dtEmissao);
    if (isDias) {
      dtFinal.setDate(dtFinal.getDate() + duracaoValor);
    } else {
      dtFinal.setMonth(dtFinal.getMonth() + duracaoValor);
    }

    const flatObj = await prisma.flat.findFirst({
      where: { id: flatId, empresaId: session.empresaId },
    });

    if (!flatObj) {
      return NextResponse.json({ error: "Flat selecionado não foi encontrado para esta empresa." }, { status: 404 });
    }

    const locatarioObj = await prisma.locatario.findFirst({
      where: { id: locatarioId, empresaId: session.empresaId },
    });

    if (!locatarioObj) {
      return NextResponse.json({ error: "Locatário selecionado não foi encontrado para esta empresa." }, { status: 404 });
    }

    if (modeloContratoId) {
      const modeloObj = await prisma.modeloContrato.findFirst({
        where: { id: modeloContratoId, empresaId: session.empresaId },
      });
      if (!modeloObj) {
        return NextResponse.json({ error: "Modelo de contrato selecionado não foi encontrado para esta empresa." }, { status: 404 });
      }
    }

    if (flatObj.status !== "DISPONIVEL") {
      const statusText = flatObj.status === "OCUPADO" ? "OCUPADO" : "EM MANUTENÇÃO";
      return NextResponse.json(
        { error: `O flat selecionado (${flatObj.numero}) está atualmente como ${statusText} e não pode receber novos contratos.` },
        { status: 400 }
      );
    }

    const tokenAssinatura = crypto.randomBytes(16).toString("hex");

    const newContrato = await prisma.contrato.create({
      data: {
        empresaId: session.empresaId,
        locatarioId,
        flatId,
        modeloContratoId: modeloContratoId || null,
        dataEmissao: dtEmissao,
        tipoValidade: isDias ? "DIAS" : "MESES",
        validadeMeses: mesesInt,
        validadeDias: diasInt,
        dataFinal: dtFinal,
        valorMensal: vlrMensalNum,
        diaVencimento: diaVencNum,
        formaPagamento: formaPagamento || "PIX",
        bancoNome: bancoNome || null,
        bancoDadosConta: bancoDadosConta || null,
        multaAtrasoPercentual: multaNum,
        jurosAtrasoPercentual: jurosNum,
        valorCaucao: caucaoNum,
        caucaoParcelas: caucaoParcNum,
        multaRescisaoMeses: multaRescisaoNum,
        fotosAnexadasUrl: fotosAnexadasUrl || null,
        tokenAssinatura,
        statusAssinatura: "PENDENTE",
        status: "ATIVO",
      },
    });

    // Atualizar flat para OCUPADO
    await prisma.flat.update({
      where: { id: flatId },
      data: { status: "OCUPADO" },
    });

    // Gerar parcelas no Contas a Receber
    const parcelasData = [];
    if (isDias) {
      const mesRef = `${dtEmissao.getFullYear()}-${String(dtEmissao.getMonth() + 1).padStart(2, "0")}`;
      parcelasData.push({
        empresaId: session.empresaId,
        contratoId: newContrato.id,
        locatarioId,
        mesReferencia: mesRef,
        numeroParcela: 1,
        valor: vlrMensalNum,
        dataVencimento: dtEmissao,
        status: "PENDENTE",
        observacao: `Locação por temporada/diária (${duracaoValor} dias)`,
      });
    } else {
      for (let i = 1; i <= duracaoValor; i++) {
        const vencimento = new Date(dtEmissao);
        vencimento.setMonth(vencimento.getMonth() + (i - 1));

        if (diaVencNum && diaVencNum >= 1 && diaVencNum <= 31) {
          vencimento.setDate(Math.min(diaVencNum, 28));
        }

        const mesRef = `${vencimento.getFullYear()}-${String(vencimento.getMonth() + 1).padStart(2, "0")}`;

        parcelasData.push({
          empresaId: session.empresaId,
          contratoId: newContrato.id,
          locatarioId,
          mesReferencia: mesRef,
          numeroParcela: i,
          valor: vlrMensalNum,
          dataVencimento: vencimento,
          status: "PENDENTE",
        });
      }
    }

    await prisma.contaReceber.createMany({
      data: parcelasData,
    });

    return NextResponse.json({ contrato: newContrato, tokenAssinatura });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
