import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const flatId = searchParams.get("flatId");
    const dataEmissaoStr = searchParams.get("dataEmissao");
    const tipoValidade = (searchParams.get("tipoValidade") || "MESES").toUpperCase();
    const validadeValorStr = searchParams.get("validadeValor") || searchParams.get("validadeMeses") || "12";
    const ignorarContratoId = searchParams.get("ignorarContratoId");

    if (!flatId) {
      return NextResponse.json({ error: "Parâmetro flatId é obrigatório." }, { status: 400 });
    }

    if (!dataEmissaoStr) {
      return NextResponse.json({ error: "Parâmetro dataEmissao é obrigatório." }, { status: 400 });
    }

    const flat = await prisma.flat.findFirst({
      where: { id: flatId, empresaId: session.empresaId },
      include: { local: true },
    });

    if (!flat) {
      return NextResponse.json({ error: "Imóvel não encontrado." }, { status: 404 });
    }

    if (flat.status === "MANUTENCAO") {
      return NextResponse.json({
        disponivel: false,
        motivo: "MANUTENCAO",
        mensagem: `⚠️ O imóvel "${flat.numero}" (${flat.local?.nome || "Condomínio"}) está atualmente em MANUTENÇÃO e não pode receber contratos.`,
        flat,
      });
    }

    // Processar datas com precisão
    const [ano, mes, dia] = dataEmissaoStr.split("T")[0].split("-").map(Number);
    const dtEmissao = new Date(ano, mes - 1, dia, 0, 0, 0, 0);

    const duracaoValor = parseInt(validadeValorStr, 10) || (tipoValidade === "DIAS" ? 1 : 12);
    const dtFinal = new Date(dtEmissao.getTime());

    if (tipoValidade === "DIAS") {
      dtFinal.setDate(dtFinal.getDate() + duracaoValor);
    } else {
      dtFinal.setMonth(dtFinal.getMonth() + duracaoValor);
    }

    // Buscar contratos ativos que colidem com o período solicitado
    const whereCondition: any = {
      empresaId: session.empresaId,
      flatId: flatId,
      status: "ATIVO",
      AND: [
        { dataEmissao: { lt: dtFinal } },
        { dataFinal: { gt: dtEmissao } },
      ],
    };

    if (ignorarContratoId) {
      whereCondition.id = { not: ignorarContratoId };
    }

    const conflitos = await prisma.contrato.findMany({
      where: whereCondition,
      include: {
        locatario: true,
      },
      orderBy: { dataEmissao: "asc" },
    });

    const dataInicioFmt = dtEmissao.toLocaleDateString("pt-BR");
    const dataFimFmt = dtFinal.toLocaleDateString("pt-BR");

    if (conflitos.length > 0) {
      const primeiroConflito = conflitos[0];
      const cInicioFmt = primeiroConflito.dataEmissao.toLocaleDateString("pt-BR");
      const cFimFmt = primeiroConflito.dataFinal.toLocaleDateString("pt-BR");
      const locNome = primeiroConflito.locatario?.nome || "Outro Locatário";

      return NextResponse.json({
        disponivel: false,
        motivo: "CONFLITO_AGENDA",
        dataInicio: dtEmissao.toISOString(),
        dataFim: dtFinal.toISOString(),
        dataInicioFormatada: dataInicioFmt,
        dataFimFormatada: dataFimFmt,
        duracao: duracaoValor,
        tipoValidade,
        conflitos: conflitos.map((c) => ({
          id: c.id,
          locatarioNome: c.locatario.nome,
          locatarioTelefone: c.locatario.telefone,
          locatarioCpf: c.locatario.cpf,
          dataEmissao: c.dataEmissao,
          dataFinal: c.dataFinal,
          dataInicioFormatada: c.dataEmissao.toLocaleDateString("pt-BR"),
          dataFimFormatada: c.dataFinal.toLocaleDateString("pt-BR"),
          tipoValidade: c.tipoValidade,
          validadeDias: c.validadeDias,
          validadeMeses: c.validadeMeses,
        })),
        mensagem: `❌ Imóvel Indisponível: Já existe locação ativa para ${locNome} de ${cInicioFmt} até ${cFimFmt}.`,
      });
    }

    return NextResponse.json({
      disponivel: true,
      dataInicio: dtEmissao.toISOString(),
      dataFim: dtFinal.toISOString(),
      dataInicioFormatada: dataInicioFmt,
      dataFimFormatada: dataFimFmt,
      duracao: duracaoValor,
      tipoValidade,
      mensagem: `✅ Imóvel 100% Disponível na Agenda para o período de ${dataInicioFmt} até ${dataFimFmt} (${duracaoValor} ${tipoValidade === "DIAS" ? (duracaoValor === 1 ? "dia" : "dias") : (duracaoValor === 1 ? "mês" : "meses")}).`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
