import nodemailer from "nodemailer";

export interface SmtpConfig {
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
  smtpSecure?: boolean;
  smtpFromEmail?: string | null;
}

export async function sendEmailViaSmtp(
  config: SmtpConfig,
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; message: string }> {
  const {
    smtpHost = "smtp.gmail.com",
    smtpPort = 465,
    smtpUser,
    smtpPass,
    smtpSecure = true,
    smtpFromEmail,
  } = config;

  if (!smtpUser || !smtpPass) {
    return {
      success: false,
      message: "Credenciais de e-mail SMTP (Usuário e Senha de App) não configuradas.",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost || "smtp.gmail.com",
      port: Number(smtpPort) || 465,
      secure: Boolean(smtpSecure),
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const fromAddress = smtpFromEmail || smtpUser;

    const info = await transporter.sendMail({
      from: `"Gestão de Flats" <${fromAddress}>`,
      to,
      subject,
      html: htmlContent,
    });

    return {
      success: true,
      message: `E-mail enviado com sucesso! Message ID: ${info.messageId}`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Erro ao enviar e-mail via SMTP: ${error.message || error}`,
    };
  }
}
