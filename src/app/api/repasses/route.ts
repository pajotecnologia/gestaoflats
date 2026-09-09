import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes"); // Ex: "2026-09"
    const proprietarioId = searchParams.get("proprietarioId");
    const status = searchParams.get("status");

    const where: any = { empresaId: session.empresaId };
    if (mes) where.mesReferencia = mes;
    if (proprietarioId) where.proprietarioId = proprietarioId;
    if (status && status !== "TODOS") where.status = status;

    const repasses = await prisma.repasseProprietario.findMany({
      where,
      include: {
        proprietario: true,
        flat: {
          include: { local: true },
        },
        contrato: {
          include: { locatario: true },
        },
        contaReceber: true,
      },
      orderBy: [{ dataVencimento: "desc" }, { createdAt: "desc" }],
    });

    // Totais Consolidados
    const totalBruto = repasses.reduce((acc, r) => acc + r.valorBrutoAluguel, 0);
    const totalTaxaAdmin = repasses.reduce((acc, r) => acc + r.valorTaxaAdmin, 0);
    const totalLiquido = repasses.reduce((acc, r) => acc + r.valorLiquidoRepasse, 0);
    const totalPago = repasses
      .filter((r) => r.status === "PAGO")
      .reduce((acc, r) => acc + r.valorLiquidoRepasse, 0);
    const totalPendente = repasses
      .filter((r) => r.status === "PENDENTE")
      .reduce((acc, r) => acc + r.valorLiquidoRepasse, 0);

    return NextResponse.json({
      repasses,
      totais: {
        totalBruto,
        totalTaxaAdmin,
        totalLiquido,
        totalPago,
        totalPendente,
        quantidade: repasses.length,
      },
    });
  } catch (error: any) {
    console.error("Erro ao buscar repasses:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      proprietarioId,
      flatId,
      contratoId,
      contaReceberId,
      mesReferencia,
      valorBrutoAluguel,
      taxaAdminPercentual,
      valorDescontos,
      dataVencimento,
      formaPagamento,
      observacoes,
    } = body;

    if (!proprietarioId || !valorBrutoAluguel || !dataVencimento) {
      return NextResponse.json(
        { error: "Proprietário, Valor Bruto do Aluguel e Data de Vencimento são obrigatórios." },
        { status: 400 }
      );
    }

    const bruto = parseFloat(String(valorBrutoAluguel));
    const taxaPerc = taxaAdminPercentual !== undefined ? parseFloat(String(taxaAdminPercentual)) : 10.0;
    const taxaValor = Number(((bruto * taxaPerc) / 100).toFixed(2));
    const descontos = valorDescontos ? parseFloat(String(valorDescontos)) : 0.0;
    const liquido = Number((bruto - taxaValor - descontos).toFixed(2));

    const newRepasse = await prisma.repasseProprietario.create({
      data: {
        empresaId: session.empresaId,
        proprietarioId,
        flatId: flatId || null,
        contratoId: contratoId || null,
        contaReceberId: contaReceberId || null,
        mesReferencia: mesReferencia || new Date().toISOString().substring(0, 7),
        valorBrutoAluguel: bruto,
        taxaAdminPercentual: taxaPerc,
        valorTaxaAdmin: taxaValor,
        valorDescontos: descontos,
        valorLiquidoRepasse: liquido,
        dataVencimento: new Date(dataVencimento),
        status: "PENDENTE",
        formaPagamento: formaPagamento || "PIX",
        observacoes: observacoes?.trim() || null,
      },
      include: {
        proprietario: true,
        flat: { include: { local: true } },
      },
    });

    return NextResponse.json({ repasse: newRepasse });
  } catch (error: any) {
    console.error("Erro ao criar repasse:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, dataPagamento, formaPagamento, comprovanteUrl, observacoes, valorDescontos } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório para atualização." }, { status: 400 });
    }

    const repasseExistente = await prisma.repasseProprietario.findUnique({
      where: { id, empresaId: session.empresaId },
    });

    if (!repasseExistente) {
      return NextResponse.json({ error: "Repasse não encontrado." }, { status: 404 });
    }

    let novoLiquido = repasseExistente.valorLiquidoRepasse;
    if (valorDescontos !== undefined) {
      const desc = parseFloat(String(valorDescontos));
      novoLiquido = Number(
        (repasseExistente.valorBrutoAluguel - repasseExistente.valorTaxaAdmin - desc).toFixed(2)
      );
    }

    const updated = await prisma.repasseProprietario.update({
      where: { id, empresaId: session.empresaId },
      data: {
        status: status !== undefined ? status : undefined,
        dataPagamento:
          status === "PAGO"
            ? dataPagamento
              ? new Date(dataPagamento)
              : new Date()
            : status === "PENDENTE"
            ? null
            : undefined,
        formaPagamento: formaPagamento !== undefined ? formaPagamento : undefined,
        comprovanteUrl: comprovanteUrl !== undefined ? comprovanteUrl : undefined,
        observacoes: observacoes !== undefined ? observacoes : undefined,
        valorDescontos: valorDescontos !== undefined ? parseFloat(String(valorDescontos)) : undefined,
        valorLiquidoRepasse: novoLiquido,
      },
      include: {
        proprietario: true,
        flat: { include: { local: true } },
      },
    });

    return NextResponse.json({ repasse: updated });
  } catch (error: any) {
    console.error("Erro ao atualizar repasse:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório para exclusão." }, { status: 400 });
    }

    await prisma.repasseProprietario.delete({
      where: { id, empresaId: session.empresaId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao excluir repasse:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
