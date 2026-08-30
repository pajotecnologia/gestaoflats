import { NextResponse } from "next/server";
import { getAuthSessionOrFallback, isUserSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verificarStatusAcesso, getSaasConfig } from "@/lib/saasConfig";

export async function GET() {
  try {
    const session = await getAuthSessionOrFallback();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isUserSuperAdmin(session.email, session.cargo)) {
      return NextResponse.json(
        { error: "Acesso restrito exclusivamente ao Super Administrador da plataforma SaaS." },
        { status: 403 }
      );
    }

    const saasConfig = await getSaasConfig();

    const empresas = await prisma.empresa.findMany({
      include: {
        usuarios: {
          select: {
            id: true,
            nome: true,
            email: true,
            cargo: true,
          },
        },
        flats: {
          select: {
            id: true,
            status: true,
            valorPadrao: true,
          },
        },
        contratos: {
          where: { status: "ATIVO" },
          select: {
            id: true,
            valorMensal: true,
            status: true,
          },
        },
        contasReceber: {
          where: { status: "PAGO" },
          select: {
            valor: true,
            valorPago: true,
          },
        },
        _count: {
          select: {
            flats: true,
            contratos: true,
            locatarios: true,
            fornecedores: true,
          },
        },
      },
      orderBy: [
        { isMestre: "desc" },
        { createdAt: "desc" },
      ],
    });

    let totalEmpresasContratantes = 0;
    let empresasAtivas = 0;
    let empresasTrial = 0;
    let empresasExpiradas = 0;
    let mrrSaaSTotal = 0;
    let volumeTotalAluguelMensal = 0;
    let totalFlatsGlobal = 0;
    let totalFlatsOcupadosGlobal = 0;
    let totalContratosAtivosGlobal = 0;

    const empresasComStatus = await Promise.all(
      empresas.map(async (emp) => {
        const statusAcesso = await verificarStatusAcesso(emp.id);

        const totalFlats = emp._count.flats;
        const flatsOcupados = emp.flats.filter((f) => f.status === "OCUPADO").length;
        const taxaOcupacao = totalFlats > 0 ? Math.round((flatsOcupados / totalFlats) * 100) : 0;

        const totalContratosAtivos = emp.contratos.length;
        const volumeAluguelMensal = emp.contratos.reduce((acc, c) => acc + (c.valorMensal || 0), 0);

        const totalRecebidoHistorico = emp.contasReceber.reduce(
          (acc, cr) => acc + (cr.valorPago || cr.valor || 0),
          0
        );

        // Determinar valor estimado da mensalidade SaaS da empresa
        let mensalidadeSaaS = 0;
        if (!emp.isMestre) {
          const plano = (emp.planoAtual || "MENSAL").toUpperCase();
          if (plano === "MENSAL" || plano === "TRIAL") mensalidadeSaaS = saasConfig.valorMensal;
          else if (plano === "TRIMESTRAL") mensalidadeSaaS = Math.round(saasConfig.valorTrimestral / 3);
          else if (plano === "SEMESTRAL") mensalidadeSaaS = Math.round(saasConfig.valorSemestral / 6);
          else if (plano === "ANUAL") mensalidadeSaaS = Math.round(saasConfig.valorAnual / 12);
          else mensalidadeSaaS = saasConfig.valorMensal;
        }

        // Estatísticas Globais
        if (!emp.isMestre) {
          totalEmpresasContratantes++;
          if (statusAcesso.status === "ATIVO") {
            empresasAtivas++;
            mrrSaaSTotal += mensalidadeSaaS;
          } else if (statusAcesso.status === "TRIAL") {
            empresasTrial++;
          } else {
            empresasExpiradas++;
          }

          volumeTotalAluguelMensal += volumeAluguelMensal;
          totalFlatsGlobal += totalFlats;
          totalFlatsOcupadosGlobal += flatsOcupados;
          totalContratosAtivosGlobal += totalContratosAtivos;
        }

        return {
          id: emp.id,
          nomeFantasia: emp.nomeFantasia,
          razaoSocial: emp.razaoSocial,
          cnpj: emp.cnpj,
          email: emp.email,
          telefone: emp.telefone,
          cidade: emp.cidade,
          estado: emp.estado,
          createdAt: emp.createdAt,
          statusAssinatura: emp.statusAssinatura,
          dataInicioTrial: emp.dataInicioTrial,
          dataFimTrial: emp.dataFimTrial,
          dataFimAcesso: emp.dataFimAcesso,
          planoAtual: emp.planoAtual,
          isMestre: Boolean(emp.isMestre),
          ultimoAvisoWhatsAppEm: emp.ultimoAvisoWhatsAppEm,
          usuarios: emp.usuarios,
          counts: emp._count,
          statusAcesso,
          metrics: {
            totalFlats,
            flatsOcupados,
            taxaOcupacao,
            totalContratosAtivos,
            volumeAluguelMensal,
            totalRecebidoHistorico,
            mensalidadeSaaS,
          },
        };
      })
    );

    const taxaOcupacaoGlobal =
      totalFlatsGlobal > 0 ? Math.round((totalFlatsOcupadosGlobal / totalFlatsGlobal) * 100) : 0;

    const summarySaaS = {
      totalEmpresasContratantes,
      empresasAtivas,
      empresasTrial,
      empresasExpiradas,
      mrrSaaSTotal,
      arrSaaSTotal: mrrSaaSTotal * 12,
      volumeTotalAluguelMensal,
      totalFlatsGlobal,
      totalFlatsOcupadosGlobal,
      taxaOcupacaoGlobal,
      totalContratosAtivosGlobal,
    };

    return NextResponse.json({
      empresas: empresasComStatus,
      summary: summarySaaS,
      config: saasConfig,
    });
  } catch (error: any) {
    console.error("Erro ao listar empresas SaaS:", error);
    return NextResponse.json({ error: error.message || "Erro ao listar empresas" }, { status: 500 });
  }
}
