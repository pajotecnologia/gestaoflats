import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback, createAccessToken, createRefreshToken, setAuthCookies, isUserSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { tenantId } = await request.json();

    if (!tenantId) {
      return NextResponse.json({ error: "ID da organização é obrigatório." }, { status: 400 });
    }

    const isSuper = isUserSuperAdmin(session.email, session.cargo);

    // Buscar a empresa destino
    const targetEmpresa = await prisma.empresa.findUnique({
      where: { id: tenantId },
    });

    if (!targetEmpresa) {
      return NextResponse.json({ error: "Organização não encontrada." }, { status: 404 });
    }

    let userRole = "member";
    let targetUserId = session.userId;

    if (!isSuper) {
      // Verificar se o usuário pertence à empresa
      const userInTenant = await prisma.usuario.findFirst({
        where: {
          empresaId: tenantId,
          email: session.email,
        },
      });

      if (!userInTenant) {
        return NextResponse.json({ error: "Você não tem permissão para acessar esta organização." }, { status: 403 });
      }

      userRole = userInTenant.cargo === "ADMIN" ? "admin" : "member";
      targetUserId = userInTenant.id;
    } else {
      userRole = "admin";
    }

    // Gerar novos tokens com o novo empresaId
    const tokenPayload = {
      userId: targetUserId,
      empresaId: targetEmpresa.id,
      email: session.email,
      nome: session.nome,
      cargo: userRole === "admin" ? "ADMIN" : "OPERADOR",
      empresaNome: targetEmpresa.nomeFantasia,
      isSuperAdmin: isSuper,
      isMestre: Boolean(targetEmpresa.isMestre),
    };

    const accessToken = await createAccessToken(tokenPayload);
    const refreshToken = await createRefreshToken(tokenPayload);

    await setAuthCookies(accessToken, refreshToken);

    return NextResponse.json({
      success: true,
      activeTenant: {
        id: targetEmpresa.id,
        name: targetEmpresa.nomeFantasia,
        role: userRole,
      },
      message: `Organização alterada para ${targetEmpresa.nomeFantasia}.`,
    });
  } catch (error: any) {
    console.error("Erro ao alternar tenant:", error);
    return NextResponse.json({ error: error.message || "Erro ao alternar organização." }, { status: 500 });
  }
}
