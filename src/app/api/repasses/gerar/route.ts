import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const mes = body.mes || new Date().toISOString().substring(0, 7); // Ex: "2026-09"

    // 1. Buscar parcelas de Contas a Receber do mês que tenham contrato e flat com proprietário
    const parcelas = await prisma.contaReceber.findMany({
      where: {
        empresaId: session.empresaId,
        mesReferencia: mes,
        numeroParcela: { not: 0 }, // Ignora depósito caução
        contrato: {
          flat: {
            proprietarioId: { not: null },
          },
        },
      },
      include: {
        contrato: {
          include: {
            flat: {
              include: {
                proprietario: true,
                local: true,
              },
            },
            locatario: true,
          },
        },
      },
    });

    // 2. Buscar também contratos ativos no mês cujo flat tenha proprietário (caso não haja contaReceber gerada para o mês)
    const [anoStr, mesStr] = mes.split("-");
    const ano = parseInt(anoStr, 10);
    const mesIdx = parseInt(mesStr, 10) - 1;
    const inicioMes = new Date(ano, mesIdx, 1);
    const fimMes = new Date(ano, mesIdx + 1, 0, 23, 59, 59);

    const contratosAtivos = await prisma.contrato.findMany({
      where: {
        empresaId: session.empresaId,
        status: "ATIVO",
        dataEmissao: { lte: fimMes },
        dataFinal: { gte: inicioMes },
        flat: {
          proprietarioId: { not: null },
        },
      },
      include: {
        flat: {
          include: {
            proprietario: true,
            local: true,
          },
        },
        locatario: true,
      },
    });

    let gerados = 0;
    let jaExistiam = 0;

    // Processar Contas a Receber encontradas
    for (const p of parcelas) {
      if (!p.contrato?.flat?.proprietarioId) continue;

      const flat = p.contrato.flat;
      const prop = flat.proprietario;
      if (!prop) continue;

      // Verificar se já existe repasse para esta parcela ou contrato no mês
      const existe = await prisma.repasseProprietario.findFirst({
        where: {
          empresaId: session.empresaId,
          mesReferencia: mes,
          OR: [
            { contaReceberId: p.id },
            { contratoId: p.contratoId, flatId: flat.id },
          ],
        },
      });

      if (existe) {
        jaExistiam++;
        continue;
      }

      // Cálculo Exato do Repasse
      const bruto = Number(p.valor || p.contrato.valorMensal || 0);
      const taxaPerc =
        flat.taxaAdministracao !== null && flat.taxaAdministracao !== undefined
          ? flat.taxaAdministracao
          : prop.taxaAdministracaoPadrao !== null && prop.taxaAdministracaoPadrao !== undefined
          ? prop.taxaAdministracaoPadrao
          : 10.0;

      const taxaValor = Number(((bruto * taxaPerc) / 100).toFixed(2));
      const liquido = Number((bruto - taxaValor).toFixed(2));

      await prisma.repasseProprietario.create({
        data: {
          empresaId: session.empresaId,
          proprietarioId: prop.id,
          flatId: flat.id,
          contratoId: p.contratoId,
          contaReceberId: p.id,
          mesReferencia: mes,
          valorBrutoAluguel: bruto,
          taxaAdminPercentual: taxaPerc,
          valorTaxaAdmin: taxaValor,
          valorDescontos: 0,
          valorLiquidoRepasse: liquido,
          dataVencimento: p.dataVencimento || new Date(ano, mesIdx, 10),
          status: "PENDENTE",
          formaPagamento: prop.tipoChavePix ? "PIX" : "PIX",
          observacoes: `Repasse gerado automaticamente • Aluguel Ref: ${mes}`,
        },
      });

      gerados++;
    }

    // Processar Contratos Ativos sem parcela vinculada
    for (const c of contratosAtivos) {
      if (!c.flat?.proprietarioId) continue;

      const flat = c.flat;
      const prop = flat.proprietario;
      if (!prop) continue;

      const existe = await prisma.repasseProprietario.findFirst({
        where: {
          empresaId: session.empresaId,
          contratoId: c.id,
          flatId: flat.id,
          mesReferencia: mes,
        },
      });

      if (existe) {
        jaExistiam++;
        continue;
      }

      const bruto = Number(c.valorMensal || flat.valorPadrao || 0);
      const taxaPerc =
        flat.taxaAdministracao !== null && flat.taxaAdministracao !== undefined
          ? flat.taxaAdministracao
          : prop.taxaAdministracaoPadrao !== null && prop.taxaAdministracaoPadrao !== undefined
          ? prop.taxaAdministracaoPadrao
          : 10.0;

      const taxaValor = Number(((bruto * taxaPerc) / 100).toFixed(2));
      const liquido = Number((bruto - taxaValor).toFixed(2));

      await prisma.repasseProprietario.create({
        data: {
          empresaId: session.empresaId,
          proprietarioId: prop.id,
          flatId: flat.id,
          contratoId: c.id,
          mesReferencia: mes,
          valorBrutoAluguel: bruto,
          taxaAdminPercentual: taxaPerc,
          valorTaxaAdmin: taxaValor,
          valorDescontos: 0,
          valorLiquidoRepasse: liquido,
          dataVencimento: new Date(ano, mesIdx, 10),
          status: "PENDENTE",
          formaPagamento: prop.tipoChavePix ? "PIX" : "PIX",
          observacoes: `Repasse gerado automaticamente com base no contrato ativo (${c.id.slice(0, 8)})`,
        },
      });

      gerados++;
    }

    return NextResponse.json({
      success: true,
      gerados,
      jaExistiam,
      message: `Processamento concluído: ${gerados} novo(s) repasse(s) gerado(s) para o mês ${mes}. (${jaExistiam} já existiam).`,
    });
  } catch (error: any) {
    console.error("Erro ao gerar repasses automáticos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
