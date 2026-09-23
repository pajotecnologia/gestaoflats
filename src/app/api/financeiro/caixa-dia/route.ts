import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const sp = new URL(request.url).searchParams;
    const dataStr = sp.get("data") || new Date().toISOString().split("T")[0];

    // Início e fim do dia selecionado (00:00:00 até 23:59:59)
    const [ano, mes, dia] = dataStr.split("-").map(Number);
    const startOfDay = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
    const endOfDay = new Date(ano, mes - 1, dia, 23, 59, 59, 999);

    // 1. Entradas recebidas no dia
    const contasRecebidas = await prisma.contaReceber.findMany({
      where: {
        empresaId: session.empresaId,
        status: { in: ["PAGO", "PARCIAL"] },
        dataPagamento: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        locatario: { select: { id: true, nome: true, cpf: true, telefone: true } },
        contrato: {
          include: {
            flat: {
              include: { local: true },
            },
          },
        },
      },
      orderBy: { dataPagamento: "desc" },
    });

    // 2. Saídas pagas no dia (incluindo despesas de Ordens de Serviço)
    const contasPagas = await prisma.contaPagar.findMany({
      where: {
        empresaId: session.empresaId,
        status: { in: ["PAGO", "PARCIAL"] },
        dataPagamento: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        fornecedor: true,
        flat: { include: { local: true } },
        local: true,
        ordensServico: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
            categoria: true,
            responsavel: true,
          },
        },
      },
      orderBy: { dataPagamento: "desc" },
    });

    const totalEntradas = contasRecebidas.reduce((acc, c) => acc + Number(c.valorPago || c.valor || 0), 0);
    const totalSaidas = contasPagas.reduce((acc, c) => acc + Number(c.valorPago || c.valor || 0), 0);
    const saldoDia = totalEntradas - totalSaidas;

    // Totais por Forma de Pagamento
    const formasEntrada: Record<string, number> = {};
    for (const c of contasRecebidas) {
      const forma = c.formaPagamento || "PIX / Bolepix";
      formasEntrada[forma] = (formasEntrada[forma] || 0) + Number(c.valorPago || c.valor || 0);
    }

    const formasSaida: Record<string, number> = {};
    for (const c of contasPagas) {
      const forma = c.formaPagamento || "NÃO INFORMADO";
      formasSaida[forma] = (formasSaida[forma] || 0) + Number(c.valorPago || c.valor || 0);
    }

    return NextResponse.json({
      dataReferencia: dataStr,
      totalEntradas,
      totalSaidas,
      saldoDia,
      quantidadeEntradas: contasRecebidas.length,
      quantidadeSaidas: contasPagas.length,
      entradas: contasRecebidas.map((c) => ({
        id: c.id,
        tipo: "ENTRADA",
        descricao: `Aluguel Ref: ${c.mesReferencia || "Mensalidade"} (Parcela ${c.numeroParcela || 1})`,
        locatario: c.locatario?.nome || "Locatário",
        imovel: c.contrato?.flat?.numero ? `Flat ${c.contrato.flat.numero}` : "Imóvel",
        local: c.contrato?.flat?.local?.nome || null,
        valor: Number(c.valorPago || c.valor || 0),
        formaPagamento: c.formaPagamento || "PIX",
        dataPagamento: c.dataPagamento,
        comprovanteUrl: c.bancoInterPdfUrl || null,
      })),
      saidas: contasPagas.map((c) => {
        const osVinculada = c.ordensServico?.[0];
        return {
          id: c.id,
          tipo: "SAIDA",
          origem: osVinculada ? "ORDEM_SERVICO" : "DESPESA_GERAL",
          osCodigo: osVinculada?.codigo || null,
          osTitulo: osVinculada?.titulo || null,
          descricao: c.descricao,
          fornecedor: c.fornecedor?.razaoSocial || null,
          imovel: c.flat?.numero ? `Flat ${c.flat.numero}` : null,
          local: c.local?.nome || c.flat?.local?.nome || null,
          valor: Number(c.valorPago || c.valor || 0),
          formaPagamento: c.formaPagamento || "Dinheiro / PIX",
          dataPagamento: c.dataPagamento,
        };
      }),
      formasEntrada,
      formasSaida,
    });
  } catch (error: any) {
    console.error("Erro ao carregar caixa do dia:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
