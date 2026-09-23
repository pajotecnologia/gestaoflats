import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSessionOrFallback();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const modelos = await prisma.checklistModelo.findMany({
    where: { empresaId: session.empresaId, ativo: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json({ modelos });
}

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const body = await request.json();
    const nome = String(body.nome || "").trim();
    const descricao = body.descricao ? String(body.descricao) : null;
    const itens = Array.isArray(body.itens) ? body.itens : [];
    if (!nome) return NextResponse.json({ error: "Nome do modelo é obrigatório." }, { status: 400 });
    if (!itens.length) return NextResponse.json({ error: "Adicione pelo menos um item ao modelo." }, { status: 400 });

    const modelo = await prisma.checklistModelo.create({
      data: { empresaId: session.empresaId, nome, descricao, itensJson: JSON.stringify(itens) },
    });
    return NextResponse.json({ modelo }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao criar modelo." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const body = await request.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "ID do modelo é obrigatório." }, { status: 400 });
    const current = await prisma.checklistModelo.findFirst({ where: { id, empresaId: session.empresaId } });
    if (!current) return NextResponse.json({ error: "Modelo não encontrado." }, { status: 404 });

    const data: any = {};
    if (body.nome !== undefined) data.nome = String(body.nome).trim();
    if (body.descricao !== undefined) data.descricao = body.descricao ? String(body.descricao) : null;
    if (Array.isArray(body.itens)) data.itensJson = JSON.stringify(body.itens);
    if (body.ativo !== undefined) data.ativo = Boolean(body.ativo);

    const modelo = await prisma.checklistModelo.update({ where: { id }, data });
    return NextResponse.json({ modelo });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar modelo." }, { status: 500 });
  }
}
