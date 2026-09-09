import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const flatId = searchParams.get("flatId");
  const locatarioId = searchParams.get("locatarioId");
  const tipoVistoria = searchParams.get("tipoVistoria");
  const statusAssinatura = searchParams.get("statusAssinatura");
  const apenasDisponiveis = searchParams.get("apenasDisponiveis") === "true";
  const search = searchParams.get("search");

  try {
    const whereClause: any = {
      empresaId: session.empresaId,
    };

    if (flatId) {
      whereClause.flatId = flatId;
    }

    if (locatarioId) {
      whereClause.locatarioId = locatarioId;
    }

    if (tipoVistoria && tipoVistoria !== "TODOS") {
      whereClause.tipoVistoria = tipoVistoria;
    }

    if (statusAssinatura && statusAssinatura !== "TODOS") {
      if (statusAssinatura === "ASSINADO") {
        whereClause.statusAssinatura = { contains: "ASSINADO" };
      } else {
        whereClause.statusAssinatura = "PENDENTE";
      }
    }

    if (apenasDisponiveis) {
      whereClause.contratoId = null;
    }

    if (search && search.trim()) {
      whereClause.OR = [
        { flat: { numero: { contains: search, mode: "insensitive" } } },
        { flat: { local: { nome: { contains: search, mode: "insensitive" } } } },
        { locatario: { nome: { contains: search, mode: "insensitive" } } },
        { responsavelVistoria: { contains: search, mode: "insensitive" } },
      ];
    }

    const vistorias = await prisma.vistoriaChecklist.findMany({
      where: whereClause,
      include: {
        flat: {
          include: { local: true },
        },
        locatario: true,
        contrato: {
          include: { locatario: true, flat: true },
        },
        empresa: true,
      },
      orderBy: [{ dataVistoria: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ vistorias });
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
      flatId,
      locatarioId,
      contratoId,
      tipoVistoria = "ENTRADA",
      responsavelVistoria,
      itens = [],
      observacoesGerais = "",
      dataVistoria,
    } = body;

    if (!flatId) {
      return NextResponse.json({ error: "Flat / Imóvel é obrigatório para realizar a vistoria." }, { status: 400 });
    }

    // Verificar se o flat pertence à empresa
    const flat = await prisma.flat.findFirst({
      where: { id: flatId, empresaId: session.empresaId },
      include: { local: true },
    });

    if (!flat) {
      return NextResponse.json({ error: "Imóvel não encontrado." }, { status: 404 });
    }

    const tokenAssinatura = crypto.randomBytes(16).toString("hex");

    const itensJsonPayload = JSON.stringify({
      itens,
      observacoesGerais,
    });

    const novaVistoria = await prisma.vistoriaChecklist.create({
      data: {
        empresaId: session.empresaId,
        flatId,
        locatarioId: locatarioId || null,
        contratoId: contratoId || null,
        tipoVistoria,
        responsavelVistoria: responsavelVistoria || "Vistoriador Responsável",
        dataVistoria: dataVistoria ? new Date(dataVistoria) : new Date(),
        itensJson: itensJsonPayload,
        tokenAssinatura,
        statusAssinatura: "PENDENTE",
      },
      include: {
        flat: {
          include: { local: true },
        },
        locatario: true,
        contrato: true,
        empresa: true,
      },
    });

    return NextResponse.json({
      success: true,
      vistoria: novaVistoria,
      tokenAssinatura,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID da vistoria é obrigatório." }, { status: 400 });
  }

  try {
    const vistoria = await prisma.vistoriaChecklist.findFirst({
      where: { id, empresaId: session.empresaId },
    });

    if (!vistoria) {
      return NextResponse.json({ error: "Vistoria não encontrada." }, { status: 404 });
    }

    if (vistoria.contratoId) {
      // Se estiver vinculada a um contrato, desvincula ou avisa
      const contrato = await prisma.contrato.findUnique({
        where: { id: vistoria.contratoId },
      });
      if (contrato && contrato.status === "ATIVO") {
        return NextResponse.json(
          { error: "Esta vistoria está vinculada a um Contrato Ativo e não pode ser excluída diretamente." },
          { status: 400 }
        );
      }
    }

    await prisma.vistoriaChecklist.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
