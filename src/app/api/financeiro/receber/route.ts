import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const contas = await prisma.contaReceber.findMany({
      where: { empresaId: session.empresaId },
      include: {
        locatario: true,
        contrato: {
          include: { flat: true },
        },
      },
      orderBy: { dataVencimento: "asc" },
    });

    return NextResponse.json({ contas });
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
    const { locatarioId, valor, dataVencimento, observacao } = await request.json();

    const dateVenc = new Date(dataVencimento);
    const mesRef = `${dateVenc.getFullYear()}-${String(dateVenc.getMonth() + 1).padStart(2, "0")}`;

    const newConta = await prisma.contaReceber.create({
      data: {
        empresaId: session.empresaId,
        locatarioId,
        mesReferencia: mesRef,
        numeroParcela: 1,
        valor: parseFloat(valor),
        dataVencimento: dateVenc,
        status: "PENDENTE",
        observacao,
      },
    });

    return NextResponse.json({ conta: newConta });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { id, locatarioId, valor, dataVencimento, status, formaPagamento, valorPago, dataPagamento, observacao } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID do lançamento é obrigatório." }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (formaPagamento !== undefined) updateData.formaPagamento = formaPagamento;
    if (observacao !== undefined) updateData.observacao = observacao;
    if (locatarioId) updateData.locatarioId = locatarioId;
    if (valor) updateData.valor = parseFloat(valor);
    if (valorPago !== undefined) updateData.valorPago = valorPago ? parseFloat(valorPago) : null;
    if (dataPagamento !== undefined) updateData.dataPagamento = dataPagamento ? new Date(dataPagamento) : null;

    if (dataVencimento) {
      const dateVenc = new Date(dataVencimento);
      updateData.dataVencimento = dateVenc;
      updateData.mesReferencia = `${dateVenc.getFullYear()}-${String(dateVenc.getMonth() + 1).padStart(2, "0")}`;
    }

    const updatedConta = await prisma.contaReceber.update({
      where: { id, empresaId: session.empresaId },
      data: updateData,
    });

    return NextResponse.json({ conta: updatedConta });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório para exclusão." }, { status: 400 });
    }

    await prisma.contaReceber.delete({
      where: { id, empresaId: session.empresaId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
