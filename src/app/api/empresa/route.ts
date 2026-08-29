import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.empresaId },
  });

  if (!empresa) {
    return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ empresa });
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const {
      nomeFantasia,
      razaoSocial,
      cnpj,
      email,
      telefone,
      endereco,
      bairro,
      cidade,
      estado,
      cep,
      logomarcaUrl,
      assinaturaUrl,
      chavePix,
      tipoChavePix,
      nomeBeneficiarioPix,
      cidadePix,
    } = await request.json();

    if (!nomeFantasia || !razaoSocial || !cnpj) {
      return NextResponse.json(
        { error: "Nome Fantasia, Razão Social e CNPJ são obrigatórios." },
        { status: 400 }
      );
    }

    const empresaAtualizada = await prisma.empresa.update({
      where: { id: session.empresaId },
      data: {
        nomeFantasia,
        razaoSocial,
        cnpj,
        email,
        telefone,
        endereco,
        bairro: bairro || null,
        cidade: cidade || null,
        estado: estado || null,
        cep: cep || null,
        logomarcaUrl: logomarcaUrl || null,
        assinaturaUrl: assinaturaUrl || null,
        chavePix: chavePix?.trim() || null,
        tipoChavePix: tipoChavePix || "CNPJ",
        nomeBeneficiarioPix: nomeBeneficiarioPix?.trim() || null,
        cidadePix: cidadePix?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, empresa: empresaAtualizada });
  } catch (error: any) {
    console.error("Erro ao atualizar dados da empresa:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar dados da empresa." },
      { status: 500 }
    );
  }
}
