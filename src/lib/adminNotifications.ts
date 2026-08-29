import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { getSaasConfig } from "@/lib/saasConfig";

export interface NovoCadastroData {
  nomeEmpresa: string;
  cnpj?: string | null;
  telefone?: string | null;
  nomeAdmin: string;
  email: string;
  cidade?: string | null;
  estado?: string | null;
  diasTrial: number;
  dataFimTrial: Date;
}

export interface NovaContratacaoData {
  nomeEmpresa: string;
  cnpj?: string | null;
  telefone?: string | null;
  nomeAdmin?: string | null;
  email?: string | null;
  plano: string;
  valor: number;
  formaPagamento?: string;
  comprovanteUrl?: string | null;
  observacoes?: string | null;
}

/**
 * Recupera as credenciais de SMTP e e-mail do Super Admin
 */
async function getAdminEmailConfig() {
  try {
    const saasConfig = await getSaasConfig();
    const paramsConfig = await prisma.configuracaoParametros.findFirst({
      where: { smtpUser: { not: null } },
    });

    const emailDestino =
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      saasConfig?.emailNotificacaoAdmin ||
      "pajotecnologia@gmail.com";

    const smtpHost = process.env.SMTP_HOST || paramsConfig?.smtpHost || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT || paramsConfig?.smtpPort || 465);
    const smtpUser = process.env.SMTP_USER || paramsConfig?.smtpUser || null;
    const smtpPass = process.env.SMTP_PASS || paramsConfig?.smtpPass || null;
    const smtpFrom = process.env.SMTP_FROM || paramsConfig?.smtpFromEmail || smtpUser || "nao-responder@gestaoflats.pajotech.com.br";

    return {
      emailDestino: String(emailDestino),
      smtpHost: String(smtpHost),
      smtpPort,
      smtpUser,
      smtpPass,
      smtpFrom: String(smtpFrom),
    };
  } catch (err) {
    return {
      emailDestino: "pajotecnologia@gmail.com",
      smtpHost: "smtp.gmail.com",
      smtpPort: 465,
      smtpUser: null,
      smtpPass: null,
      smtpFrom: "nao-responder@gestaoflats.pajotech.com.br",
    };
  }
}

/**
 * Envia e-mail de notificação para o Super Admin quando uma nova empresa se cadastra
 */
export async function notifyAdminNovoCadastro(data: NovoCadastroData): Promise<boolean> {
  try {
    const config = await getAdminEmailConfig();

    if (!config.smtpUser || !config.smtpPass) {
      console.log(`[Notificação Admin] Novo cadastro: ${data.nomeEmpresa} (${data.email}), mas SMTP não está configurado.`);
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });

    const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date());

    const dataFimTrialFormatada = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
    }).format(data.dataFimTrial);

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f1f5f9; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="background-color: #1e3a8a; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px;">🚀 Novo Cadastro de Cliente (Trial)</h2>
            <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 13px;">Gestão de Flats SaaS</p>
          </div>

          <div style="padding: 24px; color: #1e293b;">
            <p style="font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
              Uma nova empresa acabou de se registrar na plataforma e iniciou o período de <strong>${data.diasTrial} dias de teste grátis</strong>.
            </p>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b; font-weight: bold; width: 35%;">Empresa:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${data.nomeEmpresa}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">CNPJ / CPF:</td>
                <td style="padding: 8px 0; color: #0f172a;">${data.cnpj || "Não informado"}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Administrador:</td>
                <td style="padding: 8px 0; color: #0f172a;">${data.nomeAdmin}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">E-mail:</td>
                <td style="padding: 8px 0; color: #2563eb;"><a href="mailto:${data.email}" style="color: #2563eb; text-decoration: none;">${data.email}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Telefone / WhatsApp:</td>
                <td style="padding: 8px 0; color: #0f172a;">${data.telefone || "Não informado"}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Cidade / UF:</td>
                <td style="padding: 8px 0; color: #0f172a;">${data.cidade || "N/D"}${data.estado ? ` - ${data.estado}` : ""}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Data do Cadastro:</td>
                <td style="padding: 8px 0; color: #0f172a;">${dataFormatada}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Fim do Teste Grátis:</td>
                <td style="padding: 8px 0; color: #d97706; font-weight: bold;">${dataFimTrialFormatada} (${data.diasTrial} dias)</td>
              </tr>
            </table>

            <div style="text-align: center; margin-top: 24px;">
              <a href="https://gestaoflats.pajotech.com.br/parametros?aba=saas" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 13px; display: inline-block;">
                Acessar Painel de Gestão SaaS
              </a>
            </div>
          </div>

          <div style="background-color: #f8fafc; padding: 12px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
            Sistema de Gestão de Flats SaaS • Notificação Automática ao Super Admin
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Gestão de Flats" <${config.smtpFrom}>`,
      to: config.emailDestino,
      subject: `🚀 Novo Cadastro: ${data.nomeEmpresa} (Teste de ${data.diasTrial} dias)`,
      html,
    });

    return true;
  } catch (err) {
    console.error("Erro ao enviar e-mail de notificação de novo cadastro para Super Admin:", err);
    return false;
  }
}

