import { NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSessionOrFallback();
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

  // 3. CONTAS A RECEBER (Análise Abrangente)
  const todasContasReceber = await prisma.contaReceber.findMany({
    where: { empresaId },
    include: {
      locatario: true,
      contrato: { include: { flat: true } },
    },
  });

  let totalReceberMes = 0;
  let totalRecebidoMes = 0;
  let totalEmAbertoReceber = 0;

  todasContasReceber.forEach((c) => {
    const isPago = c.status === "PAGO";
    const dtVenc = new Date(c.dataVencimento);
    const dtPagto = c.dataPagamento ? new Date(c.dataPagamento) : null;
    const isVencNoMes = dtVenc >= primeiroDiaMes && dtVenc <= ultimoDiaMes;
    const isPagtoNoMes = dtPagto && dtPagto >= primeiroDiaMes && dtPagto <= ultimoDiaMes;

    if (isVencNoMes) {
      totalReceberMes += c.valor;
    }

    if (isPago && (isPagtoNoMes || isVencNoMes)) {
      totalRecebidoMes += (c.valorPago || c.valor);
    }

    if (!isPago && (c.status === "PENDENTE" || c.status === "ATRASADO" || dtVenc <= ultimoDiaMes)) {
      if (dtVenc <= ultimoDiaMes) {
        totalEmAbertoReceber += c.valor;
      }
    }
  });

  // 4. CONTAS A PAGAR (Análise Abrangente)
  const todasContasPagar = await prisma.contaPagar.findMany({
    where: { empresaId },
  });

  let totalPagarMes = 0;
  let totalPagoMes = 0;
  let totalEmAbertoPagar = 0;

  todasContasPagar.forEach((c) => {
    const isPago = c.status === "PAGO";
    const dtVenc = new Date(c.dataVencimento);
    const dtPagto = c.dataPagamento ? new Date(c.dataPagamento) : null;
    const isVencNoMes = dtVenc >= primeiroDiaMes && dtVenc <= ultimoDiaMes;
    const isPagtoNoMes = dtPagto && dtPagto >= primeiroDiaMes && dtPagto <= ultimoDiaMes;

    if (isVencNoMes) {
      totalPagarMes += c.valor;
    }

    if (isPago && (isPagtoNoMes || isVencNoMes)) {
      totalPagoMes += c.valor;
    }

    if (!isPago && (c.status === "PENDENTE" || c.status === "ATRASADO" || dtVenc <= ultimoDiaMes)) {
      if (dtVenc <= ultimoDiaMes) {
        totalEmAbertoPagar += c.valor;
      }
    }
  });

  const saldoOperacionalLiquido = totalRecebidoMes - totalPagoMes;

  // 5. Alertas Rápidos: Inadimplências em Aberto (status = ATRASADO OU Vencimento < Hoje e não PAGO)
  const inadimplencias = todasContasReceber
    .filter((c) => {
      if (c.status === "PAGO") return false;
      const dtVenc = new Date(c.dataVencimento);
      return c.status === "ATRASADO" || dtVenc < agora;
    })
    .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());

  // 6. Alertas Rápidos: Contratos Vencendo em até 30 Dias
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
      totalEmAbertoReceber,
      totalPagarMes,
      totalPagoMes,
      totalEmAbertoPagar,
      saldoOperacionalLiquido,
    },
    alertas: {
      inadimplencias,
      contratosVencendo,
    },
  });
}
