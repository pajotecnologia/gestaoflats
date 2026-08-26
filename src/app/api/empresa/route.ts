import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let empresa = await prisma.empresa.findUnique({
    where: { id: session.empresaId },
  });

  if (!empresa) {
    empresa = await prisma.empresa.findFirst();
  }

  return NextResponse.json({ empresa });
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { nomeFantasia, razaoSocial, cnpj, email, telefone, endereco, bairro, cidade, estado, cep, logomarcaUrl, assinaturaUrl } =
      await request.json();

    if (!nomeFantasia || !razaoSocial || !cnpj) {
      return NextResponse.json(
        { error: "Nome Fantasia, Razão Social e CNPJ são obrigatórios." },
        { status: 400 }
      );
    }

    let targetEmpresaId = session.empresaId;
    let empresaExistente = await prisma.empresa.findUnique({
      where: { id: targetEmpresaId },
    });

    if (!empresaExistente) {
      empresaExistente = await prisma.empresa.findFirst();
      if (empresaExistente) {
        targetEmpresaId = empresaExistente.id;
      }
    }

    let empresaAtualizada;
    if (empresaExistente) {
      empresaAtualizada = await prisma.empresa.update({
        where: { id: targetEmpresaId },
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
        },
      });
    } else {
      empresaAtualizada = await prisma.empresa.create({
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
        },
      });
    }

    return NextResponse.json({ success: true, empresa: empresaAtualizada });
  } catch (error: any) {
    console.error("Erro ao atualizar dados da empresa:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar dados da empresa." }, { status: 500 });
  }
}
