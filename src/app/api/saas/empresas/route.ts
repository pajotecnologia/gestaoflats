import { NextResponse } from "next/server";
import { getAuthSessionOrFallback, isUserSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verificarStatusAcesso, getSaasConfig } from "@/lib/saasConfig";
import { calculateDataUriBytes, formatBytes } from "@/lib/imageOptimizer";

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
            assinaturaUrl: true,
          },
        },
        flats: {
          select: {
            id: true,
            status: true,
            valorPadrao: true,
            fotosUrl: true,
          },
        },
        vistoriasChecklist: {
          select: {
            id: true,
            tipoVistoria: true,
            itensJson: true,
            assinaturaLocatarioUrl: true,
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
            vistoriasChecklist: true,
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
    let totalStorageBytesGlobal = 0;

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

        // 💾 Cálculo Preciso do Consumo de Storage / Espaço em Disco
        let flatStorageBytes = 0;
        let flatPhotosCount = 0;
        emp.flats.forEach((f) => {
          if (f.fotosUrl) {
            try {
              const parsed: string[] = JSON.parse(f.fotosUrl);
              if (Array.isArray(parsed)) {
                parsed.forEach((url) => {
                  flatStorageBytes += calculateDataUriBytes(url);
                  flatPhotosCount++;
                });
              }
            } catch (e) {
              flatStorageBytes += calculateDataUriBytes(f.fotosUrl);
              flatPhotosCount++;
            }
          }
        });

        let vistoriaStorageBytes = 0;
        let vistoriaPhotosCount = 0;
        emp.vistoriasChecklist.forEach((v) => {
          if (v.itensJson) {
            try {
              const parsed = JSON.parse(v.itensJson);
              const items = Array.isArray(parsed) ? parsed : (parsed.itens || []);
              items.forEach((item: any) => {
                if (item.fotos && Array.isArray(item.fotos)) {
                  item.fotos.forEach((foto: string) => {
                    vistoriaStorageBytes += calculateDataUriBytes(foto);
                    vistoriaPhotosCount++;
                  });
                } else if (item.foto) {
                  vistoriaStorageBytes += calculateDataUriBytes(item.foto);
                  vistoriaPhotosCount++;
                }
              });
            } catch (e) {
              vistoriaStorageBytes += calculateDataUriBytes(v.itensJson);
            }
          }
          if (v.assinaturaLocatarioUrl) {
            vistoriaStorageBytes += calculateDataUriBytes(v.assinaturaLocatarioUrl);
          }
        });

        let assetsStorageBytes = 0;
        assetsStorageBytes += calculateDataUriBytes(emp.logomarcaUrl);
        assetsStorageBytes += calculateDataUriBytes(emp.assinaturaUrl);
        emp.usuarios.forEach((u) => {
          assetsStorageBytes += calculateDataUriBytes(u.assinaturaUrl);
        });

        const totalStorageBytes = flatStorageBytes + vistoriaStorageBytes + assetsStorageBytes;
        totalStorageBytesGlobal += totalStorageBytes;

        const maxStorageGB = emp.isMestre ? 999 : ((statusAcesso as any).limiteStorageGB || 5);
        const maxStorageBytes = maxStorageGB * 1024 * 1024 * 1024;
        const storagePercentage = Math.min(100, Math.max(1, Math.round((totalStorageBytes / maxStorageBytes) * 100)));

        // Determinar valor estimado da mensalidade SaaS da empresa
        let mensalidadeSaaS = 0;
        if (!emp.isMestre) {
          const plano = (emp.planoAtual || "PROFISSIONAL").toUpperCase();
          if (plano === "ESSENCIAL") mensalidadeSaaS = 79;
          else if (plano === "PROFISSIONAL" || plano === "MENSAL" || plano === "TRIAL") mensalidadeSaaS = 149;
          else if (plano === "GESTAO" || plano === "SEMESTRAL") mensalidadeSaaS = 279;
          else if (plano === "EMPRESARIAL" || plano === "ANUAL") mensalidadeSaaS = 449;
          else if (plano === "ENTERPRISE") mensalidadeSaaS = 599;
          else mensalidadeSaaS = 149;
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
          storage: {
            totalBytes: totalStorageBytes,
            totalFormatted: formatBytes(totalStorageBytes),
            maxStorageGB,
            maxFormatted: `${maxStorageGB} GB`,
            percentage: storagePercentage,
            breakdown: {
              flats: {
                bytes: flatStorageBytes,
                formatted: formatBytes(flatStorageBytes),
                photosCount: flatPhotosCount,
              },
              vistorias: {
                bytes: vistoriaStorageBytes,
                formatted: formatBytes(vistoriaStorageBytes),
                photosCount: vistoriaPhotosCount,
              },
              assets: {
                bytes: assetsStorageBytes,
                formatted: formatBytes(assetsStorageBytes),
              },
            },
          },
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
      totalStorageBytesGlobal,
      totalStorageFormattedGlobal: formatBytes(totalStorageBytesGlobal),
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
