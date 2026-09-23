import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TYPES = ["ENTRADA", "SAIDA"] as const;
const STATUSES = ["RASCUNHO", "CONCLUIDA", "ASSINADA"] as const;

function parseItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item: any, index) => ({
    id: String(item.id || `item-${index + 1}`),
    categoria: String(item.categoria || "Geral"),
    item: String(item.item || "").trim(),
    estado: String(item.estado || "BOM"),
    observacao: String(item.observacao || ""),
    avaria: Boolean(item.avaria),
    valorDano: Math.max(0, Number(item.valorDano) || 0),
    fotoUrl: item.fotoUrl ? String(item.fotoUrl) : null,
  })).filter((item) => item.item);
}

export async function GET(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const flatId = searchParams.get("flatId") || undefined;
    const reservaId = searchParams.get("reservaId") || undefined;
    const tipoVistoria = searchParams.get("tipoVistoria") || undefined;

    const vistorias = await prisma.vistoriaChecklist.findMany({
      where: { empresaId: session.empresaId, flatId, reservaId, tipoVistoria },
      include: {
        flat: { include: { local: true } },
        locatario: true,
        reserva: true,
        modelo: true,
        contrato: true,
      },
      orderBy: { dataVistoria: "desc" },
    });

    return NextResponse.json({ vistorias });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao listar vistorias." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const body = await request.json();
    const {
      flatId, locatarioId, reservaId, contratoId, modeloId, tipoVistoria,
      responsavelVistoria, itens, fotos, observacaoGeral,
      limpezaStatus, manutencaoStatus, status = "RASCUNHO",
    } = body;

    if (!flatId || !responsavelVistoria || !tipoVistoria) {
      return NextResponse.json({ error: "Imóvel, responsável e tipo da vistoria são obrigatórios." }, { status: 400 });
    }
    if (!TYPES.includes(tipoVistoria)) return NextResponse.json({ error: "Tipo de vistoria inválido." }, { status: 400 });
    if (!STATUSES.includes(status)) return NextResponse.json({ error: "Status inválido." }, { status: 400 });

    const flat = await prisma.flat.findFirst({ where: { id: flatId, empresaId: session.empresaId } });
    if (!flat) return NextResponse.json({ error: "Imóvel não encontrado." }, { status: 404 });

    if (locatarioId) {
      const loc = await prisma.locatario.findFirst({ where: { id: locatarioId, empresaId: session.empresaId } });
      if (!loc) return NextResponse.json({ error: "Locatário não encontrado." }, { status: 404 });
    }
    if (reservaId) {
      const reserva = await prisma.reserva.findFirst({ where: { id: reservaId, empresaId: session.empresaId, flatId } });
      if (!reserva) return NextResponse.json({ error: "Reserva não encontrada para este imóvel." }, { status: 404 });
    }
    if (contratoId) {
      const contrato = await prisma.contrato.findFirst({ where: { id: contratoId, empresaId: session.empresaId, flatId } });
      if (!contrato) return NextResponse.json({ error: "Contrato não encontrado para este imóvel." }, { status: 404 });
    }

    let modelo = null;
    if (modeloId) modelo = await prisma.checklistModelo.findFirst({ where: { id: modeloId, empresaId: session.empresaId } });

    const sourceItems = Array.isArray(itens) ? itens : (modelo?.itensJson ? JSON.parse(modelo.itensJson) : []);
    const parsedItems = parseItems(sourceItems);
    const valorDanos = parsedItems.reduce((sum, item) => sum + (item.avaria ? item.valorDano : 0), 0);

    const vistoria = await prisma.vistoriaChecklist.create({
      data: {
        empresaId: session.empresaId,
        flatId,
        locatarioId: locatarioId || null,
        reservaId: reservaId || null,
        contratoId: contratoId || null,
        modeloId: modelo?.id || null,
        tipoVistoria,
        responsavelVistoria,
        itensJson: JSON.stringify(parsedItems),
        fotosJson: JSON.stringify(Array.isArray(fotos) ? fotos : []),
        observacaoGeral: observacaoGeral || null,
        valorDanos,
        limpezaStatus: limpezaStatus || "PENDENTE",
        manutencaoStatus: manutencaoStatus || "PENDENTE",
        status,
        tokenAssinatura: crypto.randomUUID(),
      },
      include: { flat: { include: { local: true } }, locatario: true, reserva: true, modelo: true },
    });

    return NextResponse.json({ vistoria }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao criar vistoria." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const body = await request.json();
    const { id, acao, ...changes } = body;
    if (!id) return NextResponse.json({ error: "ID da vistoria é obrigatório." }, { status: 400 });

    const current = await prisma.vistoriaChecklist.findFirst({ where: { id, empresaId: session.empresaId } });
    if (!current) return NextResponse.json({ error: "Vistoria não encontrada." }, { status: 404 });

    if (acao === "COBRAR_DANOS") {
      if (!current.locatarioId || current.valorDanos <= 0) {
        return NextResponse.json({ error: "A vistoria precisa ter locatário e valor de danos maior que zero." }, { status: 400 });
      }
      if (current.cobrancaDanosGerada) {
        return NextResponse.json({ error: "A cobrança dos danos desta vistoria já foi gerada." }, { status: 409 });
      }
      await prisma.contaReceber.create({
        data: {
          empresaId: session.empresaId,
          locatarioId: current.locatarioId,
          mesReferencia: new Date().toISOString().slice(0, 7),
          numeroParcela: 1,
          valor: current.valorDanos,
          dataVencimento: new Date(),
          status: "PENDENTE",
          observacao: `Cobrança de danos — vistoria ${current.id} — Flat ${current.flatId}`,
        },
      });
      const vistoriaCobrada = await prisma.vistoriaChecklist.update({
        where: { id },
        data: { cobrancaDanosGerada: true, dataCobrancaDanos: new Date() },
        include: { flat: { include: { local: true } }, locatario: true, reserva: true, modelo: true },
      });
      return NextResponse.json({ vistoria: vistoriaCobrada, cobrancaGerada: true });
    }

    const data: any = {};
    if (changes.itens) {
      const parsedItems = parseItems(changes.itens);
      data.itensJson = JSON.stringify(parsedItems);
      data.valorDanos = parsedItems.reduce((sum, item) => sum + (item.avaria ? item.valorDano : 0), 0);
    }
    if (changes.fotos) data.fotosJson = JSON.stringify(Array.isArray(changes.fotos) ? changes.fotos : []);
    for (const field of ["observacaoGeral", "limpezaStatus", "manutencaoStatus", "responsavelVistoria", "tipoVistoria", "status", "laudoImpressoUrl"]) {
      if (changes[field] !== undefined) data[field] = changes[field];
    }
    if (changes.status === "ASSINADA") data.statusAssinatura = "ASSINADO";

    const vistoria = await prisma.vistoriaChecklist.update({
      where: { id },
      data,
      include: { flat: { include: { local: true } }, locatario: true, reserva: true, modelo: true },
    });
    return NextResponse.json({ vistoria });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar vistoria." }, { status: 500 });
  }
}
