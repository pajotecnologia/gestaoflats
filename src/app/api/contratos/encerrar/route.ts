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
          observacao: `Cancelado no encerramento do contrato (${motivo})`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Contrato encerrado com sucesso! O Flat ${contrato.flat.numero} agora está DISPONÍVEL.`,
      contrato: contratoAtualizado,
    });
  } catch (error: any) {
    console.error("Erro ao encerrar contrato:", error);
    return NextResponse.json({ error: error.message || "Erro ao encerrar contrato." }, { status: 500 });
  }
}
