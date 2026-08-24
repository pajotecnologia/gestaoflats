import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateCPF, formatCPF } from "@/lib/validation";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const locatarios = await prisma.locatario.findMany({
      where: { empresaId: session.empresaId },
      include: {
        contratos: {
          where: { status: "ATIVO" },
          include: { flat: true },
        },
      },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json({ locatarios });
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
    const { nome, cpf, rg, dataNascimento, email, telefone, endereco } = await request.json();

    const cpfFormatado = formatCPF(cpf);
    if (!validateCPF(cpfFormatado)) {
      return NextResponse.json({ error: "CPF matematicamente inválido." }, { status: 400 });
    }

    const existingLocatario = await prisma.locatario.findFirst({
      where: {
        empresaId: session.empresaId,
        cpf: cpfFormatado,
      },
    });

    if (existingLocatario) {
      return NextResponse.json({ error: "Já existe um locatário cadastrado com este CPF nesta empresa." }, { status: 400 });
    }

    const newLocatario = await prisma.locatario.create({
      data: {
        empresaId: session.empresaId,
        nome,
        cpf: cpfFormatado,
        rg,
        dataNascimento: dataNascimento ? dataNascimento.toString() : null,
        email,
        telefone,
        endereco,
      },
    });

    return NextResponse.json({ locatario: newLocatario });
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
    const { id, nome, cpf, rg, dataNascimento, email, telefone, endereco } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID do locatário é obrigatório." }, { status: 400 });
    }

    const cpfFormatado = formatCPF(cpf);
    if (!validateCPF(cpfFormatado)) {
      return NextResponse.json({ error: "CPF matematicamente inválido." }, { status: 400 });
    }

    const updatedLocatario = await prisma.locatario.update({
      where: { id, empresaId: session.empresaId },
      data: {
        nome,
        cpf: cpfFormatado,
        rg,
        dataNascimento: dataNascimento ? dataNascimento.toString() : null,
        email,
        telefone,
        endereco,
      },
    });

    return NextResponse.json({ locatario: updatedLocatario });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
