import { NextRequest, NextResponse } from "next/server";
import { getSaasConfig } from "@/lib/saasConfig";
import { generatePixPayload, generatePixQRCode } from "@/lib/pix";
import { prisma } from "@/lib/prisma";
import { SAAS_PLANS } from "@/lib/plans/planDefinitions";
import { getActiveSaasPlans } from "@/lib/plans/planService";
import { getAuthSessionOrFallback } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return handlePlanoPix(request, body.plano, body.ciclo, body.empresaId, true);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao processar requisição" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const planoParam = (searchParams.get("plano") || "PROFISSIONAL").toUpperCase();
  const cicloParam = (searchParams.get("ciclo") || "MENSAL").toUpperCase();
  const empresaIdParam = searchParams.get("empresaId") || "";
  const emitir = searchParams.get("emitir") === "true";

  return handlePlanoPix(request, planoParam, cicloParam, empresaIdParam, emitir);
}

async function handlePlanoPix(
  request: NextRequest,
  planoParam: string = "PROFISSIONAL",
  cicloParam: string = "MENSAL",
  empresaIdParam: string = "",
  emitirCobranca: boolean = false
) {
  try {
    const planoUpper = (planoParam || "PROFISSIONAL").toUpperCase();
    const cicloUpper = (cicloParam || "MENSAL").toUpperCase();

    // Resolve empresaId via query param, sessão autenticada ou empresa padrão
    const session = await getAuthSessionOrFallback().catch(() => null);
    let empresaId = empresaIdParam || session?.empresaId || "";

    if (!empresaId) {
      const primeiraEmpresa = await prisma.empresa.findFirst({
        where: { isMestre: false },
        orderBy: { createdAt: "asc" },
      });
      if (primeiraEmpresa) {
        empresaId = primeiraEmpresa.id;
      }
    }

    const [config, activePlans] = await Promise.all([
      getSaasConfig(),
      getActiveSaasPlans(),
    ]);

    // Mapeamento dos planos oficiais ativos (incluindo customizações de preços e limites)
    let targetPlan = activePlans[planoUpper] || activePlans.PROFISSIONAL || SAAS_PLANS.PROFISSIONAL;

    let valor = cicloUpper === "ANUAL" ? targetPlan.priceYearlyTotal : targetPlan.priceMonthly;
    let nomePlano = `${targetPlan.name} (${cicloUpper === "ANUAL" ? "Anual com Desconto" : "Mensal"})`;
    let periodoTexto = cicloUpper === "ANUAL" 
      ? `12 meses de acesso (Economia de 10% • R$ ${targetPlan.priceYearlyMonthlyEquivalent.toFixed(2)}/mês equivalente)`
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

    // Só emite cobrança no Banco Inter se o usuário tiver clicado efetivamente no botão (emitirCobranca === true)
    if (emitirCobranca) {
      // 1. Tenta emitir via Banco Inter se empresaId estiver presente
      if (empresaId) {
        try {
          const { emitirCobrancaSaaSBancoInter } = await import("@/lib/bancoInterSaaS");
          const resInter = await emitirCobrancaSaaSBancoInter({
            empresaId,
            planoSlug: targetPlan.slug,
            ciclo: cicloUpper as "MENSAL" | "ANUAL",
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
        ciclo: cicloUpper,
        periodoTexto,
        valor,
        limiteImoveis: targetPlan.limits.maxProperties,
        limiteUsuarios: targetPlan.limits.maxUsers,
        limiteAssinaturas: targetPlan.limits.maxSignaturesPerMonth,
        limiteStorageGB: targetPlan.limits.maxStorageGB,
      },
      pix: emitirCobranca ? {
        copiaCola: pixCopiaCola,
        qrCodeBase64: pixQrCodeBase64,
        txid,
        cobrancaId,
        linhaDigitavel,
        isBancoInter,
      } : null,
      cobrancaEmitida: emitirCobranca,
      empresaNome,
    });
  } catch (error: any) {
    console.error("Erro ao processar plano PIX para IMOB:", error);
    return NextResponse.json({ error: error.message || "Erro ao processar PIX" }, { status: 500 });
  }
}