/**
 * Envia e-mail de notificação para o Super Admin quando um cliente contrata ou renova um plano
 */
export async function notifyAdminNovaContratacao(data: NovaContratacaoData): Promise<boolean> {
  try {
    const config = await getAdminEmailConfig();

    if (!config.smtpUser || !config.smtpPass) {
      console.log(`[Notificação Admin] Nova contratação: ${data.nomeEmpresa} (Plano ${data.plano}), mas SMTP não está configurado.`);
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });

    const valorFormatado = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(data.valor);

    const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date());

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f1f5f9; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="background-color: #059669; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px;">💰 Nova Contratação / Renovação Confirmada!</h2>
            <p style="color: #a7f3d0; margin: 4px 0 0 0; font-size: 13px;">Gestão de Flats SaaS</p>
          </div>

          <div style="padding: 24px; color: #1e293b;">
            <p style="font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
              O cliente confirmou a contratação do <strong>Plano ${data.plano.toUpperCase()}</strong> no valor de <strong>${valorFormatado}</strong>.
            </p>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b; font-weight: bold; width: 35%;">Empresa:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${data.nomeEmpresa}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Plano Escolhido:</td>
                <td style="padding: 8px 0; color: #059669; font-weight: bold;">${data.plano.toUpperCase()}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Valor do Pagamento:</td>
                <td style="padding: 8px 0; color: #059669; font-weight: bold;">${valorFormatado}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Forma de Pagamento:</td>
                <td style="padding: 8px 0; color: #0f172a;">${data.formaPagamento || "PIX Instantâneo"}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Contato / Telefone:</td>
                <td style="padding: 8px 0; color: #0f172a;">${data.telefone || "Não informado"}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">E-mail:</td>
                <td style="padding: 8px 0; color: #2563eb;">${data.email || "Não informado"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Data / Hora:</td>
                <td style="padding: 8px 0; color: #0f172a;">${dataFormatada}</td>
              </tr>
            </table>

            <div style="text-align: center; margin-top: 24px;">
              <a href="https://gestaoflats.pajotech.com.br/parametros?aba=saas" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 13px; display: inline-block;">
                Liberar / Gerenciar Acesso no Painel
              </a>
            </div>
          </div>

          <div style="background-color: #f8fafc; padding: 12px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
            Sistema de Gestão de Flats SaaS • Notificação Automática ao Super Admin
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Gestão de Flats" <${config.smtpFrom}>`,
      to: config.emailDestino,
      subject: `💰 Nova Contratação: ${data.nomeEmpresa} (Plano ${data.plano} - ${valorFormatado})`,
      html,
    });

    return true;
  } catch (err) {
    console.error("Erro ao enviar e-mail de contratação para Super Admin:", err);
    return false;
  }
}
