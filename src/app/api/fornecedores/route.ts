import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCNPJ } from "@/lib/validation";

export async function GET() {
  const session = await getAuthSession();
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
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { razaoSocial, cnpj, endereco, cep, telefone, email } = await request.json();

    const cnpjFormatado = formatCNPJ(cnpj);

    const newFornecedor = await prisma.fornecedor.create({
      data: {
        empresaId: session.empresaId,
        razaoSocial,
        cnpj: cnpjFormatado,
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
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { id, razaoSocial, cnpj, endereco, cep, telefone, email } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID do fornecedor é obrigatório." }, { status: 400 });
    }

    const cnpjFormatado = formatCNPJ(cnpj);

    const updatedFornecedor = await prisma.fornecedor.update({
      where: { id, empresaId: session.empresaId },
      data: {
        razaoSocial,
        cnpj: cnpjFormatado,
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
