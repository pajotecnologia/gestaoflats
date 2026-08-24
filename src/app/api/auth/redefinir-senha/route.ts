import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { token, novaSenha } = await request.json();

    if (!token || !novaSenha) {
      return NextResponse.json({ error: "Token e Nova Senha são obrigatórios." }, { status: 400 });
    }

    if (novaSenha.length < 6) {
      return NextResponse.json({ error: "A senha deve ter no mínimo 6 caracteres." }, { status: 422 });
    }

    const user = await prisma.usuario.findFirst({
      where: {
        tokenRecuperacaoSenha: token,
        validadeTokenRecuperacao: { gte: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Token de recuperação inválido ou expirado. Solicite novamente." },
        { status: 400 }
      );
    }

    const novaSenhaHash = await hashPassword(novaSenha);

    await prisma.usuario.update({
      where: { id: user.id },
      data: {
        senhaHash: novaSenhaHash,
        tokenRecuperacaoSenha: null,
        validadeTokenRecuperacao: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Senha redefinida com sucesso! Você já pode fazer login.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao redefinir a senha." }, { status: 500 });
  }
}
