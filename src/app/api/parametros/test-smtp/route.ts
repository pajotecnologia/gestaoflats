import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailViaSmtp } from "@/lib/smtpService";

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { testEmail, smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, smtpFromEmail } =
      await request.json();

    if (!testEmail) {
      return NextResponse.json(
        { error: "Informe o e-mail de destino para o teste." },
        { status: 400 }
      );
    }

    let config = {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpSecure,
      smtpFromEmail,
    };

    if (!smtpUser || !smtpPass) {
      const savedConfig = await prisma.configuracaoParametros.findUnique({
        where: { empresaId: session.empresaId },
      });
      if (savedConfig) {
        config = {
          smtpHost: savedConfig.smtpHost,
          smtpPort: savedConfig.smtpPort,
          smtpUser: savedConfig.smtpUser,
          smtpPass: savedConfig.smtpPass,
          smtpSecure: savedConfig.smtpSecure,
          smtpFromEmail: savedConfig.smtpFromEmail,
        };
      }
    }

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; borderRadius: 12px;">
        <h2 style="color: #38bdf8;">🎉 Teste de Envio de E-mail via SMTP Gmail</h2>
        <p>Este e-mail confirma que as configurações de SMTP do seu sistema de <strong>Gestão de Flats & Aluguéis</strong> estão ativas e funcionando perfeitamente!</p>
        <hr style="border: 1px solid #334155;" />
        <p style="font-size: 12px; color: #94a3b8;">Enviado em: ${new Date().toLocaleString("pt-BR")}</p>
      </div>
    `;

    const result = await sendEmailViaSmtp(
      config,
      testEmail,
      "Teste de Configuração SMTP Gmail - Gestão de Flats",
      html
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao testar envio SMTP." }, { status: 500 });
  }
}
