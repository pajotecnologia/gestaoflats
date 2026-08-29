import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSaasConfig } from "@/lib/saasConfig";

export async function GET() {
  try {
    const config = await getSaasConfig();
    return NextResponse.json({ config });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao buscar configurações SaaS" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSessionOrFallback();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      diasTrialPadrao,
      chavePix,
      tipoChavePix,
      nomeBeneficiarioPix,
      cidadePix,
      valorMensal,
      valorTrimestral,
      valorSemestral,
      valorAnual,
      diasAvisoAntesExpirar,
      telefoneSuporteWhatsApp,
      mensagemAvisoWhatsApp,
      emailNotificacaoAdmin,
    } = body;

    const config = await prisma.configuracaoSaaS.upsert({
      where: { id: "saas-global-config" },
      update: {
        diasTrialPadrao: Number(diasTrialPadrao) || 7,
        chavePix: chavePix?.trim() || "",
        tipoChavePix: tipoChavePix || "EMAIL",
        nomeBeneficiarioPix: nomeBeneficiarioPix?.trim() || "PAJO TECNOLOGIA",
        cidadePix: cidadePix?.trim() || "RECIFE",
        valorMensal: Number(valorMensal) || 97,
        valorTrimestral: Number(valorTrimestral) || 260,
        valorSemestral: Number(valorSemestral) || 490,
        valorAnual: Number(valorAnual) || 890,
        diasAvisoAntesExpirar: Number(diasAvisoAntesExpirar) || 3,
        telefoneSuporteWhatsApp: telefoneSuporteWhatsApp?.trim() || "",
        mensagemAvisoWhatsApp: mensagemAvisoWhatsApp?.trim() || "",
      },
      create: {
        id: "saas-global-config",
        diasTrialPadrao: Number(diasTrialPadrao) || 7,
        chavePix: chavePix?.trim() || "",
        tipoChavePix: tipoChavePix || "EMAIL",
        nomeBeneficiarioPix: nomeBeneficiarioPix?.trim() || "PAJO TECNOLOGIA",
        cidadePix: cidadePix?.trim() || "RECIFE",
        valorMensal: Number(valorMensal) || 97,
        valorTrimestral: Number(valorTrimestral) || 260,
        valorSemestral: Number(valorSemestral) || 490,
        valorAnual: Number(valorAnual) || 890,
        diasAvisoAntesExpirar: Number(diasAvisoAntesExpirar) || 3,
        telefoneSuporteWhatsApp: telefoneSuporteWhatsApp?.trim() || "",
        mensagemAvisoWhatsApp: mensagemAvisoWhatsApp?.trim() || "",
      },
    });

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    console.error("Erro ao salvar parâmetros SaaS:", error);
    return NextResponse.json({ error: error.message || "Erro ao salvar parâmetros SaaS" }, { status: 500 });
  }
}
