import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailViaSmtp, EmailAttachment } from "@/lib/smtpService";
import { getAppBaseUrl } from "@/lib/baseUrl";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const {
      vistoriaId,
      toEmail,
      pdfBase64,
      customSubject,
      customMessage,
    } = await request.json();

    if (!toEmail || !toEmail.includes("@")) {
      return NextResponse.json({ error: "Endereço de e-mail de destino inválido." }, { status: 400 });
    }

    if (!vistoriaId) {
      return NextResponse.json({ error: "ID da vistoria não informado." }, { status: 400 });
    }

    // Buscar vistoria e empresa
    const vistoria = await prisma.vistoriaChecklist.findFirst({
      where: { id: vistoriaId, empresaId: session.empresaId },
      include: {
        flat: { include: { local: true } },
        locatario: true,
        empresa: true,
      },
    });

    if (!vistoria) {
      return NextResponse.json({ error: "Vistoria não encontrada." }, { status: 404 });
    }

    // Buscar parâmetros SMTP da empresa
    const configParam = await prisma.configuracaoParametros.findUnique({
      where: { empresaId: session.empresaId },
    });

    if (!configParam || !configParam.smtpUser || !configParam.smtpPass) {
      return NextResponse.json(
        { error: "Servidor SMTP não configurado. Por favor, configure o E-mail em Parâmetros do Sistema." },
        { status: 400 }
      );
    }

    const appUrl = getAppBaseUrl(request);
    const linkAssinatura = `${appUrl}/assinar/vistoria/${vistoria.tokenAssinatura}`;
    const flatNome = `${vistoria.flat?.local?.nome ? `${vistoria.flat.local.nome} - ` : ""}Flat ${vistoria.flat?.numero || ""}`;
    const locatarioNome = vistoria.locatario?.nome || "Locatário";

    const subject = customSubject || `Laudo de Vistoria de ${vistoria.tipoVistoria} - ${flatNome}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="color: #1e3a8a; margin: 0; font-size: 18px;">${vistoria.empresa.nomeFantasia}</h2>
          <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0;">Laudo de Vistoria de ${vistoria.tipoVistoria === "ENTRADA" ? "Entrada (Entrega de Chaves)" : "Saída (Devolução do Imóvel)"}</p>
        </div>

        <p style="color: #334155; font-size: 14px; line-height: 1.5;">
          Olá <strong>${locatarioNome}</strong>,
        </p>

        <p style="color: #334155; font-size: 14px; line-height: 1.5;">
          ${customMessage || `Informamos que o laudo de vistoria do imóvel <strong>${flatNome}</strong> foi concluído. Segue em anexo a cópia completa do laudo em formato PDF para simples conferência.`}
        </p>

        <div style="margin: 24px 0; text-align: center;">
          <a href="${linkAssinatura}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            👉 Acessar e Assinar Laudo Digitalmente
          </a>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.4;">
          Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:<br/>
          <a href="${linkAssinatura}" style="color: #2563eb;">${linkAssinatura}</a>
        </p>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center;">
          ${vistoria.empresa.nomeFantasia} • Telefone: ${vistoria.empresa.telefone || ""}<br/>
          Desenvolvimento: pajotecnologia.com.br
        </div>
      </div>
    `;

    const attachments: EmailAttachment[] = [];

    if (pdfBase64 && typeof pdfBase64 === "string") {
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "").trim();
      attachments.push({
        filename: `Laudo_Vistoria_${vistoria.tipoVistoria}_${vistoria.flat.numero.replace(/\s+/g, "_")}.pdf`,
        content: Buffer.from(cleanBase64, "base64"),
        contentType: "application/pdf",
      });
    }

    const emailResult = await sendEmailViaSmtp(
      {
        smtpHost: configParam.smtpHost,
        smtpPort: configParam.smtpPort,
        smtpUser: configParam.smtpUser,
        smtpPass: configParam.smtpPass,
        smtpSecure: configParam.smtpSecure,
        smtpFromEmail: configParam.smtpFromEmail,
      },
      toEmail,
      subject,
      htmlContent,
      attachments
    );

    if (emailResult.success) {
      return NextResponse.json({ success: true, message: emailResult.message });
    } else {
      return NextResponse.json({ error: emailResult.message }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
