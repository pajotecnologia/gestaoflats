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
    let config: BancoInterConfig;

    // Permite testar com os dados enviados no form antes de salvar, ou com os dados salvos
    if (body.clientId && body.clientSecret && body.certCrt && body.certKey) {
      config = {
        clientId: body.clientId,
        clientSecret: body.clientSecret,
        certCrt: body.certCrt,
        certKey: body.certKey,
        ambiente: body.ambiente || "PRODUCAO",
        contaCorrente: body.contaCorrente,
      };
    } else {
      config = await getEmpresaInterConfig(session.empresaId);
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
