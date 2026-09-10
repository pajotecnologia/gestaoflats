import { NextResponse } from "next/server";
import { getAuthSessionOrFallback, isUserSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verificarStatusAcesso } from "@/lib/saasConfig";

export async function GET() {
  const session = await getAuthSessionOrFallback();

  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let user = null;

  if (session.userId) {
    user = await prisma.usuario.findUnique({
      where: { id: session.userId },
      include: { empresa: true },
    });
  }

  if (!user && session.email) {
    user = await prisma.usuario.findUnique({
      where: { email: session.email.trim().toLowerCase() },
      include: { empresa: true },
    });
  }

  if (!user && session.empresaId) {
    user = await prisma.usuario.findFirst({
      where: { empresaId: session.empresaId },
      include: { empresa: true },
    });
  }

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const statusAcesso = await verificarStatusAcesso(user.empresaId);
  const isSuperAdmin = isUserSuperAdmin(user.email, user.cargo) || isUserSuperAdmin(session.email, session.cargo) || Boolean(session.isSuperAdmin);

  return NextResponse.json({
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      cargo: user.cargo,
      assinaturaUrl: user.assinaturaUrl,
      isSuperAdmin,
      empresa: user.empresa,
      statusAcesso,
    },
  });
}
