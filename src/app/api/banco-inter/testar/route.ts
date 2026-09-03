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

    const config: BancoInterConfig = {
      clientId: body.clientId?.trim() || dbConfig?.clientId || "",
      clientSecret: (body.clientSecret && !body.clientSecret.includes("...")) ? body.clientSecret.trim() : (dbConfig?.clientSecret || ""),
      certCrt: body.certCrt || dbConfig?.certCrt || "",
      certKey: body.certKey || dbConfig?.certKey || "",
      ambiente: body.ambiente || dbConfig?.ambiente || "PRODUCAO",
      contaCorrente: body.contaCorrente || dbConfig?.contaCorrente || undefined,
    };

    if (!config.clientId || !config.clientSecret) {
      return NextResponse.json({
        success: false,
        message: "Client ID e Client Secret são obrigatórios. Preencha os campos ou salve as configurações.",
      }, { status: 400 });
    }

    if (!config.certCrt || !config.certKey) {
      return NextResponse.json({
        success: false,
        message: "Certificado (.crt) e Chave Privada (.key) são obrigatórios. Faça o upload dos arquivos.",
      }, { status: 400 });
    }

    const resultado = await testarConexaoBancoInter(config);
    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao testar conexão com Banco Inter." },
      { status: 400 }
    );
  }
}
