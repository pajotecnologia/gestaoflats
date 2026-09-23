import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const sp = new URL(request.url).searchParams;
    const inicio = sp.get("inicio");
    const fim = sp.get("fim");

    const hoje = new Date();
    const start = inicio
      ? new Date(inicio)
      : new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
    const end = fim
      ? new Date(fim + "T23:59:59")
      : new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

    // Atualiza para ATRASADO apenas as contas que estão PENDENTE e já passaram do vencimento
    await prisma.contaReceber.updateMany({
      where: {
        empresaId: session.empresaId,
        status: { in: ["PENDENTE", "PARCIAL"] },
        dataVencimento: { lt: hoje },
      },
      data: { status: "ATRASADO" },
    });

    await prisma.contaPagar.updateMany({
      where: {
        empresaId: session.empresaId,
        status: { in: ["PENDENTE", "PARCIAL"] },
        dataVencimento: { lt: hoje },
      },
      data: { status: "ATRASADO" },
    });

    const [receber, pagar] = await Promise.all([
      prisma.contaReceber.findMany({
        where: {
          empresaId: session.empresaId,
          dataVencimento: { gte: start, lte: end },
        },
        include: {
          locatario: true,
          contrato: { include: { flat: true } },
        },
        orderBy: { dataVencimento: "asc" },
      }),
      prisma.contaPagar.findMany({
        where: {
          empresaId: session.empresaId,
          dataVencimento: { gte: start, lte: end },
        },
        include: {
          fornecedor: true,
          flat: true,
          local: true,
        },
        orderBy: { dataVencimento: "asc" },
      }),
    ]);

    // Cálculo exato de Recebimentos Realizados
    const recebimentos = receber
      .filter((x) => x.status === "PAGO" || (x.status === "PARCIAL" && Number(x.valorPago || 0) > 0))
      .reduce((a, x) => {
        const vp = x.valorPago !== null && x.valorPago !== undefined && Number(x.valorPago) > 0
          ? Number(x.valorPago)
          : x.status === "PAGO"
          ? Number(x.valor || 0)
          : 0;
        return a + vp;
      }, 0);

    // Cálculo exato de Pagamentos Realizados
    const pagamentos = pagar
      .filter((x) => x.status === "PAGO" || (x.status === "PARCIAL" && Number(x.valorPago || 0) > 0))
      .reduce((a, x) => {
        const vp = x.valorPago !== null && x.valorPago !== undefined && Number(x.valorPago) > 0
          ? Number(x.valorPago)
          : x.status === "PAGO"
          ? Number(x.valor || 0)
          : 0;
        return a + vp;
      }, 0);

    // Cálculo exato de Valores em Aberto (A Receber e A Pagar) - NUNCA soma contas PAGO ou CANCELADO
    const abertoReceber = receber
      .filter((x) => x.status !== "PAGO" && x.status !== "CANCELADO")
      .reduce((a, x) => {
        const saldoRestante = Math.max(0, Number(x.valor || 0) - Number(x.valorPago || 0));
        return a + saldoRestante;
      }, 0);

    const abertoPagar = pagar
      .filter((x) => x.status !== "PAGO" && x.status !== "CANCELADO")
      .reduce((a, x) => {
        const saldoRestante = Math.max(0, Number(x.valor || 0) - Number(x.valorPago || 0));
        return a + saldoRestante;
      }, 0);

    // Inadimplência (contas vencidas não pagas)
    const inadimplenteReceber = receber
      .filter((x) => x.status === "ATRASADO")
      .reduce((a, x) => a + Math.max(0, Number(x.valor || 0) - Number(x.valorPago || 0)), 0);

    const atrasadoPagar = pagar
      .filter((x) => x.status === "ATRASADO")
      .reduce((a, x) => a + Math.max(0, Number(x.valor || 0) - Number(x.valorPago || 0)), 0);

    // Gráfico mensal previsto x realizado
    const porMes = new Map<
      string,
      {
        mes: string;
        previstoReceber: number;
        recebido: number;
        previstoPagar: number;
        pago: number;
        saldo: number;
      }
    >();

    const add = (
      date: Date,
      key: "previstoReceber" | "recebido" | "previstoPagar" | "pago",
      value: number
    ) => {
      const mes = date.toISOString().slice(0, 7);
      const item = porMes.get(mes) || {
        mes,
        previstoReceber: 0,
        recebido: 0,
        previstoPagar: 0,
        pago: 0,
        saldo: 0,
      };
      (item as any)[key] = ((item as any)[key] || 0) + value;
      item.saldo = item.recebido - item.pago;
      porMes.set(mes, item);
    };

    receber.forEach((x) => {
      add(new Date(x.dataVencimento), "previstoReceber", Number(x.valor || 0));
      if (x.status === "PAGO" || x.status === "PARCIAL") {
        const v =
          x.valorPago !== null && x.valorPago !== undefined && Number(x.valorPago) > 0
            ? Number(x.valorPago)
            : x.status === "PAGO"
            ? Number(x.valor || 0)
            : 0;
        add(new Date(x.dataPagamento || x.dataVencimento), "recebido", v);
      }
    });

    pagar.forEach((x) => {
      add(new Date(x.dataVencimento), "previstoPagar", Number(x.valor || 0));
      if (x.status === "PAGO" || x.status === "PARCIAL") {
        const v =
          x.valorPago !== null && x.valorPago !== undefined && Number(x.valorPago) > 0
            ? Number(x.valorPago)
            : x.status === "PAGO"
            ? Number(x.valor || 0)
            : 0;
        add(new Date(x.dataPagamento || x.dataVencimento), "pago", v);
      }
    });

    return NextResponse.json({
      kpis: {
        recebimentos,
        pagamentos,
        saldo: recebimentos - pagamentos,
        abertoReceber,
        abertoPagar,
        inadimplenteReceber,
        atrasadoPagar,
      },
      meses: Array.from(porMes.values()).sort((a, b) => a.mes.localeCompare(b.mes)),
      receber,
      pagar,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
