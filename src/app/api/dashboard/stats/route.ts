import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const empresaId = session.empresaId;
  const agora = new Date();
  const primeiroDiaMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const ultimoDiaMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);
  const limite30Dias = new Date(agora.getTime() + 30 * 86400000);

  // 1. Locatários Ativos (com pelo menos 1 contrato ativo)
  const totalLocatariosAtivos = await prisma.locatario.count({
    where: {
      empresaId,
      contratos: { some: { status: "ATIVO" } },
    },
  });

  // 2. Flats e Taxa de Ocupação
  const totalFlats = await prisma.flat.count({ where: { empresaId } });
  const flatsOcupados = await prisma.flat.count({ where: { empresaId, status: "OCUPADO" } });
  const flatsDisponiveis = await prisma.flat.count({ where: { empresaId, status: "DISPONIVEL" } });
  const flatsManutencao = await prisma.flat.count({ where: { empresaId, status: "MANUTENCAO" } });

  const taxaOcupacao = totalFlats > 0 ? Math.round((flatsOcupados / totalFlats) * 100) : 0;

  // 3. Receitas e Despesas do Mês Atual
  const contasReceberMes = await prisma.contaReceber.findMany({
    where: {
      empresaId,
      dataVencimento: { gte: primeiroDiaMes, lte: ultimoDiaMes },
    },
  });

  const contasPagarMes = await prisma.contaPagar.findMany({
    where: {
      empresaId,
      dataVencimento: { gte: primeiroDiaMes, lte: ultimoDiaMes },
    },
  });

  const totalReceberMes = contasReceberMes.reduce((acc, item) => acc + item.valor, 0);
  const totalRecebidoMes = contasReceberMes
    .filter((item) => item.status === "PAGO")
    .reduce((acc, item) => acc + (item.valorPago || item.valor), 0);

  const totalPagarMes = contasPagarMes.reduce((acc, item) => acc + item.valor, 0);
  const totalPagoMes = contasPagarMes
    .filter((item) => item.status === "PAGO")
    .reduce((acc, item) => acc + item.valor, 0);

  const saldoOperacionalLiquido = totalRecebidoMes - totalPagoMes;

  // 4. Alertas Rápidos: Inadimplências em Aberto
  const inadimplencias = await prisma.contaReceber.findMany({
    where: {
      empresaId,
      status: "ATRASADO",
    },
    include: {
      locatario: true,
      contrato: { include: { flat: true } },
    },
    orderBy: { dataVencimento: "asc" },
  });

  // 5. Alertas Rápidos: Contratos Vencendo em até 30 Dias
  const contratosVencendo = await prisma.contrato.findMany({
    where: {
      empresaId,
      status: "ATIVO",
      dataFinal: { gte: agora, lte: limite30Dias },
    },
    include: {
      locatario: true,
      flat: true,
    },
    orderBy: { dataFinal: "asc" },
  });

  return NextResponse.json({
    kpis: {
      totalLocatariosAtivos,
      totalFlats,
      flatsOcupados,
      flatsDisponiveis,
      flatsManutencao,
      taxaOcupacao,
      totalReceberMes,
      totalRecebidoMes,
      totalPagarMes,
      totalPagoMes,
      saldoOperacionalLiquido,
    },
    alertas: {
      inadimplencias,
      contratosVencendo,
    },
  });
}
