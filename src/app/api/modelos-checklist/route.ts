import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CHECKLIST_TEMPLATES } from "@/lib/defaultChecklistTemplates";

export async function GET() {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    let modelos = await prisma.modeloChecklist.findMany({
      where: { empresaId: session.empresaId },
      orderBy: [{ padrao: "desc" }, { titulo: "asc" }],
    });

    // Auto-seed dos modelos padrão caso a empresa não possua nenhum modelo ainda
    if (modelos.length === 0) {
      for (const tpl of DEFAULT_CHECKLIST_TEMPLATES) {
        await prisma.modeloChecklist.create({
          data: {
            empresaId: session.empresaId,
            titulo: tpl.titulo,
            tipoImovel: tpl.tipoImovel,
            descricao: tpl.descricao,
            topicosJson: JSON.stringify(tpl.topicos),
            padrao: tpl.tipoImovel === "FLAT",
          },
        });
      }

      modelos = await prisma.modeloChecklist.findMany({
        where: { empresaId: session.empresaId },
        orderBy: [{ padrao: "desc" }, { titulo: "asc" }],
      });
    }

    return NextResponse.json({ modelos });
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
    const { titulo, tipoImovel = "FLAT", descricao, topicosJson, padrao = false } = await request.json();

    if (!titulo || !topicosJson) {
      return NextResponse.json({ error: "Título e tópicos do checklist são obrigatórios." }, { status: 400 });
    }

    // Se este for marcado como padrão, desmarca outros do mesmo tipo
    if (padrao) {
      await prisma.modeloChecklist.updateMany({
        where: { empresaId: session.empresaId, tipoImovel },
        data: { padrao: false },
      });
    }

    const novoModelo = await prisma.modeloChecklist.create({
      data: {
        empresaId: session.empresaId,
        titulo,
        tipoImovel,
        descricao,
        topicosJson: typeof topicosJson === "string" ? topicosJson : JSON.stringify(topicosJson),
        padrao: Boolean(padrao),
      },
    });

    return NextResponse.json({ modelo: novoModelo });
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
    const { id, titulo, tipoImovel = "FLAT", descricao, topicosJson, padrao = false } = await request.json();

    if (!id || !titulo || !topicosJson) {
      return NextResponse.json({ error: "ID, título e tópicos do checklist são obrigatórios." }, { status: 400 });
    }

    if (padrao) {
      await prisma.modeloChecklist.updateMany({
        where: { empresaId: session.empresaId, tipoImovel, id: { not: id } },
        data: { padrao: false },
      });
    }

    const modeloAtualizado = await prisma.modeloChecklist.update({
      where: { id, empresaId: session.empresaId },
      data: {
        titulo,
        tipoImovel,
        descricao,
        topicosJson: typeof topicosJson === "string" ? topicosJson : JSON.stringify(topicosJson),
        padrao: Boolean(padrao),
      },
    });

    return NextResponse.json({ modelo: modeloAtualizado });
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

    await prisma.modeloChecklist.delete({
      where: { id, empresaId: session.empresaId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
