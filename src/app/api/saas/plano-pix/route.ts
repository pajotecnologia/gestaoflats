import { NextRequest, NextResponse } from "next/server";
import { getSaasConfig } from "@/lib/saasConfig";
import { generatePixPayload, generatePixQRCode } from "@/lib/pix";
import { prisma } from "@/lib/prisma";
import { SAAS_PLANS } from "@/lib/plans/planDefinitions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planoParam = (searchParams.get("plano") || "PROFISSIONAL").toUpperCase();
    const cicloParam = (searchParams.get("ciclo") || "MENSAL").toUpperCase();
    const empresaId = searchParams.get("empresaId");

    const config = await getSaasConfig();

    // Mapeamento dos planos oficiais
    let targetPlan = SAAS_PLANS[planoParam] || SAAS_PLANS.PROFISSIONAL;

    let valor = cicloParam === "ANUAL" ? targetPlan.priceYearlyTotal : targetPlan.priceMonthly;
    let nomePlano = `${targetPlan.name} (${cicloParam === "ANUAL" ? "Anual com Desconto" : "Mensal"})`;
    let periodoTexto = cicloParam === "ANUAL" 
      ? `12 meses de acesso (Economia de até 20% • R$ ${targetPlan.priceYearlyMonthlyEquivalent.toFixed(2)}/mês equivalente)`
      : `1 mês de acesso completo • Até ${targetPlan.limits.maxProperties} imóveis`;

    let empresaNome = "Minha Empresa";
    if (empresaId) {
      const emp = await prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { nomeFantasia: true },
      });
      if (emp) empresaNome = emp.nomeFantasia;
    }

    let pixCopiaCola = "";
    let pixQrCodeBase64 = "";
    let txid = `IMOB${targetPlan.slug.substring(0, 3)}${Date.now().toString().slice(-8)}`;
    let cobrancaId = "";
    let linhaDigitavel = "";
    let isBancoInter = false;

    // 1. Tenta emitir via Banco Inter se empresaId estiver presente
    if (empresaId) {
      try {
        const { emitirCobrancaSaaSBancoInter } = await import("@/lib/bancoInterSaaS");
        const resInter = await emitirCobrancaSaaSBancoInter({
          empresaId,
          planoSlug: targetPlan.slug,
          ciclo: cicloParam as "MENSAL" | "ANUAL",
        });

        if (resInter && resInter.pixCopiaECola) {
          pixCopiaCola = resInter.pixCopiaECola;
          pixQrCodeBase64 = resInter.qrCodeBase64;
          txid = resInter.codigoSolicitacao || txid;
          cobrancaId = resInter.cobrancaId;
          linhaDigitavel = resInter.linhaDigitavel || "";
          isBancoInter = true;
        }
      } catch (interErr: any) {
        console.warn("Aviso: Falha ao emitir cobrança dinâmica no Banco Inter, usando PIX estático:", interErr.message);
      }
    }

    // 2. Fallback para PIX estático padrão
    if (!pixCopiaCola) {
      pixCopiaCola = generatePixPayload({
        chave: config.chavePix,
        nomeBeneficiario: config.nomeBeneficiarioPix,
        cidadeBeneficiario: config.cidadePix,
        valor: valor,
        identificador: txid,
      });
      pixQrCodeBase64 = await generatePixQRCode(pixCopiaCola);
    }

    return NextResponse.json({
      config: {
        chavePix: config.chavePix,
        tipoChavePix: config.tipoChavePix,
        nomeBeneficiarioPix: config.nomeBeneficiarioPix,
        cidadePix: config.cidadePix,
        telefoneSuporteWhatsApp: config.telefoneSuporteWhatsApp,
      },
      planoSelecionado: {
        tipo: targetPlan.slug,
        nome: nomePlano,
        ciclo: cicloParam,
        periodoTexto,
        valor,
        limiteImoveis: targetPlan.limits.maxProperties,
        limiteUsuarios: targetPlan.limits.maxUsers,
        limiteAssinaturas: targetPlan.limits.maxSignaturesPerMonth,
        limiteStorageGB: targetPlan.limits.maxStorageGB,
      },
      pix: {
        copiaCola: pixCopiaCola,
        qrCodeBase64: pixQrCodeBase64,
        txid,
        cobrancaId,
        linhaDigitavel,
        isBancoInter,
      },
      empresaNome,
    });
  } catch (error: any) {
    console.error("Erro ao gerar PIX para plano IMOB:", error);
    return NextResponse.json({ error: error.message || "Erro ao gerar PIX" }, { status: 500 });
  }
}
