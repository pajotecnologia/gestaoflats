import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_FORMAS = [
  "PIX",
  "DINHEIRO",
  "CARTÃO DE CRÉDITO",
  "CARTÃO DE DÉBITO",
  "BOLETO BANCÁRIO",
  "TRANSFERÊNCIA / TED",
];

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.empresaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = session.empresaId;
    let formas = await prisma.formaPagamento.findMany({
      where: { empresaId },
      orderBy: { createdAt: "asc" },
    });

    // Se ainda não existirem formas cadastradas para esta empresa, insere os padrões
    if (formas.length === 0) {
      for (const nome of DEFAULT_FORMAS) {
        await prisma.formaPagamento.create({
          data: {
            empresaId,
            nome,
            ativo: true,
          },
        });
      }
      formas = await prisma.formaPagamento.findMany({
        where: { empresaId },
        orderBy: { createdAt: "asc" },
      });
    }

    return NextResponse.json({ formas });
  } catch (error: any) {
    console.error("Erro ao buscar formas de pagamento:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.empresaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { nome } = body;

    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: "O nome da forma de pagamento é obrigatório." }, { status: 400 });
    }

    const forma = await prisma.formaPagamento.create({
      data: {
        empresaId: session.empresaId,
        nome: nome.trim(),
        ativo: true,
      },
    });

    return NextResponse.json({ forma });
  } catch (error: any) {
    console.error("Erro ao criar forma de pagamento:", error);
    return NextResponse.json({ error: "Erro ao criar forma de pagamento" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.empresaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { id, nome, ativo } = body;

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido." }, { status: 400 });
    }

    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome.trim();
    if (ativo !== undefined) updateData.ativo = Boolean(ativo);

    const forma = await prisma.formaPagamento.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ forma });
  } catch (error: any) {
    console.error("Erro ao atualizar forma de pagamento:", error);
    return NextResponse.json({ error: "Erro ao atualizar forma de pagamento" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.empresaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID não informado." }, { status: 400 });
    }

    await prisma.formaPagamento.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao excluir forma de pagamento:", error);
    return NextResponse.json({ error: "Erro ao excluir forma de pagamento" }, { status: 500 });
  }
}
