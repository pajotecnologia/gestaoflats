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
        eventos: { orderBy: { criadoEm: "desc" }, take: 30 },
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
    } = await request.json();

    const dtEmissao = new Date(dataEmissao);
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

    const dtFinal = new Date(dtEmissao);
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

    if (flatObj.status !== "DISPONIVEL") {
      const statusText = flatObj.status === "OCUPADO" ? "OCUPADO" : "EM MANUTENÇÃO";
      return NextResponse.json(
        { error: `O flat selecionado (${flatObj.numero}) está atualmente como ${statusText} e não pode receber novos contratos.` },
        { status: 400 }
      );
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
        fotosAnexadasUrl: fotosAnexadasUrl || null,
        tokenAssinatura,
        statusAssinatura: "PENDENTE",
        status: "ATIVO",
      },
    });

    // Atualizar flat para OCUPADO
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

    await prisma.contaReceber.createMany({
      data: parcelasData,
    });

    await prisma.contratoEvento.create({
      data: {
        empresaId: session.empresaId,
        contratoId: newContrato.id,
        tipo: "EMISSAO",
        descricao: "Contrato emitido e parcelas financeiras geradas.",
        dadosJson: JSON.stringify({ parcelas: parcelasData.length }),
      },
    });

    return NextResponse.json({ contrato: newContrato, tokenAssinatura });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const { id, acao, ...body } = await request.json();
    if (!id || !acao) return NextResponse.json({ error: "ID do contrato e ação são obrigatórios." }, { status: 400 });
    const contrato = await prisma.contrato.findFirst({ where: { id, empresaId: session.empresaId } });
    if (!contrato) return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
    const registrar = (tipo: string, descricao: string, dados?: unknown) => prisma.contratoEvento.create({ data: { empresaId: session.empresaId, contratoId: id, tipo, descricao, dadosJson: dados ? JSON.stringify(dados) : null } });
    if (acao === "RENOVAR") {
      const quantidade = Math.max(1, Number(body.quantidade || 12));
      const unidade = body.unidade === "DIAS" ? "DIAS" : "MESES";
      const novaDataFinal = new Date(contrato.dataFinal);
      if (unidade === "DIAS") novaDataFinal.setDate(novaDataFinal.getDate() + quantidade); else novaDataFinal.setMonth(novaDataFinal.getMonth() + quantidade);
      const atualizado = await prisma.contrato.update({ where: { id }, data: { dataFinal: novaDataFinal, status: "ATIVO" } });
      if (unidade === "MESES") {
        const novasParcelas: any[] = [];
        for (let i = 1; i <= quantidade; i++) {
          const vencimento = new Date(contrato.dataFinal);
          vencimento.setMonth(vencimento.getMonth() + i);
          const mesRef = `${vencimento.getFullYear()}-${String(vencimento.getMonth() + 1).padStart(2, "0")}`;
          novasParcelas.push({ empresaId: session.empresaId, contratoId: id, locatarioId: contrato.locatarioId, mesReferencia: mesRef, numeroParcela: 100000 + i, valor: contrato.valorMensal, dataVencimento: vencimento, status: "PENDENTE", observacao: "Parcela gerada pela renovação contratual" });
        }
        if (novasParcelas.length) await prisma.contaReceber.createMany({ data: novasParcelas });
      }
      await registrar("RENOVACAO", `Contrato renovado por ${quantidade} ${unidade.toLowerCase()}.`, { quantidade, unidade, dataAnterior: contrato.dataFinal, novaDataFinal });
      return NextResponse.json({ contrato: atualizado });
    }
    if (acao === "REAJUSTAR") {
      const novoValor = Number(body.valorMensal);
      if (!Number.isFinite(novoValor) || novoValor <= 0) return NextResponse.json({ error: "Novo valor mensal inválido." }, { status: 400 });
      const valorAnterior = contrato.valorMensal;
      const atualizado = await prisma.contrato.update({ where: { id }, data: { valorMensal: novoValor } });
      const pendentes = await prisma.contaReceber.count({ where: { contratoId: id, status: "PENDENTE" } });
      if (pendentes) await prisma.contaReceber.updateMany({ where: { contratoId: id, status: "PENDENTE" }, data: { valor: novoValor } });
      await registrar("REAJUSTE", `Valor mensal reajustado de R$ ${valorAnterior.toFixed(2)} para R$ ${novoValor.toFixed(2)}.`, { valorAnterior, novoValor, parcelasAtualizadas: pendentes });
      return NextResponse.json({ contrato: atualizado, parcelasAtualizadas: pendentes });
    }
    if (acao === "RESCINDIR" || acao === "CANCELAR") {
      const motivo = String(body.motivo || (acao === "RESCINDIR" ? "Rescisão contratual" : "Cancelamento contratual"));
      const status = acao === "RESCINDIR" ? "FINALIZADO" : "CANCELADO";
      const atualizado = await prisma.contrato.update({ where: { id }, data: { status } });
      await prisma.flat.update({ where: { id: contrato.flatId }, data: { status: "DISPONIVEL" } });
      await registrar(acao === "RESCINDIR" ? "RESCISAO" : "CANCELAMENTO", motivo, { motivo, data: new Date().toISOString() });
      return NextResponse.json({ contrato: atualizado });
    }
    if (acao === "ALTERAR") {
      const data: any = {};
      if (body.diaVencimento !== undefined) data.diaVencimento = Number(body.diaVencimento);
      if (body.formaPagamento !== undefined) data.formaPagamento = body.formaPagamento || null;
      if (body.multaAtrasoPercentual !== undefined) data.multaAtrasoPercentual = Number(body.multaAtrasoPercentual);
      if (body.jurosAtrasoPercentual !== undefined) data.jurosAtrasoPercentual = Number(body.jurosAtrasoPercentual);
      if (body.valorCaucao !== undefined) data.valorCaucao = Number(body.valorCaucao);
      if (body.multaRescisaoMeses !== undefined) data.multaRescisaoMeses = Number(body.multaRescisaoMeses);
      if (body.bancoNome !== undefined) data.bancoNome = body.bancoNome || null;
      if (body.bancoDadosConta !== undefined) data.bancoDadosConta = body.bancoDadosConta || null;
      const atualizado = await prisma.contrato.update({ where: { id }, data });
      await registrar("ALTERACAO", "Condições contratuais atualizadas.", data);
      return NextResponse.json({ contrato: atualizado });
    }
    return NextResponse.json({ error: "Ação de contrato não suportada." }, { status: 400 });
  } catch (error: any) { return NextResponse.json({ error: error.message || "Erro ao atualizar contrato." }, { status: 500 }); }
}
