import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/validation";
import { DEFAULT_CONTRATO_HTML } from "@/lib/defaultContractTemplate";

export async function GET() {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let modelos = await prisma.modeloContrato.findMany({
    where: { empresaId: session.empresaId },
    orderBy: { titulo: "asc" },
  });

  if (modelos.length === 0) {
    const modeloPadrao = await prisma.modeloContrato.create({
      data: {
        empresaId: session.empresaId,
        titulo: "Contrato Padrão de Locação Residencial de Flat",
        conteudoHtml: DEFAULT_CONTRATO_HTML,
      },
    });
    modelos = [modeloPadrao];
  }

  return NextResponse.json({ modelos });
}

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { id, titulo, conteudoHtml } = await request.json();

    if (!titulo || !conteudoHtml) {
      return NextResponse.json({ error: "Título e Conteúdo HTML são obrigatórios." }, { status: 400 });
    }

    const conteudoSanitizado = sanitizeInput(conteudoHtml);

    let modelo;

    // 1. Se informou ID, atualiza exatamente o modelo selecionado
    if (id) {
      const modeloPorId = await prisma.modeloContrato.findUnique({
        where: { id },
      });
      if (modeloPorId && modeloPorId.empresaId === session.empresaId) {
        modelo = await prisma.modeloContrato.update({
          where: { id },
          data: {
            titulo,
            conteudoHtml: conteudoSanitizado,
          },
        });
      }
    }

    // 2. Se não tinha ID ou se o ID não foi encontrado, verifica pelo título para evitar duplicidade
    if (!modelo) {
      const todosModelos = await prisma.modeloContrato.findMany({
        where: {
          empresaId: session.empresaId,
        },
      });

      const modeloExistente = todosModelos.find(
        (m) => m.titulo.trim().toLowerCase() === titulo.trim().toLowerCase()
      );

      if (modeloExistente) {
        modelo = await prisma.modeloContrato.update({
          where: { id: modeloExistente.id },
          data: {
            titulo,
            conteudoHtml: conteudoSanitizado,
          },
        });
      } else {
        modelo = await prisma.modeloContrato.create({
          data: {
            empresaId: session.empresaId,
            titulo,
            conteudoHtml: conteudoSanitizado,
          },
        });
      }
    }

    return NextResponse.json({ success: true, modelo });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao salvar modelo de contrato." }, { status: 500 });
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
      return NextResponse.json({ error: "ID do modelo é obrigatório." }, { status: 400 });
    }

    await prisma.modeloContrato.deleteMany({
      where: { id, empresaId: session.empresaId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir modelo de contrato." }, { status: 500 });
  }
}
