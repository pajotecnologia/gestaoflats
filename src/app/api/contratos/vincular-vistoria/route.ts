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
    const { contratoId, vistoriaId, tipoVistoria = "ENTRADA" } = body;

    if (!contratoId || !vistoriaId) {
      return NextResponse.json({ error: "ID do contrato e ID da vistoria são obrigatórios." }, { status: 400 });
    }

    const contrato = await prisma.contrato.findFirst({
      where: { id: contratoId, empresaId: session.empresaId },
    });

    if (!contrato) {
      return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
    }

    const vistoria = await prisma.vistoriaChecklist.findFirst({
      where: { id: vistoriaId, empresaId: session.empresaId },
    });

    if (!vistoria) {
      return NextResponse.json({ error: "Vistoria não encontrada." }, { status: 404 });
    }

    // Atualizar vínculo da vistoria
    await prisma.vistoriaChecklist.update({
      where: { id: vistoriaId },
      data: {
        contratoId: contrato.id,
        locatarioId: contrato.locatarioId,
        tipoVistoria: tipoVistoria || vistoria.tipoVistoria,
      },
    });

    // Atualizar anexo no contrato correspondente
    const dataUpdate: any = {};
    if (tipoVistoria === "ENTRADA") {
      dataUpdate.anexoChecklistEntrada = vistoria.itensJson;
    } else if (tipoVistoria === "SAIDA") {
      dataUpdate.anexoChecklistSaida = vistoria.itensJson;
    }

    if (Object.keys(dataUpdate).length > 0) {
      await prisma.contrato.update({
        where: { id: contratoId },
        data: dataUpdate,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Vistoria de ${tipoVistoria} vinculada ao contrato com sucesso!`,
    });
  } catch (error: any) {
    console.error("Erro ao vincular vistoria ao contrato:", error);
    return NextResponse.json({ error: error.message || "Erro ao vincular vistoria." }, { status: 500 });
  }
}
