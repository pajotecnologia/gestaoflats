import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const proprietarios = await prisma.proprietario.findMany({
      where: { empresaId: session.empresaId },
      include: {
        flats: {
          select: {
            id: true,
            numero: true,
            status: true,
            valorPadrao: true,
            local: { select: { nome: true } },
          },
        },
        _count: {
          select: {
            flats: true,
            repasses: true,
          },
        },
      },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json({ proprietarios });
  } catch (error: any) {
    console.error("Erro ao buscar proprietários:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      nome,
      cpfCnpj,
      rgIe,
      email,
      telefone,
      endereco,
      bairro,
      cidade,
      estado,
      cep,
      chavePix,
      tipoChavePix,
      banco,
      agencia,
      conta,
      taxaAdministracaoPadrao,
      observacoes,
    } = body;

    if (!nome || !cpfCnpj || !telefone) {
      return NextResponse.json(
        { error: "Nome, CPF/CNPJ e Telefone/WhatsApp são campos obrigatórios." },
        { status: 400 }
      );
    }

    const newProprietario = await prisma.proprietario.create({
      data: {
        empresaId: session.empresaId,
        nome: nome.trim(),
        cpfCnpj: cpfCnpj.trim(),
        rgIe: rgIe?.trim() || null,
        email: email?.trim() || null,
        telefone: telefone.trim(),
        endereco: endereco?.trim() || null,
        bairro: bairro?.trim() || null,
        cidade: cidade?.trim() || null,
        estado: estado?.trim() || null,
        cep: cep?.trim() || null,
        chavePix: chavePix?.trim() || null,
        tipoChavePix: tipoChavePix || "CPF",
        banco: banco?.trim() || null,
        agencia: agencia?.trim() || null,
        conta: conta?.trim() || null,
        taxaAdministracaoPadrao:
          taxaAdministracaoPadrao !== undefined && taxaAdministracaoPadrao !== null
            ? parseFloat(String(taxaAdministracaoPadrao))
            : 10.0,
        observacoes: observacoes?.trim() || null,
        status: "ATIVO",
      },
    });

    return NextResponse.json({ proprietario: newProprietario });
  } catch (error: any) {
    console.error("Erro ao cadastrar proprietário:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      id,
      nome,
      cpfCnpj,
      rgIe,
      email,
      telefone,
      endereco,
      bairro,
      cidade,
      estado,
      cep,
      chavePix,
      tipoChavePix,
      banco,
      agencia,
      conta,
      taxaAdministracaoPadrao,
      observacoes,
      status,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório para atualização." }, { status: 400 });
    }

    const updatedProprietario = await prisma.proprietario.update({
      where: { id, empresaId: session.empresaId },
      data: {
        nome: nome !== undefined ? nome.trim() : undefined,
        cpfCnpj: cpfCnpj !== undefined ? cpfCnpj.trim() : undefined,
        rgIe: rgIe !== undefined ? rgIe?.trim() || null : undefined,
        email: email !== undefined ? email?.trim() || null : undefined,
        telefone: telefone !== undefined ? telefone.trim() : undefined,
        endereco: endereco !== undefined ? endereco?.trim() || null : undefined,
        bairro: bairro !== undefined ? bairro?.trim() || null : undefined,
        cidade: cidade !== undefined ? cidade?.trim() || null : undefined,
        estado: estado !== undefined ? estado?.trim() || null : undefined,
        cep: cep !== undefined ? cep?.trim() || null : undefined,
        chavePix: chavePix !== undefined ? chavePix?.trim() || null : undefined,
        tipoChavePix: tipoChavePix !== undefined ? tipoChavePix : undefined,
        banco: banco !== undefined ? banco?.trim() || null : undefined,
        agencia: agencia !== undefined ? agencia?.trim() || null : undefined,
        conta: conta !== undefined ? conta?.trim() || null : undefined,
        taxaAdministracaoPadrao:
          taxaAdministracaoPadrao !== undefined
            ? parseFloat(String(taxaAdministracaoPadrao))
            : undefined,
        observacoes: observacoes !== undefined ? observacoes?.trim() || null : undefined,
        status: status !== undefined ? status : undefined,
      },
    });

    return NextResponse.json({ proprietario: updatedProprietario });
  } catch (error: any) {
    console.error("Erro ao atualizar proprietário:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório para exclusão." }, { status: 400 });
    }

    await prisma.proprietario.delete({
      where: { id, empresaId: session.empresaId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao excluir proprietário:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
