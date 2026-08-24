import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createAccessToken, createRefreshToken, setAuthCookies } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
    }

    const user = await prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { empresa: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    const isPasswordValid = await verifyPassword(password, user.senhaHash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    const tokenPayload = {
      userId: user.id,
      empresaId: user.empresaId,
      email: user.email,
      nome: user.nome,
      cargo: user.cargo,
      empresaNome: user.empresa.nomeFantasia,
    };

    const accessToken = await createAccessToken(tokenPayload);
    const refreshToken = await createRefreshToken(tokenPayload);

    await setAuthCookies(accessToken, refreshToken);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        cargo: user.cargo,
        empresa: {
          id: user.empresa.id,
          nomeFantasia: user.empresa.nomeFantasia,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
