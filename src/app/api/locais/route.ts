import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const locais = await prisma.local.findMany({
      where: { empresaId: session.empresaId },
      include: {
        flats: {
          include: { proprietario: true },
          orderBy: { numero: "asc" },
        },
      },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json({ locais });
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
    const body = await request.json();
    const {
      nome,
      razaoSocial,
      cnpj,
      email,
      telefone,
      endereco,
      bairro,
      cidade,
      estado,
      cep,
      logomarcaUrl,
    } = body;

    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: "O nome do condomínio/edifício é obrigatório." }, { status: 400 });
    }

    const newLocal = await prisma.local.create({
      data: {
        empresaId: session.empresaId,
        nome: nome.trim(),
        razaoSocial: razaoSocial ? razaoSocial.trim() : null,
        cnpj: cnpj ? cnpj.trim() : null,
        email: email ? email.trim() : null,
        telefone: telefone ? telefone.trim() : null,
        endereco: endereco ? endereco.trim() : "",
        bairro: bairro ? bairro.trim() : null,
        cidade: cidade ? cidade.trim() : null,
        estado: estado ? estado.trim() : null,
        cep: cep ? cep.trim() : null,
        logomarcaUrl: logomarcaUrl || null,
      },
      include: {
        flats: true,
      },
    });

    return NextResponse.json({ local: newLocal });
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
    const body = await request.json();
    const {
      id,
      nome,
      razaoSocial,
      cnpj,
      email,
      telefone,
      endereco,
      bairro,
      cidade,
      estado,
      cep,
      logomarcaUrl,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do condomínio é obrigatório." }, { status: 400 });
    }

    const updatedLocal = await prisma.local.update({
      where: { id, empresaId: session.empresaId },
      data: {
        nome: nome ? nome.trim() : undefined,
        razaoSocial: razaoSocial !== undefined ? (razaoSocial ? razaoSocial.trim() : null) : undefined,
        cnpj: cnpj !== undefined ? (cnpj ? cnpj.trim() : null) : undefined,
        email: email !== undefined ? (email ? email.trim() : null) : undefined,
        telefone: telefone !== undefined ? (telefone ? telefone.trim() : null) : undefined,
        endereco: endereco !== undefined ? (endereco ? endereco.trim() : "") : undefined,
        bairro: bairro !== undefined ? (bairro ? bairro.trim() : null) : undefined,
        cidade: cidade !== undefined ? (cidade ? cidade.trim() : null) : undefined,
        estado: estado !== undefined ? (estado ? estado.trim() : null) : undefined,
        cep: cep !== undefined ? (cep ? cep.trim() : null) : undefined,
        logomarcaUrl: logomarcaUrl !== undefined ? (logomarcaUrl || null) : undefined,
      },
      include: {
        flats: true,
      },
    });

    return NextResponse.json({ local: updatedLocal });
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
      return NextResponse.json({ error: "ID do condomínio é obrigatório." }, { status: 400 });
    }

    await prisma.local.delete({
      where: { id, empresaId: session.empresaId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
