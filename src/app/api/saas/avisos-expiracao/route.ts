import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSaasConfig } from "@/lib/saasConfig";
import { getAppBaseUrl } from "@/lib/baseUrl";
import { sendWhatsAppMessage } from "@/lib/evolutionApi";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSessionOrFallback();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const config = await getSaasConfig();
    const agora = new Date();
    const baseUrl = getAppBaseUrl(request);

    const diasAviso = config.diasAvisoAntesExpirar || 3;
    const dataLimiteAviso = new Date(agora.getTime() + diasAviso * 24 * 60 * 60 * 1000);

    // Buscar empresas cadastradas
    const empresas = await prisma.empresa.findMany({
      include: {
        usuarios: {
          where: { cargo: "ADMIN" },
          take: 1,
        },
        configuracaoParametros: true,
      },
    });

    // Encontrar uma instância Evolution API conectada para disparar (da primeira empresa ou do sistema)
    const masterParametros = await prisma.configuracaoParametros.findFirst({
      where: { statusConexao: "CONECTADO" },
    });

    const resultados: Array<{
      empresaId: string;
      nomeFantasia: string;
      telefone: string;
      statusEnvio: string;
      mensagem?: string;
      diasRestantes: number;
    }> = [];

    for (const emp of empresas) {
      const dataLimite = emp.dataFimAcesso || emp.dataFimTrial;
      if (!dataLimite) continue;

      const diffMs = dataLimite.getTime() - agora.getTime();
      const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Se a data de expiração está dentro da janela de aviso (<= diasAviso)
      if (diasRestantes <= diasAviso) {
        // Verificar se já enviou hoje
        if (emp.ultimoAvisoWhatsAppEm) {
          const ultimoEnvio = new Date(emp.ultimoAvisoWhatsAppEm);
          if (
            ultimoEnvio.getDate() === agora.getDate() &&
            ultimoEnvio.getMonth() === agora.getMonth() &&
            ultimoEnvio.getFullYear() === agora.getFullYear()
          ) {
            resultados.push({
              empresaId: emp.id,
              nomeFantasia: emp.nomeFantasia,
              telefone: emp.telefone,
              statusEnvio: "IGNORADO_JA_ENVIADO_HOJE",
              diasRestantes,
            });
            continue;
          }
        }

        const adminUser = emp.usuarios[0];
        const nomeResponsavel = adminUser?.nome || emp.nomeFantasia;
        const telefoneDestino = emp.telefone || adminUser?.email;
        const linkRenovacao = `${baseUrl}/renovar?empresaId=${emp.id}`;
        const dataExpiracaoFormatada = dataLimite.toLocaleDateString("pt-BR");

        // Montar mensagem personalizada a partir do template
        let textoMensagem = config.mensagemAvisoWhatsApp || DEFAULT_MENSAGEM;
        textoMensagem = textoMensagem
          .replace(/\{\{nome\}\}/g, nomeResponsavel)
          .replace(/\{\{empresa\}\}/g, emp.nomeFantasia)
          .replace(/\{\{dias_restantes\}\}/g, Math.max(0, diasRestantes).toString())
          .replace(/\{\{data_expiracao\}\}/g, dataExpiracaoFormatada)
          .replace(/\{\{link_renovacao\}\}/g, linkRenovacao);

        let envioSucesso = false;
        const paramsEnvio = emp.configuracaoParametros?.statusConexao === "CONECTADO"
          ? emp.configuracaoParametros
          : masterParametros;

        if (paramsEnvio && paramsEnvio.evolutionApiUrl && paramsEnvio.evolutionApiKey && paramsEnvio.evolutionInstance && telefoneDestino) {
          try {
            await sendWhatsAppMessage(
              {
                evolutionApiUrl: paramsEnvio.evolutionApiUrl,
                evolutionApiKey: paramsEnvio.evolutionApiKey,
                evolutionInstance: paramsEnvio.evolutionInstance,
              },
              telefoneDestino,
              textoMensagem
            );
            envioSucesso = true;
          } catch (err: any) {
            console.error(`Erro ao enviar WhatsApp para empresa ${emp.nomeFantasia}:`, err);
          }
        }

        // Atualizar data de último aviso
        await prisma.empresa.update({
          where: { id: emp.id },
          data: {
            ultimoAvisoWhatsAppEm: agora,
            statusAssinatura: diasRestantes < 0 ? "EXPIRADO" : emp.statusAssinatura,
          },
        });

        resultados.push({
          empresaId: emp.id,
          nomeFantasia: emp.nomeFantasia,
          telefone: telefoneDestino || "Não informado",
          statusEnvio: envioSucesso ? "ENVIADO_SUCESSO" : "REGISTRADO_SEM_WHATSAPP_CONECTADO",
          mensagem: textoMensagem,
          diasRestantes,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalVerificadas: empresas.length,
      avisosProcessados: resultados.length,
      detalhes: resultados,
    });
  } catch (error: any) {
    console.error("Erro no processamento de avisos de expiração:", error);
    return NextResponse.json({ error: error.message || "Erro no processamento" }, { status: 500 });
  }
}

const DEFAULT_MENSAGEM =
  "Olá, {{nome}}! Informamos que o período de teste do Gestão de Flats para a empresa {{empresa}} irá expirar em {{dias_restantes}} dia(s) (Data: {{data_expiracao}}). Para continuar utilizando todos os recursos sem interrupções, renove seu acesso no link: {{link_renovacao}}";
