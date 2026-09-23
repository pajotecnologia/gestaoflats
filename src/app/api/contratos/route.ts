import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const contratos = await prisma.contrato.findMany({
      where: { empresaId: session.empresaId },
      include: {
        locatario: true,
        flat: {
          include: { local: true },
        },
        modeloContrato: true,
        contasReceber: {
          orderBy: { numeroParcela: "asc" },
        },
        vistoriasChecklist: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ contratos });
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
    const {
      locatarioId,
      flatId,
      modeloContratoId,
      dataEmissao,
      tipoValidade = "MESES",
      validadeValor,
      validadeMeses = "12",
      valorMensal,
      fotosAnexadasUrl,
      diaVencimento = 5,
      formaPagamento = "PIX",
      bancoNome,
      bancoDadosConta,
      multaAtrasoPercentual = 2.0,
      jurosAtrasoPercentual = 1.0,
      valorCaucao = 0.0,
      caucaoParcelas = 0,
      multaRescisaoMeses = 3,
      vistoriaEntradaId,
    } = await request.json();

    const [anoE, mesE, diaE] = String(dataEmissao).split("T")[0].split("-").map(Number);
    const dtEmissao = new Date(anoE, mesE - 1, diaE, 0, 0, 0, 0);
    const vlrMensalNum = parseFloat(valorMensal);
    const isDias = tipoValidade === "DIAS";
    const duracaoValor = parseInt(validadeValor || validadeMeses || (isDias ? "30" : "12"), 10);

    const diaVencNum = diaVencimento ? parseInt(String(diaVencimento), 10) : 5;
    const multaNum = multaAtrasoPercentual !== undefined && multaAtrasoPercentual !== null ? parseFloat(String(multaAtrasoPercentual)) : 2.0;
    const jurosNum = jurosAtrasoPercentual !== undefined && jurosAtrasoPercentual !== null ? parseFloat(String(jurosAtrasoPercentual)) : 1.0;
    const caucaoNum = valorCaucao !== undefined && valorCaucao !== null ? parseFloat(String(valorCaucao)) : 0.0;
    const caucaoParcNum = caucaoParcelas ? parseInt(String(caucaoParcelas), 10) : 0;
    const multaRescisaoNum = multaRescisaoMeses ? parseInt(String(multaRescisaoMeses), 10) : 3;

    const mesesInt = isDias ? Math.max(1, Math.ceil(duracaoValor / 30)) : duracaoValor;
    const diasInt: number | null = isDias ? duracaoValor : null;

    const dtFinal = new Date(dtEmissao.getTime());
    if (isDias) {
      dtFinal.setDate(dtFinal.getDate() + duracaoValor);
    } else {
      dtFinal.setMonth(dtFinal.getMonth() + duracaoValor);
    }

    const flatObj = await prisma.flat.findFirst({
      where: { id: flatId, empresaId: session.empresaId },
    });

    if (!flatObj) {
      return NextResponse.json({ error: "Flat selecionado não foi encontrado para esta empresa." }, { status: 404 });
    }

    const locatarioObj = await prisma.locatario.findFirst({
      where: { id: locatarioId, empresaId: session.empresaId },
    });

    if (!locatarioObj) {
      return NextResponse.json({ error: "Locatário selecionado não foi encontrado para esta empresa." }, { status: 404 });
    }

    if (modeloContratoId) {
      const modeloObj = await prisma.modeloContrato.findFirst({
        where: { id: modeloContratoId, empresaId: session.empresaId },
      });
      if (!modeloObj) {
        return NextResponse.json({ error: "Modelo de contrato selecionado não foi encontrado para esta empresa." }, { status: 404 });
      }
    }

    if (flatObj.status === "MANUTENCAO") {
      return NextResponse.json(
        { error: `O imóvel selecionado (${flatObj.numero}) está atualmente em MANUTENÇÃO e não pode receber contratos/reservas.` },
        { status: 400 }
      );
    }

    // Validação de Conflito de Datas (Anti-Overbooking entre contratos ativos)
    const conflitoData = await prisma.contrato.findFirst({
      where: {
        empresaId: session.empresaId,
        flatId: flatId,
        status: "ATIVO",
        AND: [
          { dataEmissao: { lt: dtFinal } },
          { dataFinal: { gt: dtEmissao } },
        ],
      },
      include: { locatario: true },
    });

    if (conflitoData) {
      const dIni = conflitoData.dataEmissao.toLocaleDateString("pt-BR");
      const dFim = conflitoData.dataFinal.toLocaleDateString("pt-BR");
      return NextResponse.json(
        {
          error: `Conflito de Disponibilidade: O imóvel "${flatObj.numero}" já possui um contrato ativo para ${conflitoData.locatario.nome} no período de ${dIni} até ${dFim}. Selecione outro imóvel ou altere as datas.`,
        },
        { status: 400 }
      );
    }

    // 1. Buscar Vistoria de Entrada Disponível ou Específica
    let vistoriaExistente: any = null;

    if (vistoriaEntradaId && vistoriaEntradaId !== "none") {
      vistoriaExistente = await prisma.vistoriaChecklist.findFirst({
        where: {
          id: vistoriaEntradaId,
          empresaId: session.empresaId,
          flatId: flatId,
        },
      });

      if (!vistoriaExistente) {
        return NextResponse.json(
          { error: "A vistoria de entrada selecionada não foi encontrada ou não pertence a este imóvel." },
          { status: 400 }
        );
      }

      if (vistoriaExistente.contratoId) {
        return NextResponse.json(
          { error: "A vistoria de entrada selecionada já está vinculada a outro contrato e não pode ser reutilizada para outro imóvel/contrato." },
          { status: 400 }
        );
      }
    } else if (vistoriaEntradaId !== "none") {
      // Se não especificou ID e não marcou "none", busca vistoria disponível sem contrato vinculado
      vistoriaExistente = await prisma.vistoriaChecklist.findFirst({
        where: {
          empresaId: session.empresaId,
          flatId: flatId,
          tipoVistoria: "ENTRADA",
          contratoId: null,
        },
        orderBy: [
          { statusAssinatura: "desc" },
          { updatedAt: "desc" },
          { createdAt: "desc" },
        ],
      });
    }

    const tokenAssinatura = crypto.randomBytes(16).toString("hex");

    const newContrato = await prisma.contrato.create({
      data: {
        empresaId: session.empresaId,
        locatarioId,
        flatId,
        modeloContratoId: modeloContratoId || null,
        dataEmissao: dtEmissao,
        tipoValidade: isDias ? "DIAS" : "MESES",
        validadeMeses: mesesInt,
        validadeDias: diasInt,
        dataFinal: dtFinal,
        valorMensal: vlrMensalNum,
        diaVencimento: diaVencNum,
        formaPagamento: formaPagamento || "PIX",
        bancoNome: bancoNome || null,
        bancoDadosConta: bancoDadosConta || null,
        multaAtrasoPercentual: multaNum,
        jurosAtrasoPercentual: jurosNum,
        valorCaucao: caucaoNum,
        caucaoParcelas: caucaoParcNum,
        multaRescisaoMeses: multaRescisaoNum,
        fotosAnexadasUrl: null, // As fotos vêm da vistoria de entrada
        anexoChecklistEntrada: vistoriaExistente?.itensJson || null,
        tokenAssinatura,
        statusAssinatura: "PENDENTE",
        status: "ATIVO",
      },
      include: {
        flat: { include: { local: true } },
        locatario: true,
      },
    });

    // 2. Vincular Vistoria de Entrada ao novo Contrato de forma exclusiva
    if (vistoriaExistente) {
      await prisma.vistoriaChecklist.update({
        where: { id: vistoriaExistente.id },
        data: {
          contratoId: newContrato.id,
          locatarioId: locatarioId,
        },
      });
    }

    // 3. Atualizar flat para OCUPADO
    await prisma.flat.update({
      where: { id: flatId },
      data: { status: "OCUPADO" },
    });

    // Gerar parcelas no Contas a Receber
    const parcelasData = [];
    if (isDias) {
      const mesRef = `${dtEmissao.getFullYear()}-${String(dtEmissao.getMonth() + 1).padStart(2, "0")}`;
      parcelasData.push({
        empresaId: session.empresaId,
        contratoId: newContrato.id,
        locatarioId,
        mesReferencia: mesRef,
        numeroParcela: 1,
        valor: vlrMensalNum,
        dataVencimento: dtEmissao,
        status: "PENDENTE",
        observacao: `Locação por temporada/diária (${duracaoValor} dias)`,
      });
    } else {
      for (let i = 1; i <= duracaoValor; i++) {
        const vencimento = new Date(dtEmissao);
        vencimento.setMonth(vencimento.getMonth() + (i - 1));

        if (diaVencNum && diaVencNum >= 1 && diaVencNum <= 31) {
          vencimento.setDate(Math.min(diaVencNum, 28));
        }

        const mesRef = `${vencimento.getFullYear()}-${String(vencimento.getMonth() + 1).padStart(2, "0")}`;

        parcelasData.push({
          empresaId: session.empresaId,
          contratoId: newContrato.id,
          locatarioId,
          mesReferencia: mesRef,
          numeroParcela: i,
          valor: vlrMensalNum,
          dataVencimento: vencimento,
          status: "PENDENTE",
        });
      }
    }

    // Gerar Lançamento(s) de Depósito Caução / Garantia no Contas a Receber se valorCaucao > 0
    if (caucaoNum > 0) {
      const numParcCaucao = caucaoParcNum && caucaoParcNum > 1 ? caucaoParcNum : 1;
      const vlrParcCaucao = parseFloat((caucaoNum / numParcCaucao).toFixed(2));

      for (let cp = 1; cp <= numParcCaucao; cp++) {
        const vencCaucao = new Date(dtEmissao);
        if (cp > 1) {
          vencCaucao.setMonth(vencCaucao.getMonth() + (cp - 1));
          if (diaVencNum && diaVencNum >= 1 && diaVencNum <= 31) {
            vencCaucao.setDate(Math.min(diaVencNum, 28));
          }
        }
        const mesRefCaucao = `${vencCaucao.getFullYear()}-${String(vencCaucao.getMonth() + 1).padStart(2, "0")}`;
        const vlrFinalCaucao =
          cp === numParcCaucao
            ? parseFloat((caucaoNum - vlrParcCaucao * (numParcCaucao - 1)).toFixed(2))
            : vlrParcCaucao;

        parcelasData.push({
          empresaId: session.empresaId,
          contratoId: newContrato.id,
          locatarioId,
          mesReferencia: mesRefCaucao,
          numeroParcela: 0,
          valor: vlrFinalCaucao,
          dataVencimento: vencCaucao,
          status: "PENDENTE",
          observacao:
            numParcCaucao > 1
              ? `Depósito Caução (Parcela ${cp}/${numParcCaucao}) - Garantia Locatícia`
              : "Depósito Caução - Garantia Locatícia",
        });
      }
    }

    await prisma.contaReceber.createMany({
      data: parcelasData,
    });

    return NextResponse.json({ contrato: newContrato, tokenAssinatura });
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
    const {
      id,
      locatarioId,
      flatId,
      modeloContratoId,
      dataEmissao,
      tipoValidade = "MESES",
      validadeValor,
      validadeMeses,
      validadeDias,
      valorMensal,
      diaVencimento,
      formaPagamento,
      bancoNome,
      bancoDadosConta,
      multaAtrasoPercentual,
      jurosAtrasoPercentual,
      valorCaucao,
      caucaoParcelas,
      multaRescisaoMeses,
      atualizarParcelasPendentes = true,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do contrato é obrigatório." }, { status: 400 });
    }

    const existingContrato = await prisma.contrato.findFirst({
      where: { id, empresaId: session.empresaId },
      include: { contasReceber: true },
    });

    if (!existingContrato) {
      return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
    }

    const isDias = tipoValidade === "DIAS";
    const duracaoValor = parseInt(validadeValor || validadeDias || validadeMeses || (isDias ? "30" : "12"), 10);
    const mesesInt = isDias ? Math.max(1, Math.ceil(duracaoValor / 30)) : duracaoValor;
    const diasInt: number | null = isDias ? duracaoValor : null;

    let dtEmissao = existingContrato.dataEmissao;
    if (dataEmissao) {
      const [anoE, mesE, diaE] = String(dataEmissao).split("T")[0].split("-").map(Number);
      dtEmissao = new Date(anoE, mesE - 1, diaE, 0, 0, 0, 0);
    }

    const dtFinal = new Date(dtEmissao.getTime());
    if (isDias) {
      dtFinal.setDate(dtFinal.getDate() + duracaoValor);
    } else {
      dtFinal.setMonth(dtFinal.getMonth() + duracaoValor);
    }

    const vlrMensalNum = valorMensal !== undefined && valorMensal !== null ? parseFloat(String(valorMensal)) : existingContrato.valorMensal;
    const diaVencNum = diaVencimento !== undefined && diaVencimento !== null ? parseInt(String(diaVencimento), 10) : existingContrato.diaVencimento;
    const multaNum = multaAtrasoPercentual !== undefined && multaAtrasoPercentual !== null ? parseFloat(String(multaAtrasoPercentual)) : existingContrato.multaAtrasoPercentual;
    const jurosNum = jurosAtrasoPercentual !== undefined && jurosAtrasoPercentual !== null ? parseFloat(String(jurosAtrasoPercentual)) : existingContrato.jurosAtrasoPercentual;
    const caucaoNum = valorCaucao !== undefined && valorCaucao !== null ? parseFloat(String(valorCaucao)) : existingContrato.valorCaucao;
    const caucaoParcNum = caucaoParcelas !== undefined && caucaoParcelas !== null ? parseInt(String(caucaoParcelas), 10) : existingContrato.caucaoParcelas;
    const multaRescisaoNum = multaRescisaoMeses !== undefined && multaRescisaoMeses !== null ? parseInt(String(multaRescisaoMeses), 10) : existingContrato.multaRescisaoMeses;

    const updatedContrato = await prisma.contrato.update({
      where: { id },
      data: {
        locatarioId: locatarioId || existingContrato.locatarioId,
        flatId: flatId || existingContrato.flatId,
        modeloContratoId: modeloContratoId !== undefined ? (modeloContratoId || null) : existingContrato.modeloContratoId,
        dataEmissao: dtEmissao,
        tipoValidade: isDias ? "DIAS" : "MESES",
        validadeMeses: mesesInt,
        validadeDias: diasInt,
        dataFinal: dtFinal,
        valorMensal: vlrMensalNum,
        diaVencimento: diaVencNum,
        formaPagamento: formaPagamento || existingContrato.formaPagamento,
        bancoNome: bancoNome !== undefined ? (bancoNome || null) : existingContrato.bancoNome,
        bancoDadosConta: bancoDadosConta !== undefined ? (bancoDadosConta || null) : existingContrato.bancoDadosConta,
        multaAtrasoPercentual: multaNum,
        jurosAtrasoPercentual: jurosNum,
        valorCaucao: caucaoNum,
        caucaoParcelas: caucaoParcNum,
        multaRescisaoMeses: multaRescisaoNum,
      },
      include: {
        locatario: true,
        flat: { include: { local: true } },
        modeloContrato: true,
        contasReceber: { orderBy: { numeroParcela: "asc" } },
        vistoriasChecklist: true,
      },
    });

    // Se o valor do contrato ou locatário foi alterado e atualizarParcelasPendentes está ativo:
    if (atualizarParcelasPendentes) {
      // Atualizar parcelas de aluguel que continuam PENDENTES (não mexe nas que já estão PAGAS ou caução número 0)
      const parcelasPendentes = await prisma.contaReceber.findMany({
        where: {
          contratoId: id,
          status: "PENDENTE",
          numeroParcela: { gt: 0 },
        },
      });

      for (const p of parcelasPendentes) {
        const updateData: any = {
          valor: vlrMensalNum,
          locatarioId: locatarioId || existingContrato.locatarioId,
        };

        // Se o dia de vencimento mudou, ajusta a dataVencimento da parcela pendente mantendo mês/ano
        if (diaVencNum && diaVencNum >= 1 && diaVencNum <= 31) {
          const currentVenc = new Date(p.dataVencimento);
          currentVenc.setDate(Math.min(diaVencNum, 28));
          updateData.dataVencimento = currentVenc;
        }

        await prisma.contaReceber.update({
          where: { id: p.id },
          data: updateData,
        });
      }
    }

    return NextResponse.json({ success: true, contrato: updatedContrato });
  } catch (error: any) {
    console.error("Erro ao atualizar contrato:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar contrato." }, { status: 500 });
  }
}

