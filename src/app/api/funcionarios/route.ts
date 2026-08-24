import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const funcionarios = await prisma.usuario.findMany({
      where: { empresaId: session.empresaId },
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        status: true,
        createdAt: true,
      },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json({ funcionarios });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.cargo !== "ADMIN") {
    return NextResponse.json({ error: "Apenas administradores podem cadastrar novos funcionários." }, { status: 403 });
  }

  try {
    const { nome, email, senha, cargo } = await request.json();

    const existingUser = await prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Este e-mail já está em uso por outro usuário." }, { status: 400 });
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const newFuncionario = await prisma.usuario.create({
      data: {
        empresaId: session.empresaId,
        nome,
        email,
        senhaHash,
        cargo: cargo || "OPERADOR",
        status: "ATIVO",
      },
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ funcionario: newFuncionario });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.cargo !== "ADMIN") {
    return NextResponse.json({ error: "Apenas administradores podem editar funcionários." }, { status: 403 });
  }

  try {
    const { id, nome, email, senha, cargo, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID do funcionário é obrigatório." }, { status: 400 });
    }

    const updateData: any = {
      nome,
      email,
      cargo,
      status,
    };

    if (senha && senha.trim() !== "") {
      updateData.senhaHash = await bcrypt.hash(senha, 12);
    }

    const updatedFuncionario = await prisma.usuario.update({
      where: { id, empresaId: session.empresaId },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ funcionario: updatedFuncionario });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
