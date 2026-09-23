import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      contratoAnteriorId,
      mesmoImovel = true,
      novoFlatId,
      novoValorMensal,
      tipoValidade = "MESES",
      validadeValor = "12",
      dataInicioRenovacao,
      diaVencimento = 5,
      formaPagamento = "PIX",
      modeloContratoId,
      multaAtrasoPercentual = 2.0,
      jurosAtrasoPercentual = 1.0,
      multaRescisaoMeses = 3,
      valorCaucao = 0.0,
      caucaoParcelas = 0,
      transferirCaucaoAnterior = false,
      vistoriaSaidaAntigaId,
      vistoriaEntradaNovaId,
      observacoesRenovacao = "Renovação de contrato de locação",
    } = body;

    if (!contratoAnteriorId) {
      return NextResponse.json({ error: "ID do contrato anterior é obrigatório." }, { status: 400 });
    }

    const contratoAnterior = await prisma.contrato.findFirst({
      where: { id: contratoAnteriorId, empresaId: session.empresaId },
      include: {
        flat: { include: { local: true } },
        locatario: true,
      },
    });

    if (!contratoAnterior) {
      return NextResponse.json({ error: "Contrato anterior não encontrado." }, { status: 404 });
    }

    const targetFlatId = mesmoImovel ? contratoAnterior.flatId : (novoFlatId || contratoAnterior.flatId);

    // Validar flat de destino
    const flatDestino = await prisma.flat.findFirst({
      where: { id: targetFlatId, empresaId: session.empresaId },
      include: { local: true },
    });

    if (!flatDestino) {
      return NextResponse.json({ error: "Imóvel de destino não encontrado." }, { status: 404 });
    }

    // Se mudou de flat, checar se não está em manutenção
    if (!mesmoImovel && flatDestino.status === "MANUTENCAO") {
      return NextResponse.json(
        { error: `O imóvel de destino (${flatDestino.numero}) está em MANUTENÇÃO.` },
        { status: 400 }
      );
    }

    // Datas do novo contrato
    const [anoI, mesI, diaI] = String(dataInicioRenovacao || new Date().toISOString()).split("T")[0].split("-").map(Number);
    const dtEmissao = new Date(anoI, mesI - 1, diaI, 0, 0, 0, 0);
    const isDias = tipoValidade === "DIAS";
    const duracaoValor = parseInt(String(validadeValor || "12"), 10);
    const vlrMensalNum = parseFloat(String(novoValorMensal || contratoAnterior.valorMensal));
    const diaVencNum = diaVencimento ? parseInt(String(diaVencimento), 10) : 5;
    const multaNum = parseFloat(String(multaAtrasoPercentual ?? 2.0));
    const jurosNum = parseFloat(String(jurosAtrasoPercentual ?? 1.0));
    const multaRescisaoNum = parseInt(String(multaRescisaoMeses ?? 3), 10);
    const caucaoNum = transferirCaucaoAnterior ? 0.0 : parseFloat(String(valorCaucao ?? 0.0));
    const caucaoParcNum = parseInt(String(caucaoParcelas ?? 0), 10);

    const mesesInt = isDias ? Math.max(1, Math.ceil(duracaoValor / 30)) : duracaoValor;
    const diasInt = isDias ? duracaoValor : null;

    const dtFinal = new Date(dtEmissao.getTime());
    if (isDias) {
      dtFinal.setDate(dtFinal.getDate() + duracaoValor);
    } else {
      dtFinal.setMonth(dtFinal.getMonth() + duracaoValor);
    }

    // 1. Finalizar Contrato Anterior
    await prisma.contrato.update({
      where: { id: contratoAnteriorId },
      data: {
        status: "FINALIZADO",
      },
    });

    // 2. Se mudou de imóvel, liberar o flat antigo e vincular vistoria de saída se houver
    if (!mesmoImovel && contratoAnterior.flatId !== targetFlatId) {
      await prisma.flat.update({
        where: { id: contratoAnterior.flatId },
        data: { status: "DISPONIVEL" },
      });

      if (vistoriaSaidaAntigaId && vistoriaSaidaAntigaId !== "none") {
        await prisma.vistoriaChecklist.update({
          where: { id: vistoriaSaidaAntigaId },
          data: {
            contratoId: contratoAnterior.id,
            locatarioId: contratoAnterior.locatarioId,
            tipoVistoria: "SAIDA",
          },
        });
      }
    }

    // 3. Atualizar flat de destino para OCUPADO
    await prisma.flat.update({
      where: { id: targetFlatId },
      data: { status: "OCUPADO" },
    });

    // 4. Criar o Novo Contrato
    const tokenAssinatura = crypto.randomBytes(24).toString("hex");
    const novoContrato = await prisma.contrato.create({
      data: {
        empresaId: session.empresaId,
        locatarioId: contratoAnterior.locatarioId,
        flatId: targetFlatId,
        modeloContratoId: modeloContratoId || contratoAnterior.modeloContratoId,
        dataEmissao: dtEmissao,
        tipoValidade,
        validadeMeses: mesesInt,
        validadeDias: diasInt,
        dataFinal: dtFinal,
        valorMensal: vlrMensalNum,
        diaVencimento: diaVencNum,
        formaPagamento: formaPagamento || "PIX",
        bancoNome: contratoAnterior.bancoNome,
        bancoDadosConta: contratoAnterior.bancoDadosConta,
        multaAtrasoPercentual: multaNum,
        jurosAtrasoPercentual: jurosNum,
        valorCaucao: caucaoNum,
        caucaoParcelas: caucaoParcNum,
        multaRescisaoMeses: multaRescisaoNum,
        tokenAssinatura,
        statusAssinatura: "PENDENTE",
        status: "ATIVO",
      },
      include: {
        flat: { include: { local: true } },
        locatario: true,
      },
    });

    // Vincular vistoria de entrada no novo imóvel se houver
    if (vistoriaEntradaNovaId && vistoriaEntradaNovaId !== "none") {
      await prisma.vistoriaChecklist.update({
        where: { id: vistoriaEntradaNovaId },
        data: {
          contratoId: novoContrato.id,
          locatarioId: contratoAnterior.locatarioId,
          tipoVistoria: "ENTRADA",
        },
      });
    }

    // 5. Gerar Parcelas no Contas a Receber
    const parcelasData = [];
    if (isDias) {
      const mesRef = `${dtEmissao.getFullYear()}-${String(dtEmissao.getMonth() + 1).padStart(2, "0")}`;
      parcelasData.push({
        empresaId: session.empresaId,
        contratoId: novoContrato.id,
        locatarioId: contratoAnterior.locatarioId,
        mesReferencia: mesRef,
        numeroParcela: 1,
        valor: vlrMensalNum,
        dataVencimento: dtEmissao,
        status: "PENDENTE",
        observacao: `Renovação por temporada (${duracaoValor} dias)`,
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
          contratoId: novoContrato.id,
          locatarioId: contratoAnterior.locatarioId,
          mesReferencia: mesRef,
          numeroParcela: i,
          valor: vlrMensalNum,
          dataVencimento: vencimento,
          status: "PENDENTE",
        });
      }
    }

    if (caucaoNum > 0 && !transferirCaucaoAnterior) {
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
          contratoId: novoContrato.id,
          locatarioId: contratoAnterior.locatarioId,
          mesReferencia: mesRefCaucao,
          numeroParcela: 0,
          valor: vlrFinalCaucao,
          dataVencimento: vencCaucao,
          status: "PENDENTE",
          observacao: numParcCaucao > 1
            ? `Depósito Caução Renovação (Parcela ${cp}/${numParcCaucao})`
            : "Depósito Caução Renovação - Garantia Locatícia",
        });
      }
    }

    await prisma.contaReceber.createMany({
      data: parcelasData,
    });

    return NextResponse.json({
      success: true,
      message: `Contrato renovado com sucesso para ${contratoAnterior.locatario.nome}! Novo contrato CTR emitido.`,
      contrato: novoContrato,
      tokenAssinatura,
    });
  } catch (error: any) {
    console.error("Erro na renovação do contrato:", error);
    return NextResponse.json({ error: error.message || "Erro ao renovar contrato." }, { status: 500 });
  }
}
