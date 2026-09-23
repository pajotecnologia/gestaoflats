import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSessionOrFallback();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const rawModelos = await prisma.modeloChecklist.findMany({
    where: { empresaId: session.empresaId },
    orderBy: { titulo: "asc" },
  });
  const modelos = rawModelos.map((m) => ({
    id: m.id,
    empresaId: m.empresaId,
    nome: m.titulo,
    titulo: m.titulo,
    descricao: m.descricao,
    itens: m.topicosJson ? JSON.parse(m.topicosJson) : [],
    itensJson: m.topicosJson,
    ativo: true,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }));
  return NextResponse.json({ modelos });
}

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const body = await request.json();
    const nome = String(body.nome || body.titulo || "").trim();
    const descricao = body.descricao ? String(body.descricao) : null;
    const itens = Array.isArray(body.itens) ? body.itens : (body.topicos ? body.topicos : []);
    if (!nome) return NextResponse.json({ error: "Nome do modelo é obrigatório." }, { status: 400 });

    const modelo = await prisma.modeloChecklist.create({
      data: {
        empresaId: session.empresaId,
        titulo: nome,
        descricao,
        topicosJson: JSON.stringify(itens),
        padrao: Boolean(body.padrao),
      },
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
    const current = await prisma.modeloChecklist.findFirst({ where: { id, empresaId: session.empresaId } });
    if (!current) return NextResponse.json({ error: "Modelo não encontrado." }, { status: 404 });

    const data: any = {};
    if (body.nome !== undefined || body.titulo !== undefined) {
      data.titulo = String(body.nome || body.titulo).trim();
    }
    if (body.descricao !== undefined) data.descricao = body.descricao ? String(body.descricao) : null;
    if (Array.isArray(body.itens) || Array.isArray(body.topicos)) {
      data.topicosJson = JSON.stringify(body.itens || body.topicos);
    }
    if (body.padrao !== undefined) data.padrao = Boolean(body.padrao);

    const modelo = await prisma.modeloChecklist.update({ where: { id }, data });
    return NextResponse.json({ modelo });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar modelo." }, { status: 500 });
  }
}
