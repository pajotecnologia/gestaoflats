import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { getEmpresaInterConfig, testarConexaoBancoInter, BancoInterConfig } from "@/lib/bancoInter";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const dbConfig = await getEmpresaInterConfig(session.empresaId).catch(() => null);

    const isMaskedSecret = !body.clientSecret || body.clientSecret.includes("...") || body.clientSecret.includes("•") || body.clientSecret.includes("*");
    const clientId = body.clientId?.trim() || dbConfig?.clientId || "";
    const clientSecret = isMaskedSecret ? (dbConfig?.clientSecret || "") : body.clientSecret.trim();
    const certCrt = body.certCrt || dbConfig?.certCrt || "";
    const certKey = body.certKey || dbConfig?.certKey || "";

    if (!clientId) {
      return NextResponse.json({
        success: false,
        message: "Client ID é obrigatório. Informe o Client ID gerado no Internet Banking PJ do Banco Inter.",
      }, { status: 400 });
    }

    if (!clientSecret) {
      return NextResponse.json({
        success: false,
        message: "Client Secret é obrigatório. Cole o Client Secret gerado no Internet Banking PJ do Banco Inter.",
      }, { status: 400 });
    }

    // Se o usuário digitou um Client ID diferente do banco mas manteve o segredo antigo mascarado
    if (body.clientId && dbConfig?.clientId && body.clientId.trim() !== dbConfig.clientId.trim() && isMaskedSecret) {
      return NextResponse.json({
        success: false,
        message: "Você alterou o Client ID na tela. Por favor, cole também o novo Client Secret correspondente gerado no Banco Inter para esta aplicação.",
      }, { status: 400 });
    }

    // Se o usuário digitou um Client ID diferente do banco mas não fez upload dos novos certificados
    if (body.clientId && dbConfig?.clientId && body.clientId.trim() !== dbConfig.clientId.trim() && (!body.certCrt || !body.certKey)) {
      return NextResponse.json({
        success: false,
        message: "Você alterou o Client ID. É necessário fazer o upload dos novos arquivos .crt e .key extraídos do .zip desta nova aplicação gerada no Banco Inter.",
      }, { status: 400 });
    }

    if (!certCrt || !certKey) {
      return NextResponse.json({
        success: false,
        message: "Certificado (.crt) e Chave Privada (.key) são obrigatórios. Selecione os arquivos extraídos do .zip do Banco Inter.",
      }, { status: 400 });
    }

    const config: BancoInterConfig = {
      clientId,
      clientSecret,
      certCrt,
      certKey,
      ambiente: body.ambiente || dbConfig?.ambiente || "PRODUCAO",
      contaCorrente: body.contaCorrente || dbConfig?.contaCorrente || undefined,
    };

    const resultado = await testarConexaoBancoInter(config);
    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao testar conexão com Banco Inter." },
      { status: 400 }
    );
  }
}
