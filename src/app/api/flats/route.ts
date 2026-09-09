import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkLimit } from "@/lib/plans/planService";

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
          orderBy: { numero: "asc" },
        },
      },
      orderBy: { nome: "asc" },
    });

    const flats = await prisma.flat.findMany({
      where: { empresaId: session.empresaId },
      include: {
        local: true,
        proprietario: true,
      },
      orderBy: { numero: "asc" },
    });

    // Reconciliação inteligente: se o flat está marcado como OCUPADO mas não possui contrato ativo, sincroniza para DISPONIVEL
    const now = new Date();
    for (const flat of flats) {
      if (flat.status !== "MANUTENCAO") {
        const activeContract = await prisma.contrato.findFirst({
          where: {
            flatId: flat.id,
            status: "ATIVO",
            dataEmissao: { lte: now },
            dataFinal: { gte: now },
          },
        });

        if (!activeContract && flat.status === "OCUPADO") {
          await prisma.flat.update({
            where: { id: flat.id },
            data: { status: "DISPONIVEL" },
          });
          flat.status = "DISPONIVEL";
        } else if (activeContract && flat.status === "DISPONIVEL") {
          await prisma.flat.update({
            where: { id: flat.id },
            data: { status: "OCUPADO" },
          });
          flat.status = "OCUPADO";
        }
      }
    }

    return NextResponse.json({ locais, flats });
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
      // Verificação Estrita de Limite de Plano
      const limitCheck = await checkLimit(session.empresaId, "properties", 1);
      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: limitCheck.message,
            code: "LIMIT_REACHED",
            limitKey: "properties",
            current: limitCheck.current,
            limit: limitCheck.limit,
            currentPlan: limitCheck.currentPlan,
            nextPlan: limitCheck.nextPlan,
          },
          { status: 403 }
        );
      }

      const {
        localId,
        numero,
        status,
        descricao,
        valorPadrao,
        valorDiaria,
        modalidadeLocacao,
        tipoImovel,
        fotosUrl,
        proprietarioId,
        taxaAdministracao,
      } = body;
      
      const localValido = await prisma.local.findFirst({
        where: { id: localId, empresaId: session.empresaId },
      });

      if (!localValido) {
        return NextResponse.json({ error: "Local/Condomínio não encontrado para esta empresa." }, { status: 404 });
      }

      const newFlat = await prisma.flat.create({
        data: {
          empresaId: session.empresaId,
          localId,
          proprietarioId: proprietarioId || null,
          taxaAdministracao:
            taxaAdministracao !== undefined && taxaAdministracao !== null
              ? parseFloat(String(taxaAdministracao))
              : 10.0,
          numero,
          tipoImovel: tipoImovel || "FLAT",
          modalidadeLocacao: modalidadeLocacao || "MENSAL",
          status: status || "DISPONIVEL",
          descricao,
          valorPadrao: valorPadrao !== undefined && valorPadrao !== null ? parseFloat(String(valorPadrao)) : 2500,
          valorDiaria: valorDiaria !== undefined && valorDiaria !== null ? parseFloat(String(valorDiaria)) : 0,
          fotosUrl: fotosUrl ? (typeof fotosUrl === "string" ? fotosUrl : JSON.stringify(fotosUrl)) : null,
        },
        include: {
          local: true,
          proprietario: true,
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
  const session = await getAuthSessionOrFallback();
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
      const {
        localId,
        numero,
        status,
        descricao,
        valorPadrao,
        valorDiaria,
        modalidadeLocacao,
        tipoImovel,
        fotosUrl,
        proprietarioId,
        taxaAdministracao,
      } = body;
      const updatedFlat = await prisma.flat.update({
        where: { id, empresaId: session.empresaId },
        data: {
          localId,
          proprietarioId: proprietarioId !== undefined ? (proprietarioId || null) : undefined,
          taxaAdministracao:
            taxaAdministracao !== undefined && taxaAdministracao !== null
              ? parseFloat(String(taxaAdministracao))
              : undefined,
          numero,
          tipoImovel: tipoImovel !== undefined ? tipoImovel : undefined,
          modalidadeLocacao: modalidadeLocacao !== undefined ? modalidadeLocacao : undefined,
          status,
          descricao,
          valorPadrao: valorPadrao !== undefined && valorPadrao !== null ? parseFloat(String(valorPadrao)) : undefined,
          valorDiaria: valorDiaria !== undefined && valorDiaria !== null ? parseFloat(String(valorDiaria)) : undefined,
          fotosUrl: fotosUrl !== undefined ? (typeof fotosUrl === "string" ? fotosUrl : JSON.stringify(fotosUrl)) : undefined,
        },
        include: {
          local: true,
          proprietario: true,
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
  const session = await getAuthSessionOrFallback();
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
