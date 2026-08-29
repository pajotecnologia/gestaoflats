import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { notifyAdminNovaContratacao } from "@/lib/adminNotifications";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const body = await request.json().catch(() => ({}));
    const { plano, valor, formaPagamento, comprovanteUrl, observacoes, empresaId: paramEmpresaId } = body;

    const targetEmpresaId = session?.empresaId || paramEmpresaId;

    if (!targetEmpresaId) {
      return NextResponse.json(
        { error: "Identificação da empresa não encontrada." },
        { status: 400 }
      );
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: targetEmpresaId },
      include: {
        usuarios: {
          where: { cargo: "ADMIN" },
          take: 1,
        },
      },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa não localizada." },
        { status: 404 }
      );
    }

    const adminUser = empresa.usuarios[0];

    // Dispara e-mail de notificação para o Super Admin
    await notifyAdminNovaContratacao({
      nomeEmpresa: empresa.nomeFantasia,
      cnpj: empresa.cnpj,
      telefone: empresa.telefone,
      nomeAdmin: adminUser?.nome || "Responsável",
      email: adminUser?.email || empresa.email,
      plano: plano || "MENSAL",
      valor: Number(valor) || 97,
      formaPagamento: formaPagamento || "PIX",
      comprovanteUrl: comprovanteUrl || null,
      observacoes: observacoes || null,
    });

    return NextResponse.json({
      success: true,
      message: "Notificação de contratação enviada com sucesso para a administração!",
    });
  } catch (error: any) {
    console.error("Erro ao processar confirmação de pagamento:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar notificação de contratação." },
      { status: 500 }
    );
  }
}
