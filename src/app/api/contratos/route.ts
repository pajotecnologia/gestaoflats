import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
  const session = await getAuthSession();
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
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const {
      locatarioId,
      flatId,
      modeloContratoId,
      dataEmissao,
      validadeMeses,
      valorMensal,
      fotosAnexadasUrl,
    } = await request.json();

    const dtEmissao = new Date(dataEmissao);
    const mesesInt = parseInt(validadeMeses, 10);
    const vlrMensalNum = parseFloat(valorMensal);

    const dtFinal = new Date(dtEmissao);
    dtFinal.setMonth(dtFinal.getMonth() + mesesInt);

    const flatObj = await prisma.flat.findUnique({
      where: { id: flatId },
    });

    if (!flatObj) {
      return NextResponse.json({ error: "Flat selecionado não foi encontrado." }, { status: 404 });
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
        validadeMeses: mesesInt,
        dataFinal: dtFinal,
        valorMensal: vlrMensalNum,
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
    for (let i = 1; i <= mesesInt; i++) {
      const vencimento = new Date(dtEmissao);
      vencimento.setMonth(vencimento.getMonth() + (i - 1));

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

    await prisma.contaReceber.createMany({
      data: parcelasData,
    });

    return NextResponse.json({ contrato: newContrato, tokenAssinatura });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
