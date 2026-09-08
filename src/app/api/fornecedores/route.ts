import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCPFOrCNPJ } from "@/lib/validation";

export async function GET() {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const fornecedores = await prisma.fornecedor.findMany({
      where: { empresaId: session.empresaId },
      orderBy: { razaoSocial: "asc" },
    });

    return NextResponse.json({ fornecedores });
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
    const { razaoSocial, cnpj, endereco, cep, telefone, email } = await request.json();

    const docFormatado = formatCPFOrCNPJ(cnpj || "");

    const newFornecedor = await prisma.fornecedor.create({
      data: {
        empresaId: session.empresaId,
        razaoSocial,
        cnpj: docFormatado,
        endereco,
        cep,
        telefone,
        email,
      },
    });

    return NextResponse.json({ fornecedor: newFornecedor });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { id, razaoSocial, cnpj, endereco, cep, telefone, email } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID do fornecedor é obrigatório." }, { status: 400 });
    }

    const docFormatado = formatCPFOrCNPJ(cnpj || "");

    const updatedFornecedor = await prisma.fornecedor.update({
      where: { id, empresaId: session.empresaId },
      data: {
        razaoSocial,
        cnpj: docFormatado,
        endereco,
        cep,
        telefone,
        email,
      },
    });

    return NextResponse.json({ fornecedor: updatedFornecedor });
  } catch (error: any) {
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
      return NextResponse.json({ error: "ID é obrigatório." }, { status: 400 });
    }

    const contasVinculadas = await prisma.contaPagar.count({
      where: { fornecedorId: id },
    });

    if (contasVinculadas > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir: existem ${contasVinculadas} conta(s) a pagar vinculada(s) a este fornecedor.` },
        { status: 400 }
      );
    }

    await prisma.fornecedor.delete({
      where: { id, empresaId: session.empresaId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
