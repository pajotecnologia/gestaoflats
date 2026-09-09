import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMesReferencia } from "@/lib/validation";

export const dynamic = "force-dynamic";

export interface AlertaItem {
  id: string;
  tipo:
    | "RECEBER_ATRASADO"
    | "RECEBER_PROXIMO"
    | "CONTRATO_EXPIRADO"
    | "CONTRATO_EXPIRANDO"
    | "PAGAR_ATRASADO"
    | "PAGAR_PROXIMO"
    | "RESERVA_CHECKIN"
    | "RESERVA_CHECKOUT";
  categoria: "financeiro" | "contratos" | "operacional";
  nivel: "critico" | "atencao" | "info";
  titulo: string;
  subtitulo: string;
  detalhes?: string;
  valor?: number;
  data: string;
  dias: number;
  link: string;
  whatsapp?: string;
  meta?: Record<string, any>;
}

export async function GET(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0, 0);
    const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999);

    const daquiA3Dias = new Date(hoje.getTime() + 3 * 24 * 60 * 60 * 1000);
    const daquiA5Dias = new Date(hoje.getTime() + 5 * 24 * 60 * 60 * 1000);
    const daquiA30Dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      receberAtrasadas,
      receberProximas,
      pagarAtrasadas,
      pagarProximas,
      contratosExpirando,
      contratosExpirados,
      reservasHoje,
    ] = await Promise.all([
      // 1. Contas a Receber em Atraso (Vencidas e Pendentes)
      prisma.contaReceber.findMany({
        where: {
          empresaId: session.empresaId,
          status: "PENDENTE",
          dataVencimento: { lt: inicioHoje },
        },
        include: {
          locatario: true,
          contrato: { include: { flat: { include: { local: true } } } },
        },
        orderBy: { dataVencimento: "asc" },
        take: 50,
      }),

      // 2. Contas a Receber Próximas (Vencendo entre hoje e próximos 5 dias)
      prisma.contaReceber.findMany({
        where: {
          empresaId: session.empresaId,
          status: "PENDENTE",
          dataVencimento: { gte: inicioHoje, lte: daquiA5Dias },
        },
        include: {
          locatario: true,
          contrato: { include: { flat: { include: { local: true } } } },
        },
        orderBy: { dataVencimento: "asc" },
        take: 50,
      }),

      // 3. Contas a Pagar em Atraso (Vencidas e Pendentes)
      prisma.contaPagar.findMany({
        where: {
          empresaId: session.empresaId,
          status: "PENDENTE",
          dataVencimento: { lt: inicioHoje },
        },
        include: {
          fornecedor: true,
        },
        orderBy: { dataVencimento: "asc" },
        take: 30,
      }),

      // 4. Contas a Pagar Próximas (Vencendo entre hoje e próximos 3 dias)
      prisma.contaPagar.findMany({
        where: {
          empresaId: session.empresaId,
          status: "PENDENTE",
          dataVencimento: { gte: inicioHoje, lte: daquiA3Dias },
        },
        include: {
          fornecedor: true,
        },
        orderBy: { dataVencimento: "asc" },
        take: 30,
      }),

      // 5. Contratos Ativos Expirando nos Próximos 30 dias
      prisma.contrato.findMany({
        where: {
          empresaId: session.empresaId,
          status: { notIn: ["CANCELADO", "ENCERRADO"] },
          dataFinal: { gte: inicioHoje, lte: daquiA30Dias },
        },
        include: {
          locatario: true,
          flat: { include: { local: true } },
        },
        orderBy: { dataFinal: "asc" },
        take: 30,
      }),

      // 6. Contratos Ativos Já Vencidos que não foram Encerrados
      prisma.contrato.findMany({
        where: {
          empresaId: session.empresaId,
          status: "ATIVO",
          dataFinal: { lt: inicioHoje },
        },
        include: {
          locatario: true,
          flat: { include: { local: true } },
        },
        orderBy: { dataFinal: "asc" },
        take: 30,
      }),

      // 7. Diárias da Agenda para Hoje (Check-in ou Check-out)
      prisma.contrato.findMany({
        where: {
          empresaId: session.empresaId,
          tipoValidade: "DIAS",
          status: { not: "CANCELADO" },
          OR: [
            { dataEmissao: { gte: inicioHoje, lte: fimHoje } },
            { dataFinal: { gte: inicioHoje, lte: fimHoje } },
          ],
        },
        include: {
          locatario: true,
          flat: { include: { local: true } },
        },
        orderBy: { dataEmissao: "asc" },
        take: 20,
      }),
    ]);

    const alertas: AlertaItem[] = [];

    // Formatar Aluguéis em Atraso
    for (const conta of receberAtrasadas) {
      const dataVenc = new Date(conta.dataVencimento);
      const diasAtraso = Math.max(
        1,
        Math.floor((inicioHoje.getTime() - dataVenc.getTime()) / (1000 * 60 * 60 * 24))
      );
      const locNome = conta.locatario?.nome || "Locatário";
      const flatInfo = conta.contrato?.flat?.numero
        ? `Flat ${conta.contrato.flat.numero}`
        : "Imóvel";

      alertas.push({
        id: `rec-atr-${conta.id}`,
        tipo: "RECEBER_ATRASADO",
        categoria: "financeiro",
        nivel: "critico",
        titulo: `Aluguel em Atraso (${diasAtraso}d)`,
        subtitulo: `${locNome} • ${flatInfo}`,
        detalhes: `Parcela ${conta.numeroParcela}${
          conta.mesReferencia ? ` • Ref: ${formatMesReferencia(conta.mesReferencia)}` : ""
        }`,
        valor: Number(conta.valor),
        data: dataVenc.toISOString().split("T")[0],
        dias: diasAtraso,
        link: `/financeiro/receber`,
        whatsapp: conta.locatario?.telefone || undefined,
        meta: {
          contaId: conta.id,
          locatarioId: conta.locatarioId,
          contratoId: conta.contratoId,
        },
      });
    }

    // Formatar Aluguéis Próximos de Vencer
    for (const conta of receberProximas) {
      const dataVenc = new Date(conta.dataVencimento);
      const diffMs = dataVenc.getTime() - inicioHoje.getTime();
      const diasRestantes = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const locNome = conta.locatario?.nome || "Locatário";
      const flatInfo = conta.contrato?.flat?.numero
        ? `Flat ${conta.contrato.flat.numero}`
        : "Imóvel";

      alertas.push({
        id: `rec-prox-${conta.id}`,
        tipo: "RECEBER_PROXIMO",
        categoria: "financeiro",
        nivel: diasRestantes === 0 ? "critico" : "atencao",
        titulo: diasRestantes === 0 ? "Aluguel Vence Hoje" : `Aluguel Vence em ${diasRestantes}d`,
        subtitulo: `${locNome} • ${flatInfo}`,
        detalhes: `Parcela ${conta.numeroParcela}${
          conta.mesReferencia ? ` • Ref: ${formatMesReferencia(conta.mesReferencia)}` : ""
        }`,
        valor: Number(conta.valor),
        data: dataVenc.toISOString().split("T")[0],
        dias: diasRestantes,
        link: `/financeiro/receber`,
        whatsapp: conta.locatario?.telefone || undefined,
        meta: {
          contaId: conta.id,
          locatarioId: conta.locatarioId,
        },
      });
    }

    // Formatar Contas a Pagar em Atraso
    for (const conta of pagarAtrasadas) {
      const dataVenc = new Date(conta.dataVencimento);
      const diasAtraso = Math.max(
        1,
        Math.floor((inicioHoje.getTime() - dataVenc.getTime()) / (1000 * 60 * 60 * 24))
      );

      alertas.push({
        id: `pag-atr-${conta.id}`,
        tipo: "PAGAR_ATRASADO",
        categoria: "financeiro",
        nivel: "critico",
        titulo: `Conta a Pagar Vencida (${diasAtraso}d)`,
        subtitulo: conta.descricao,
        detalhes: `Vencimento: ${dataVenc.toLocaleDateString("pt-BR")}${
          conta.fornecedor ? ` • Fornecedor: ${conta.fornecedor.razaoSocial}` : ""
        }`,
        valor: Number(conta.valor),
        data: dataVenc.toISOString().split("T")[0],
        dias: diasAtraso,
        link: `/financeiro/pagar`,
        meta: { contaId: conta.id },
      });
    }

    // Formatar Contas a Pagar Próximas
    for (const conta of pagarProximas) {
      const dataVenc = new Date(conta.dataVencimento);
      const diasRestantes = Math.max(
        0,
        Math.ceil((dataVenc.getTime() - inicioHoje.getTime()) / (1000 * 60 * 60 * 24))
      );

      alertas.push({
        id: `pag-prox-${conta.id}`,
        tipo: "PAGAR_PROXIMO",
        categoria: "financeiro",
        nivel: diasRestantes === 0 ? "critico" : "atencao",
        titulo:
          diasRestantes === 0
            ? "Conta a Pagar Vence Hoje"
            : `Conta a Pagar Vence em ${diasRestantes}d`,
        subtitulo: conta.descricao,
        detalhes: `Vencimento: ${dataVenc.toLocaleDateString("pt-BR")}${
          conta.fornecedor ? ` • Fornecedor: ${conta.fornecedor.razaoSocial}` : ""
        }`,
        valor: Number(conta.valor),
        data: dataVenc.toISOString().split("T")[0],
        dias: diasRestantes,
        link: `/financeiro/pagar`,
        meta: { contaId: conta.id },
      });
    }

    // Formatar Contratos Expirados Sem Encerramento
    for (const c of contratosExpirados) {
      const dataFim = new Date(c.dataFinal);
      const diasExpirado = Math.max(
        1,
        Math.floor((inicioHoje.getTime() - dataFim.getTime()) / (1000 * 60 * 60 * 24))
      );

      alertas.push({
        id: `ct-exp-${c.id}`,
        tipo: "CONTRATO_EXPIRADO",
        categoria: "contratos",
        nivel: "critico",
        titulo: `Contrato Vencido há ${diasExpirado}d`,
        subtitulo: `${c.locatario.nome} • Flat ${c.flat.numero}`,
        detalhes: `Vigência encerrada em ${dataFim.toLocaleDateString("pt-BR")}. Renovar ou agendar vistoria de saída.`,
        valor: c.valorMensal,
        data: dataFim.toISOString().split("T")[0],
        dias: diasExpirado,
        link: `/contratos`,
        whatsapp: c.locatario.telefone || undefined,
        meta: { contratoId: c.id, locatarioId: c.locatarioId, flatId: c.flatId },
      });
    }

    // Formatar Contratos Expirando nos Próximos 30 dias
    for (const c of contratosExpirando) {
      const dataFim = new Date(c.dataFinal);
      const diasRestantes = Math.max(
        0,
        Math.ceil((dataFim.getTime() - inicioHoje.getTime()) / (1000 * 60 * 60 * 24))
      );

      alertas.push({
        id: `ct-prox-${c.id}`,
        tipo: "CONTRATO_EXPIRANDO",
        categoria: "contratos",
        nivel: diasRestantes <= 7 ? "critico" : "atencao",
        titulo:
          diasRestantes === 0
            ? "Contrato Expira Hoje"
            : `Contrato Expira em ${diasRestantes} dias`,
        subtitulo: `${c.locatario.nome} • Flat ${c.flat.numero}`,
        detalhes: `Término em ${dataFim.toLocaleDateString("pt-BR")}. Preparar renovação contratual.`,
        valor: c.valorMensal,
        data: dataFim.toISOString().split("T")[0],
        dias: diasRestantes,
        link: `/contratos`,
        whatsapp: c.locatario.telefone || undefined,
        meta: { contratoId: c.id, locatarioId: c.locatarioId, flatId: c.flatId },
      });
    }

    // Formatar Diárias / Temporadas de Hoje
    for (const res of reservasHoje) {
      const dataInicioStr = res.dataEmissao.toISOString().split("T")[0];
      const dataFimStr = res.dataFinal.toISOString().split("T")[0];
      const hojeStr = hoje.toISOString().split("T")[0];

      if (dataInicioStr === hojeStr) {
        alertas.push({
          id: `res-in-${res.id}`,
          tipo: "RESERVA_CHECKIN",
          categoria: "operacional",
          nivel: "info",
          titulo: "Check-in de Reserva Hoje",
          subtitulo: `${res.locatario.nome} • Flat ${res.flat.numero}`,
          detalhes: `Entrada prevista hoje para período de ${res.validadeDias || 1} diária(s).`,
          valor: res.valorMensal,
          data: dataInicioStr,
          dias: 0,
          link: `/agenda`,
          whatsapp: res.locatario.telefone || undefined,
          meta: { contratoId: res.id, locatarioId: res.locatarioId, flatId: res.flatId },
        });
      }

      if (dataFimStr === hojeStr) {
        alertas.push({
          id: `res-out-${res.id}`,
          tipo: "RESERVA_CHECKOUT",
          categoria: "operacional",
          nivel: "info",
          titulo: "Check-out de Reserva Hoje",
          subtitulo: `${res.locatario.nome} • Flat ${res.flat.numero}`,
          detalhes: `Saída prevista hoje. Liberar flat para limpeza e conferência.`,
          valor: res.valorMensal,
          data: dataFimStr,
          dias: 0,
          link: `/agenda`,
          whatsapp: res.locatario.telefone || undefined,
          meta: { contratoId: res.id, locatarioId: res.locatarioId, flatId: res.flatId },
        });
      }
    }

    // Ordenar alertas: primeiro nível crítico, depois atenção, depois info
    const ordemNivel = { critico: 0, atencao: 1, info: 2 };
    alertas.sort((a, b) => {
      if (ordemNivel[a.nivel] !== ordemNivel[b.nivel]) {
        return ordemNivel[a.nivel] - ordemNivel[b.nivel];
      }
      return a.dias - b.dias;
    });

    const contadores = {
      total: alertas.length,
      criticos: alertas.filter((a) => a.nivel === "critico").length,
      atencao: alertas.filter((a) => a.nivel === "atencao").length,
      info: alertas.filter((a) => a.nivel === "info").length,
      financeiro: alertas.filter((a) => a.categoria === "financeiro").length,
      contratos: alertas.filter((a) => a.categoria === "contratos").length,
      operacional: alertas.filter((a) => a.categoria === "operacional").length,
    };

    return NextResponse.json({
      alertas,
      contadores,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Erro ao buscar alertas:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
