import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RESERVATION_STATUSES = [
  "SOLICITADA",
  "PRE_RESERVA",
  "AGUARDANDO_PAGAMENTO",
  "CONFIRMADA",
  "CHECK_IN",
  "EM_ESTADIA",
  "CHECK_OUT",
  "FINALIZADA",
  "CANCELADA",
] as const;

function toDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function hasConflict(
  empresaId: string,
  flatId: string,
  dataEntrada: Date,
  dataSaida: Date,
  ignoreId?: string
) {
  return prisma.reserva.findFirst({
    where: {
      empresaId,
      flatId,
      ...(ignoreId ? { id: { not: ignoreId } } : {}),
      status: { not: "CANCELADA" },
      dataEntrada: { lt: dataSaida },
      dataSaida: { gt: dataEntrada },
    },
    include: { locatario: true, flat: true },
  });
}

export async function GET(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const from = toDate(searchParams.get("from") || "");
    const to = toDate(searchParams.get("to") || "");

    const reservas = await prisma.reserva.findMany({
      where: {
        empresaId: session.empresaId,
        ...(from && to
          ? { dataEntrada: { lt: to }, dataSaida: { gt: from } }
          : {}),
      },
      include: {
        locatario: { select: { id: true, nome: true, telefone: true } },
        flat: { select: { id: true, numero: true, local: { select: { nome: true } } } },
      },
      orderBy: [{ dataEntrada: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ reservas });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const body = await request.json();
    const {
      locatarioId,
      flatId,
      dataEntrada,
      dataSaida,
      horaEntrada,
      horaSaida,
      quantidadePessoas = 1,
      valorDiaria = 0,
      desconto = 0,
      taxas = 0,
      caucao = 0,
      valorRecebido = 0,
      origem,
      observacao,
      status = "SOLICITADA",
    } = body;

    if (!locatarioId || !flatId || !dataEntrada || !dataSaida) {
      return NextResponse.json({ error: "Locatário, imóvel, entrada e saída são obrigatórios." }, { status: 400 });
    }

    if (!RESERVATION_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Status de reserva inválido." }, { status: 400 });
    }

    const entrada = toDate(dataEntrada);
    const saida = toDate(dataSaida);
    if (!entrada || !saida || saida <= entrada) {
      return NextResponse.json({ error: "O período informado é inválido." }, { status: 400 });
    }

    const [locatario, flat] = await Promise.all([
      prisma.locatario.findFirst({ where: { id: locatarioId, empresaId: session.empresaId } }),
      prisma.flat.findFirst({ where: { id: flatId, empresaId: session.empresaId } }),
    ]);

    if (!locatario) return NextResponse.json({ error: "Locatário não encontrado." }, { status: 404 });
    if (!flat) return NextResponse.json({ error: "Imóvel não encontrado." }, { status: 404 });
    if (flat.status === "MANUTENCAO") {
      return NextResponse.json({ error: "Este imóvel está em manutenção." }, { status: 409 });
    }

    const conflito = await hasConflict(session.empresaId, flatId, entrada, saida);
    if (conflito) {
      return NextResponse.json(
        { error: `Já existe uma reserva para este imóvel no período informado (${conflito.dataEntrada.toLocaleDateString("pt-BR")} a ${conflito.dataSaida.toLocaleDateString("pt-BR")}).` },
        { status: 409 }
      );
    }

    const quantidadeDiarias = Math.max(1, Math.ceil((saida.getTime() - entrada.getTime()) / 86400000));
    const diaria = Number(valorDiaria) || Number(flat.valorPadrao) || 0;
    const total = Math.max(0, diaria * quantidadeDiarias - (Number(desconto) || 0) + (Number(taxas) || 0) + (Number(caucao) || 0));
    const recebido = Math.max(0, Number(valorRecebido) || 0);

    const reserva = await prisma.reserva.create({
      data: {
        empresaId: session.empresaId,
        locatarioId,
        flatId,
        codigo: `RES-${Date.now().toString(36).toUpperCase()}`,
        dataEntrada: entrada,
        dataSaida: saida,
        horaEntrada: horaEntrada || null,
        horaSaida: horaSaida || null,
        quantidadePessoas: Math.max(1, Number(quantidadePessoas) || 1),
        valorDiaria: diaria,
        quantidadeDiarias,
        desconto: Number(desconto) || 0,
        taxas: Number(taxas) || 0,
        caucao: Number(caucao) || 0,
        valorTotal: total,
        valorRecebido: recebido,
        valorPendente: Math.max(0, total - recebido),
        origem: origem || null,
        observacao: observacao || null,
        status,
      },
      include: { locatario: true, flat: { include: { local: true } } },
    });

    return NextResponse.json({ reserva }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const body = await request.json();
    const { id, status, ...changes } = body;
    if (!id) return NextResponse.json({ error: "ID da reserva é obrigatório." }, { status: 400 });

    const atual = await prisma.reserva.findFirst({ where: { id, empresaId: session.empresaId } });
    if (!atual) return NextResponse.json({ error: "Reserva não encontrada." }, { status: 404 });

    if (status && !RESERVATION_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Status de reserva inválido." }, { status: 400 });
    }

    const entrada = changes.dataEntrada ? toDate(changes.dataEntrada) : atual.dataEntrada;
    const saida = changes.dataSaida ? toDate(changes.dataSaida) : atual.dataSaida;
    const flatId = changes.flatId || atual.flatId;

    if (!entrada || !saida || saida <= entrada) {
      return NextResponse.json({ error: "O período informado é inválido." }, { status: 400 });
    }

    const conflito = await hasConflict(session.empresaId, flatId, entrada, saida, id);
    if (conflito) return NextResponse.json({ error: "O novo período conflita com outra reserva deste imóvel." }, { status: 409 });

    const data: any = {};
    if (changes.locatarioId) data.locatarioId = changes.locatarioId;
    if (changes.flatId) data.flatId = changes.flatId;
    if (changes.dataEntrada) data.dataEntrada = entrada;
    if (changes.dataSaida) data.dataSaida = saida;
    if (status) data.status = status;
    if (status === "CHECK_IN" && !atual.dataCheckIn) data.dataCheckIn = new Date();
    if (status === "CHECK_OUT" && !atual.dataCheckOut) data.dataCheckOut = new Date();

    const reserva = await prisma.reserva.update({
      where: { id },
      data,
      include: { locatario: true, flat: { include: { local: true } } },
    });

    return NextResponse.json({ reserva });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
