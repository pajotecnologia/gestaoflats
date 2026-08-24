import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailViaSmtp } from "@/lib/smtpService";
import { getAppBaseUrl } from "@/lib/baseUrl";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Informe o e-mail cadastrado." }, { status: 400 });
    }

    const emailLimpo = email.trim().toLowerCase();

    const user = await prisma.usuario.findUnique({
      where: { email: emailLimpo },
      include: { empresa: { include: { configuracaoParametros: true } } },
    });

    if (!user) {
      // Para segurança (prevenção de enumeração de e-mails), retorna sucesso genérico
      return NextResponse.json({
        success: true,
        message: "Se o e-mail estiver cadastrado, você receberá o link de recuperação.",
      });
    }

    // Gerar Token de Recuperação Seguro (HEX de 32 bytes) com validade de 15 minutos
    const token = crypto.randomBytes(24).toString("hex");
    const validade = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await prisma.usuario.update({
      where: { id: user.id },
      data: {
        tokenRecuperacaoSenha: token,
        validadeTokenRecuperacao: validade,
      },
    });

    const baseUrl = getAppBaseUrl(request);
    const resetLink = `${baseUrl}/redefinir-senha?token=${token}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #38bdf8; text-align: center;">🔐 Recuperação de Senha</h2>
        <p>Olá <strong>${user.nome}</strong>,</p>
        <p>Recebemos uma solicitação para redefinir a senha de acesso ao sistema da <strong>${user.empresa.nomeFantasia}</strong>.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetLink}" style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Redefinir Minha Senha</a>
        </div>
        <p style="font-size: 12px; color: #94a3b8;">Este link expira em 15 minutos. Caso não tenha solicitado, ignore este e-mail.</p>
      </div>
    `;

    const smtpConfig = user.empresa.configuracaoParametros;
    let emailResult = null;

    if (smtpConfig && smtpConfig.smtpUser && smtpConfig.smtpPass) {
      emailResult = await sendEmailViaSmtp(
        smtpConfig,
        user.email,
        "Instruções para Redefinição de Senha",
        htmlContent
      );
    }

    return NextResponse.json({
      success: true,
      message: "Se o e-mail estiver cadastrado, você receberá as instruções de redefinição.",
      resetLinkDemo: process.env.NODE_ENV !== "production" ? resetLink : undefined,
      emailResult,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao processar solicitação." }, { status: 500 });
  }
}
