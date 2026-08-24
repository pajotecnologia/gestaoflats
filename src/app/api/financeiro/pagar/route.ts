import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const contas = await prisma.contaPagar.findMany({
      where: { empresaId: session.empresaId },
      include: {
        fornecedor: true,
        local: true,
        flat: true,
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
    const { fornecedorId, localId, flatId, descricao, valor, dataVencimento } = await request.json();

    const dateVenc = new Date(dataVencimento);

    const newConta = await prisma.contaPagar.create({
      data: {
        empresaId: session.empresaId,
        fornecedorId: fornecedorId || null,
        localId: localId || null,
        flatId: flatId || null,
        descricao,
        valor: parseFloat(valor),
        dataCompra: new Date(),
        dataVencimento: dateVenc,
        status: "PENDENTE",
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
    const { id, fornecedorId, localId, flatId, descricao, valor, dataVencimento, status, dataPagamento } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID do lançamento é obrigatório." }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (descricao) updateData.descricao = descricao;
    if (fornecedorId !== undefined) updateData.fornecedorId = fornecedorId || null;
    if (localId !== undefined) updateData.localId = localId || null;
    if (flatId !== undefined) updateData.flatId = flatId || null;
    if (valor) updateData.valor = parseFloat(valor);
    if (dataVencimento) updateData.dataVencimento = new Date(dataVencimento);
    if (dataPagamento !== undefined) updateData.dataPagamento = dataPagamento ? new Date(dataPagamento) : null;

    const updatedConta = await prisma.contaPagar.update({
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

    await prisma.contaPagar.delete({
      where: { id, empresaId: session.empresaId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
