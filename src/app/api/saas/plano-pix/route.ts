import { NextRequest, NextResponse } from "next/server";
import { getSaasConfig } from "@/lib/saasConfig";
import { generatePixPayload, generatePixQRCode } from "@/lib/pix";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const plano = searchParams.get("plano") || "MENSAL";
    const empresaId = searchParams.get("empresaId");

    const config = await getSaasConfig();

    let valor = config.valorMensal;
    let nomePlano = "Plano Mensal";
    let periodoTexto = "1 mês de acesso completo";

    if (plano === "TRIMESTRAL") {
      valor = config.valorTrimestral;
      nomePlano = "Plano Trimestral";
      periodoTexto = "3 meses de acesso (Economize 10%)";
    } else if (plano === "SEMESTRAL") {
      valor = config.valorSemestral;
      nomePlano = "Plano Semestral";
      periodoTexto = "6 meses de acesso (Economize 15%)";
    } else if (plano === "ANUAL") {
      valor = config.valorAnual;
      nomePlano = "Plano Anual";
      periodoTexto = "12 meses de acesso (Melhor Custo-Benefício - Economize 25%)";
    }

    let empresaNome = "Minha Empresa";
    if (empresaId) {
      const emp = await prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { nomeFantasia: true },
      });
      if (emp) empresaNome = emp.nomeFantasia;
    }

    // Gerar identificador amigável de TxID (até 25 caracteres)
    const txid = `SAAS${plano.substring(0, 3)}${Date.now().toString().slice(-8)}`;

    const pixCopiaCola = generatePixPayload({
      chave: config.chavePix,
      nomeBeneficiario: config.nomeBeneficiarioPix,
      cidadeBeneficiario: config.cidadePix,
      valor: valor,
      identificador: txid,
    });

    const pixQrCodeBase64 = await generatePixQRCode(pixCopiaCola);

    return NextResponse.json({
      config: {
        chavePix: config.chavePix,
        tipoChavePix: config.tipoChavePix,
        nomeBeneficiarioPix: config.nomeBeneficiarioPix,
        cidadePix: config.cidadePix,
        telefoneSuporteWhatsApp: config.telefoneSuporteWhatsApp,
        valores: {
          MENSAL: config.valorMensal,
          TRIMESTRAL: config.valorTrimestral,
          SEMESTRAL: config.valorSemestral,
          ANUAL: config.valorAnual,
        },
      },
      planoSelecionado: {
        tipo: plano,
        nome: nomePlano,
        periodoTexto,
        valor,
      },
      pix: {
        copiaCola: pixCopiaCola,
        qrCodeBase64: pixQrCodeBase64,
        txid,
      },
      empresaNome,
    });
  } catch (error: any) {
    console.error("Erro ao gerar PIX para plano:", error);
    return NextResponse.json({ error: error.message || "Erro ao gerar PIX" }, { status: 500 });
  }
}
