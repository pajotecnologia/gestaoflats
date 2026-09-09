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
  const anoAtual = agora.getFullYear();
  const mesAtual = agora.getMonth();

  const primeiroDiaMes = new Date(anoAtual, mesAtual, 1, 0, 0, 0, 0);
  const ultimoDiaMes = new Date(anoAtual, mesAtual + 1, 0, 23, 59, 59, 999);
  const limite30Dias = new Date(agora.getTime() + 30 * 86400000);
  const limite60Dias = new Date(agora.getTime() + 60 * 86400000);

  // 1. Locatários, Proprietários e Locais
  const [
    totalLocatarios,
    totalLocatariosAtivos,
    totalProprietarios,
    totalLocais,
    todosLocais,
  ] = await Promise.all([
    prisma.locatario.count({ where: { empresaId } }),
    prisma.locatario.count({
      where: {
        empresaId,
        contratos: { some: { status: "ATIVO" } },
      },
    }),
    prisma.proprietario.count({ where: { empresaId } }),
    prisma.local.count({ where: { empresaId } }),
    prisma.local.findMany({
      where: { empresaId },
      include: {
        flats: {
          include: {
            contratos: {
              where: { status: "ATIVO" },
              select: { valorMensal: true },
            },
          },
        },
      },
      orderBy: { nome: "asc" },
    }),
  ]);

  // 2. Flats e Ocupação
  const todosFlats = await prisma.flat.findMany({
    where: { empresaId },
    include: { local: true, proprietario: true },
  });

  const totalFlats = todosFlats.length;
  const flatsOcupados = todosFlats.filter((f) => f.status === "OCUPADO").length;
  const flatsDisponiveis = todosFlats.filter((f) => f.status === "DISPONIVEL").length;
  const flatsManutencao = todosFlats.filter((f) => f.status === "MANUTENCAO").length;
  const taxaOcupacao = totalFlats > 0 ? Math.round((flatsOcupados / totalFlats) * 100) : 0;

  const flatsMensal = todosFlats.filter((f) => f.modalidadeLocacao === "MENSAL").length;
  const flatsDiaria = todosFlats.filter((f) => f.modalidadeLocacao === "DIARIA").length;
  const flatsAmbos = todosFlats.filter((f) => f.modalidadeLocacao === "AMBOS").length;

  // 3. Contratos
  const todosContratos = await prisma.contrato.findMany({
    where: { empresaId },
    include: {
      locatario: true,
      flat: { include: { local: true } },
    },
    orderBy: { dataEmissao: "desc" },
  });

  const contratosAtivos = todosContratos.filter((c) => c.status === "ATIVO");
  const contratosFinalizados = todosContratos.filter((c) => c.status === "FINALIZADO");
  const totalCaucaoCustodia = contratosAtivos.reduce((acc, c) => acc + (c.valorCaucao || 0), 0);

  // 4. Contas a Receber
  const todasContasReceber = await prisma.contaReceber.findMany({
    where: { empresaId },
    include: {
      locatario: true,
      contrato: { include: { flat: { include: { local: true } } } },
    },
    orderBy: { dataVencimento: "asc" },
  });

  let totalReceberMes = 0;
  let totalRecebidoMes = 0;
  let totalEmAbertoReceber = 0;
  let totalInadimplenteGeral = 0;

  const formasPagamentoMap: Record<string, { total: number; qtd: number }> = {};

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
      const vlr = c.valorPago || c.valor;
      totalRecebidoMes += vlr;

      const forma = (c.formaPagamento || "PIX").toUpperCase();
      if (!formasPagamentoMap[forma]) {
        formasPagamentoMap[forma] = { total: 0, qtd: 0 };
      }
      formasPagamentoMap[forma].total += vlr;
      formasPagamentoMap[forma].qtd += 1;
    }

    if (!isPago && isVencNoMes) {
      totalEmAbertoReceber += c.valor;
    }

    if (!isPago && (c.status === "ATRASADO" || dtVenc < agora)) {
      totalInadimplenteGeral += c.valor;
    }
  });

  const taxaEficienciaCobranca =
    totalReceberMes > 0 ? Math.min(100, Math.round((totalRecebidoMes / totalReceberMes) * 100)) : 100;
  const taxaInadimplencia =
    totalReceberMes > 0 ? Math.min(100, Math.round((totalEmAbertoReceber / totalReceberMes) * 100)) : 0;

  // Formas de Pagamento formatadas
  const totalFormasValor = Object.values(formasPagamentoMap).reduce((acc, f) => acc + f.total, 0);
  const formasPagamento = Object.entries(formasPagamentoMap).map(([forma, data]) => ({
    forma,
    total: data.total,
    qtd: data.qtd,
    percentual: totalFormasValor > 0 ? Math.round((data.total / totalFormasValor) * 100) : 0,
  })).sort((a, b) => b.total - a.total);

  // 5. Contas a Pagar
  const todasContasPagar = await prisma.contaPagar.findMany({
    where: { empresaId },
    include: { fornecedor: true, local: true, flat: true },
    orderBy: { dataVencimento: "asc" },
  });

  let totalPagarMes = 0;
  let totalPagoMes = 0;
  let totalEmAbertoPagar = 0;
  const despesasCategoriasMap: Record<string, number> = {};

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
      const cat = c.fornecedor?.razaoSocial || c.local?.nome || "Despesas Gerais";
      despesasCategoriasMap[cat] = (despesasCategoriasMap[cat] || 0) + c.valor;
    }

    if (!isPago && isVencNoMes) {
      totalEmAbertoPagar += c.valor;
    }
  });

  const despesasCategorias = Object.entries(despesasCategoriasMap).map(([categoria, total]) => ({
    categoria,
    total,
    percentual: totalPagoMes > 0 ? Math.round((total / totalPagoMes) * 100) : 0,
  })).sort((a, b) => b.total - a.total);

  const saldoOperacionalLiquido = totalRecebidoMes - totalPagoMes;
  const margemLucro = totalRecebidoMes > 0 ? Math.round((saldoOperacionalLiquido / totalRecebidoMes) * 100) : 0;

  // 6. Repasses a Proprietários
  const mesRefAtual = `${anoAtual}-${String(mesAtual + 1).padStart(2, "0")}`;
  const repassesDoMes = await prisma.repasseProprietario.findMany({
    where: { empresaId, mesReferencia: mesRefAtual },
    include: {
      proprietario: true,
      flat: { include: { local: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  let totalRepassesLiquidoMes = 0;
  let totalRepassesPagosMes = 0;
  let totalRepassesPendentesMes = 0;
  let totalComissaoImobiliariaMes = 0;

  repassesDoMes.forEach((r) => {
    totalRepassesLiquidoMes += r.valorLiquidoRepasse;
    totalComissaoImobiliariaMes += r.valorTaxaAdmin;
    if (r.status === "PAGO") {
      totalRepassesPagosMes += r.valorLiquidoRepasse;
    } else {
      totalRepassesPendentesMes += r.valorLiquidoRepasse;
    }
  });

  // 7. Vistorias e Checklists
  const todasVistorias = await prisma.vistoriaChecklist.findMany({
    where: { empresaId },
    include: { flat: { include: { local: true } }, locatario: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const totalVistoriasEntrada = await prisma.vistoriaChecklist.count({
    where: { empresaId, tipoVistoria: "ENTRADA" },
  });
  const totalVistoriasSaida = await prisma.vistoriaChecklist.count({
    where: { empresaId, tipoVistoria: "SAIDA" },
  });

  // 8. Performance por Local / Empreendimento
  const locaisPerformance = todosLocais.map((loc) => {
    const fTotal = loc.flats.length;
    const fOcupados = loc.flats.filter((f) => f.status === "OCUPADO").length;
    const fDisponiveis = loc.flats.filter((f) => f.status === "DISPONIVEL").length;
    const fManutencao = loc.flats.filter((f) => f.status === "MANUTENCAO").length;
    const taxa = fTotal > 0 ? Math.round((fOcupados / fTotal) * 100) : 0;
    const receitaEst = loc.flats.reduce((acc, f) => {
      const c = f.contratos[0];
      return acc + (c ? c.valorMensal : 0);
    }, 0);

    return {
      id: loc.id,
      nome: loc.nome,
      endereco: loc.endereco,
      totalFlats: fTotal,
      flatsOcupados: fOcupados,
      flatsDisponiveis: fDisponiveis,
      flatsManutencao: fManutencao,
      taxaOcupacao: taxa,
      receitaEstimada: receitaEst,
    };
  }).sort((a, b) => b.totalFlats - a.totalFlats);

  // 9. Histórico Financeiro dos Últimos 6 Meses
  const historicoSemestral = [];
  const nomesMeses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  for (let i = 5; i >= 0; i--) {
    const dataH = new Date(anoAtual, mesAtual - i, 1);
    const anoH = dataH.getFullYear();
    const mesH = dataH.getMonth();
    const iniH = new Date(anoH, mesH, 1, 0, 0, 0, 0);
    const fimH = new Date(anoH, mesH + 1, 0, 23, 59, 59, 999);
    const mesRefH = `${anoH}-${String(mesH + 1).padStart(2, "0")}`;

    let recH = 0;
    todasContasReceber.forEach((c) => {
      if (c.status === "PAGO") {
        const dtP = c.dataPagamento ? new Date(c.dataPagamento) : new Date(c.dataVencimento);
        if (dtP >= iniH && dtP <= fimH) {
          recH += (c.valorPago || c.valor);
        }
      }
    });

    let pagH = 0;
    todasContasPagar.forEach((c) => {
      if (c.status === "PAGO") {
        const dtP = c.dataPagamento ? new Date(c.dataPagamento) : new Date(c.dataVencimento);
        if (dtP >= iniH && dtP <= fimH) {
          pagH += c.valor;
        }
      }
    });

    const contratosNovosCount = todosContratos.filter((c) => {
      const dtE = new Date(c.dataEmissao);
      return dtE >= iniH && dtE <= fimH;
    }).length;

    historicoSemestral.push({
      mes: mesRefH,
      label: `${nomesMeses[mesH]}/${String(anoH).slice(-2)}`,
      receitas: Math.round(recH * 100) / 100,
      despesas: Math.round(pagH * 100) / 100,
      lucroLiquido: Math.round((recH - pagH) * 100) / 100,
      novosContratos: contratosNovosCount,
    });
  }

  // 10. Alertas & Listagens Operacionais
  // Inadimplências
  const inadimplencias = todasContasReceber
    .filter((c) => {
      if (c.status === "PAGO") return false;
      const dtVenc = new Date(c.dataVencimento);
      return c.status === "ATRASADO" || dtVenc < agora;
    })
    .map((c) => {
      const dtVenc = new Date(c.dataVencimento);
      const diffMs = agora.getTime() - dtVenc.getTime();
      const diasAtraso = Math.max(1, Math.floor(diffMs / 86400000));
      return {
        id: c.id,
        locatarioId: c.locatarioId,
        locatarioNome: c.locatario.nome,
        locatarioTelefone: c.locatario.telefone,
        locatarioEmail: c.locatario.email,
        flatNumero: c.contrato?.flat?.numero || "Unidade",
        localNome: c.contrato?.flat?.local?.nome || "Condomínio",
        mesReferencia: c.mesReferencia,
        numeroParcela: c.numeroParcela,
        valor: c.valor,
        dataVencimento: c.dataVencimento,
        diasAtraso,
      };
    })
    .sort((a, b) => b.diasAtraso - a.diasAtraso);

  // Contratos Vencendo (30 a 60 dias)
  const contratosVencendo = contratosAtivos
    .filter((c) => {
      const dtF = new Date(c.dataFinal);
      return dtF >= agora && dtF <= limite60Dias;
    })
    .map((c) => {
      const dtF = new Date(c.dataFinal);
      const diffMs = dtF.getTime() - agora.getTime();
      const diasRestantes = Math.max(0, Math.ceil(diffMs / 86400000));
      return {
        id: c.id,
        locatarioId: c.locatarioId,
        locatarioNome: c.locatario.nome,
        locatarioTelefone: c.locatario.telefone,
        flatId: c.flatId,
        flatNumero: c.flat.numero,
        localNome: c.flat.local?.nome || "Condomínio",
        tipoValidade: c.tipoValidade,
        valorMensal: c.valorMensal,
        dataEmissao: c.dataEmissao,
        dataFinal: c.dataFinal,
        diasRestantes,
      };
    })
    .sort((a, b) => a.diasRestantes - b.diasRestantes);

  // Diárias de Hoje e Próximos Dias (Temporada / Agenda)
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0, 0);
  const fim3Dias = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 3, 23, 59, 59, 999);

  const diariasProximas = contratosAtivos
    .filter((c) => {
      if (c.tipoValidade !== "DIAS") return false;
      const dtIn = new Date(c.dataEmissao);
      const dtOut = new Date(c.dataFinal);
      return (dtIn >= inicioHoje && dtIn <= fim3Dias) || (dtOut >= inicioHoje && dtOut <= fim3Dias);
    })
    .map((c) => {
      const dtIn = new Date(c.dataEmissao);
      const dtOut = new Date(c.dataFinal);
      const isCheckInHoje = dtIn.toDateString() === agora.toDateString();
      const isCheckOutHoje = dtOut.toDateString() === agora.toDateString();

      return {
        id: c.id,
        locatarioNome: c.locatario.nome,
        locatarioTelefone: c.locatario.telefone,
        flatNumero: c.flat.numero,
        localNome: c.flat.local?.nome || "Condomínio",
        dataCheckIn: c.dataEmissao,
        dataCheckOut: c.dataFinal,
        dias: c.validadeDias,
        valorTotal: c.valorMensal,
        tipoEvento: isCheckInHoje ? "CHECK_IN_HOJE" : isCheckOutHoje ? "CHECK_OUT_HOJE" : "ESTADIA",
      };
    });

  // Repasses Pendentes Formatados
  const repassesPendentes = repassesDoMes
    .filter((r) => r.status === "PENDENTE")
    .map((r) => ({
      id: r.id,
      proprietarioNome: r.proprietario.nome,
      proprietarioTelefone: r.proprietario.telefone,
      proprietarioPix: r.proprietario.chavePix,
      tipoChavePix: r.proprietario.tipoChavePix,
      banco: r.proprietario.banco,
      flatNumero: r.flat?.numero || "Unidade",
      localNome: r.flat?.local?.nome || "Condomínio",
      valorBruto: r.valorBrutoAluguel,
      taxaAdmPerc: r.taxaAdminPercentual,
      taxaAdmValor: r.valorTaxaAdmin,
      valorLiquido: r.valorLiquidoRepasse,
      mesReferencia: r.mesReferencia,
    }));

  return NextResponse.json({
    kpis: {
      totalLocatarios,
      totalLocatariosAtivos,
      totalProprietarios,
      totalLocais,
      totalFlats,
      flatsOcupados,
      flatsDisponiveis,
      flatsManutencao,
      taxaOcupacao,
      flatsMensal,
      flatsDiaria,
      flatsAmbos,
      totalContratosAtivos: contratosAtivos.length,
      totalContratosFinalizados: contratosFinalizados.length,
      totalCaucaoCustodia,
      totalReceberMes,
      totalRecebidoMes,
      totalEmAbertoReceber,
      totalInadimplenteGeral,
      taxaEficienciaCobranca,
      taxaInadimplencia,
      totalPagarMes,
      totalPagoMes,
      totalEmAbertoPagar,
      saldoOperacionalLiquido,
      margemLucro,
      totalRepassesLiquidoMes,
      totalRepassesPagosMes,
      totalRepassesPendentesMes,
      totalComissaoImobiliariaMes,
      totalVistoriasEntrada,
      totalVistoriasSaida,
    },
    historicoSemestral,
    locaisPerformance,
    formasPagamento,
    despesasCategorias,
    alertas: {
      inadimplencias,
      contratosVencendo,
      diariasProximas,
      repassesPendentes,
      vistoriasRecentes: todasVistorias.map((v) => ({
        id: v.id,
        tipoVistoria: v.tipoVistoria,
        flatNumero: v.flat.numero,
        localNome: v.flat.local?.nome,
        locatarioNome: v.locatario?.nome,
        responsavelVistoria: v.responsavelVistoria,
        dataVistoria: v.dataVistoria,
        statusAssinatura: v.statusAssinatura,
      })),
    },
  });
}
