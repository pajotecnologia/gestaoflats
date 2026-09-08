import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const ano = parseInt(searchParams.get("ano") || String(new Date().getFullYear()), 10);
    const mes = parseInt(searchParams.get("mes") || String(new Date().getMonth() + 1), 10);
    const flatId = searchParams.get("flatId");
    const localId = searchParams.get("localId");

    // Primeiro dia do mês (00:00:00) e último dia do mês (23:59:59)
    const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59, 999);

    // Buscar flats da empresa (filtrado por localId / flatId se informado)
    const flatsWhere: any = { empresaId: session.empresaId };
    if (flatId) flatsWhere.id = flatId;
    if (localId) flatsWhere.localId = localId;

    const [flats, locais, contratos] = await Promise.all([
      prisma.flat.findMany({
        where: flatsWhere,
        include: { local: true },
        orderBy: { numero: "asc" },
      }),
      prisma.local.findMany({
        where: { empresaId: session.empresaId },
        orderBy: { nome: "asc" },
      }),
      prisma.contrato.findMany({
        where: {
          empresaId: session.empresaId,
          status: { not: "CANCELADO" },
          ...(flatId ? { flatId } : {}),
          ...(localId ? { flat: { localId } } : {}),
          // Contrato ativo que intersecta o mês visualizado
          AND: [
            { dataEmissao: { lte: fimMes } },
            { dataFinal: { gte: inicioMes } },
          ],
        },
        include: {
          locatario: true,
          flat: { include: { local: true } },
          contasReceber: { orderBy: { numeroParcela: "asc" } },
        },
        orderBy: { dataEmissao: "asc" },
      }),
    ]);

    const reservas = contratos.map((c) => ({
      contratoId: c.id,
      flatId: c.flatId,
      flatNumero: c.flat.numero,
      localNome: c.flat.local.nome,
      locatarioId: c.locatarioId,
      locatarioNome: c.locatario.nome,
      locatarioTelefone: c.locatario.telefone,
      locatarioCpf: c.locatario.cpf,
      dataInicio: c.dataEmissao.toISOString().split("T")[0],
      dataFim: c.dataFinal.toISOString().split("T")[0],
      tipoValidade: c.tipoValidade,
      validadeDias: c.validadeDias,
      valorTotal: c.valorMensal,
      status: c.status,
      statusAssinatura: c.statusAssinatura,
      tokenAssinatura: c.tokenAssinatura,
      formaPagamento: c.formaPagamento,
    }));

    return NextResponse.json({
      ano,
      mes,
      flats,
      locais,
      reservas,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
