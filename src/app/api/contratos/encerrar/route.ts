import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      contratoId,
      vistoriaSaidaId,
      cancelarParcelasPendentes = true,
      tipoEncerramento = "NORMAL", // "NORMAL" | "RESCISAO_ANTECIPADA"
      cobrarMulta = false,
      valorMulta = 0,
      tipoCalculoMulta = "PROPORCIONAL",
      dataVencimentoMulta,
      motivo = "Término de vigência / Devolução de chaves",
    } = body;

    if (!contratoId) {
      return NextResponse.json({ error: "ID do contrato é obrigatório." }, { status: 400 });
    }

    const contrato = await prisma.contrato.findFirst({
      where: { id: contratoId, empresaId: session.empresaId },
      include: {
        flat: true,
        locatario: true,
        vistoriasChecklist: true,
      },
    });

    if (!contrato) {
      return NextResponse.json({ error: "Contrato não encontrado para esta empresa." }, { status: 404 });
    }

    let vistoriaSaidaObj: any = null;

    // Se informou vistoria de saída específica para vincular
    if (vistoriaSaidaId && vistoriaSaidaId !== "none") {
      vistoriaSaidaObj = await prisma.vistoriaChecklist.findFirst({
        where: {
          id: vistoriaSaidaId,
          empresaId: session.empresaId,
        },
      });

      if (vistoriaSaidaObj) {
        await prisma.vistoriaChecklist.update({
          where: { id: vistoriaSaidaId },
          data: {
            contratoId: contrato.id,
            locatarioId: contrato.locatarioId,
            tipoVistoria: "SAIDA",
          },
        });
      }
    }

    // 1. Atualizar o Contrato para FINALIZADO
    const contratoAtualizado = await prisma.contrato.update({
      where: { id: contratoId },
      data: {
        status: "FINALIZADO",
        anexoChecklistSaida: vistoriaSaidaObj?.itensJson || contrato.anexoChecklistSaida,
      },
    });

    // 2. Liberar o Flat para status DISPONIVEL
    await prisma.flat.update({
      where: { id: contrato.flatId },
      data: { status: "DISPONIVEL" },
    });

    // 3. Opcional: Cancelar parcelas pendentes futuras
    if (cancelarParcelasPendentes) {
      await prisma.contaReceber.updateMany({
        where: {
          contratoId: contrato.id,
          empresaId: session.empresaId,
          status: "PENDENTE",
        },
        data: {
          status: "CANCELADO",
          observacao: `Cancelado no encerramento/rescisão do contrato (${motivo})`,
        },
      });
    }

    // 4. Gerar Lançamento de Multa Rescisória se aplicável
    let contaMultaCriada = null;
    const valMultaNum = parseFloat(String(valorMulta || 0));
    if (cobrarMulta && valMultaNum > 0) {
      const dVenc = dataVencimentoMulta ? new Date(dataVencimentoMulta) : new Date();
      const mesRef = `${dVenc.getFullYear()}-${String(dVenc.getMonth() + 1).padStart(2, "0")}`;

      contaMultaCriada = await prisma.contaReceber.create({
        data: {
          empresaId: session.empresaId,
          locatarioId: contrato.locatarioId,
          contratoId: contrato.id,
          valor: valMultaNum,
          dataVencimento: dVenc,
          mesReferencia: mesRef,
          numeroParcela: 99,
          status: "PENDENTE",
          formaPagamento: contrato.formaPagamento || "PIX",
          observacao: `Multa por Rescisão Antecipada (${tipoCalculoMulta}) - Contrato Flat ${contrato.flat.numero} - ${motivo}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: tipoEncerramento === "RESCISAO_ANTECIPADA"
        ? `Rescisão antecipada realizada com sucesso! O Flat ${contrato.flat.numero} foi liberado.${contaMultaCriada ? ` Multa rescisória de R$ ${valMultaNum.toFixed(2)} gerada no Contas a Receber.` : ""}`
        : `Contrato encerrado com sucesso! O Flat ${contrato.flat.numero} agora está DISPONÍVEL.`,
      contrato: contratoAtualizado,
      contaMulta: contaMultaCriada,
    });
  } catch (error: any) {
    console.error("Erro ao encerrar/rescindir contrato:", error);
    return NextResponse.json({ error: error.message || "Erro ao encerrar/rescindir contrato." }, { status: 500 });
  }
}

