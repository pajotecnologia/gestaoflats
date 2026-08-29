import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSessionOrFallback();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { empresaId, tipo, quantidade, dataExpiracaoCustom, plano, status } = body;

    if (!empresaId) {
      return NextResponse.json({ error: "ID da empresa é obrigatório." }, { status: 400 });
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
    }

    let novaDataFimAcesso: Date;
    const agora = new Date();
    // Se a empresa já tiver uma data futura ativa, estende a partir dela; senão, a partir de agora
    const baseDate =
      empresa.dataFimAcesso && empresa.dataFimAcesso.getTime() > agora.getTime()
        ? new Date(empresa.dataFimAcesso.getTime())
        : new Date();

    if (tipo === "MESES") {
      const qtdMeses = Number(quantidade) || 1;
      baseDate.setMonth(baseDate.getMonth() + qtdMeses);
      novaDataFimAcesso = baseDate;
    } else if (tipo === "DIAS") {
      const qtdDias = Number(quantidade) || 30;
      baseDate.setDate(baseDate.getDate() + qtdDias);
      novaDataFimAcesso = baseDate;
    } else if (tipo === "CUSTOM" && dataExpiracaoCustom) {
      novaDataFimAcesso = new Date(dataExpiracaoCustom);
    } else {
      // Padrão: 30 dias
      baseDate.setDate(baseDate.getDate() + 30);
      novaDataFimAcesso = baseDate;
    }

    const novoStatus = status || "ATIVO";
    const novoPlano = plano || (tipo === "MESES" && quantidade === 12 ? "ANUAL" : "MENSAL");

    const empresaAtualizada = await prisma.empresa.update({
      where: { id: empresaId },
      data: {
        statusAssinatura: novoStatus,
        dataFimAcesso: novaDataFimAcesso,
        planoAtual: novoPlano,
      },
    });

    return NextResponse.json({
      success: true,
      empresa: empresaAtualizada,
      message: `Acesso liberado com sucesso até ${novaDataFimAcesso.toLocaleDateString("pt-BR")}!`,
    });
  } catch (error: any) {
    console.error("Erro ao liberar acesso da empresa:", error);
    return NextResponse.json({ error: error.message || "Erro ao liberar acesso." }, { status: 500 });
  }
}
