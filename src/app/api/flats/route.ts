import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const locais = await prisma.local.findMany({
      where: { empresaId: session.empresaId },
      include: {
        flats: {
          orderBy: { numero: "asc" },
        },
      },
      orderBy: { nome: "asc" },
    });

    const flats = await prisma.flat.findMany({
      where: { empresaId: session.empresaId },
      include: {
        local: true,
      },
      orderBy: { numero: "asc" },
    });

    return NextResponse.json({ locais, flats });
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
    const body = await request.json();
    const { type } = body;

    if (type === "local") {
      const { nome, endereco } = body;
      const newLocal = await prisma.local.create({
        data: {
          empresaId: session.empresaId,
          nome,
          endereco,
        },
      });
      return NextResponse.json({ local: newLocal });
    } else if (type === "flat") {
      const { localId, numero, status, descricao, valorPadrao, fotosUrl } = body;
      const newFlat = await prisma.flat.create({
        data: {
          empresaId: session.empresaId,
          localId,
          numero,
          status: status || "DISPONIVEL",
          descricao,
          valorPadrao: valorPadrao ? parseFloat(valorPadrao) : 2500,
          fotosUrl: fotosUrl ? (typeof fotosUrl === "string" ? fotosUrl : JSON.stringify(fotosUrl)) : null,
        },
      });
      return NextResponse.json({ flat: newFlat });
    }

    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
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
    const body = await request.json();
    const { type, id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório para atualização." }, { status: 400 });
    }

    if (type === "local") {
      const { nome, endereco } = body;
      const updatedLocal = await prisma.local.update({
        where: { id, empresaId: session.empresaId },
        data: {
          nome,
          endereco,
        },
      });
      return NextResponse.json({ local: updatedLocal });
    } else if (type === "flat") {
      const { localId, numero, status, descricao, valorPadrao, fotosUrl } = body;
      const updatedFlat = await prisma.flat.update({
        where: { id, empresaId: session.empresaId },
        data: {
          localId,
          numero,
          status,
          descricao,
          valorPadrao: valorPadrao ? parseFloat(valorPadrao) : undefined,
          fotosUrl: fotosUrl !== undefined ? (typeof fotosUrl === "string" ? fotosUrl : JSON.stringify(fotosUrl)) : undefined,
        },
      });
      return NextResponse.json({ flat: updatedFlat });
    }

    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
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
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!id || !type) {
      return NextResponse.json({ error: "ID e tipo são obrigatórios para exclusão." }, { status: 400 });
    }

    if (type === "local") {
      await prisma.local.delete({
        where: { id, empresaId: session.empresaId },
      });
      return NextResponse.json({ success: true });
    } else if (type === "flat") {
      await prisma.flat.delete({
        where: { id, empresaId: session.empresaId },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
