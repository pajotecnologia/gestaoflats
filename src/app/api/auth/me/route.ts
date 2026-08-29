import { NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verificarStatusAcesso } from "@/lib/saasConfig";

export async function GET() {
  const session = await getAuthSessionOrFallback();

  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const user = await prisma.usuario.findFirst({
    where: { OR: [{ id: session.userId }, { empresaId: session.empresaId }] },
    include: { empresa: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const statusAcesso = await verificarStatusAcesso(user.empresaId);

  return NextResponse.json({
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      cargo: user.cargo,
      empresa: user.empresa,
      statusAcesso,
    },
  });
}
