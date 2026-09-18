import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback, createAccessToken, isUserSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const isSuper = isUserSuperAdmin(session.email, session.cargo);

    // Se for Super Admin, ele pode ter acesso a todas as empresas cadastradas
    // Se for usuário regular, buscar empresas que ele pertence
    let empresas: any[] = [];
    if (isSuper) {
      empresas = await prisma.empresa.findMany({
        select: {
          id: true,
          nomeFantasia: true,
          razaoSocial: true,
          cnpj: true,
          logomarcaUrl: true,
          statusAssinatura: true,
          planoAtual: true,
          createdAt: true,
        },
        orderBy: { nomeFantasia: "asc" },
      });
    } else {
      // Buscar empresas vinculadas pelo e-mail do usuário
      const usuarios = await prisma.usuario.findMany({
        where: { email: session.email },
        include: {
          empresa: {
            select: {
              id: true,
              nomeFantasia: true,
              razaoSocial: true,
              cnpj: true,
              logomarcaUrl: true,
              statusAssinatura: true,
              planoAtual: true,
              createdAt: true,
            },
          },
        },
      });

      empresas = usuarios.map((u) => ({
        ...u.empresa,
        userCargo: u.cargo, // "ADMIN" ou "OPERADOR" / "member"
      }));
    }

    // Identificar a empresa ativa
    const activeEmpresa = empresas.find((e) => e.id === session.empresaId) || empresas[0] || null;
    const userRole = (session.cargo === "ADMIN" || session.cargo === "SUPER_ADMIN" || isSuper) ? "admin" : "member";

    const tenants = empresas.map((e) => ({
      id: e.id,
      name: e.nomeFantasia || e.razaoSocial,
      slug: (e.nomeFantasia || e.razaoSocial || e.id)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
      role: (e.userCargo === "ADMIN" || isSuper) ? "admin" : "member",
      logomarcaUrl: e.logomarcaUrl,
      status: e.statusAssinatura,
      plano: e.planoAtual,
      createdAt: e.createdAt,
    }));

    return NextResponse.json({
      activeTenant: activeEmpresa
        ? {
            id: activeEmpresa.id,
            name: activeEmpresa.nomeFantasia || activeEmpresa.razaoSocial,
            slug: (activeEmpresa.nomeFantasia || activeEmpresa.razaoSocial || activeEmpresa.id)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, ""),
            role: userRole,
            logomarcaUrl: activeEmpresa.logomarcaUrl,
            status: activeEmpresa.statusAssinatura,
            plano: activeEmpresa.planoAtual,
            createdAt: activeEmpresa.createdAt,
          }
        : null,
      userRole,
      tenants,
    });
  } catch (error: any) {
    console.error("Erro ao listar tenants:", error);
    return NextResponse.json({ error: error.message || "Erro ao consultar organizações." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { name, cnpj, email, telefone, endereco } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "O nome da organização é obrigatório." }, { status: 400 });
    }

    const cleanName = name.trim();
    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // 1. Criar a nova empresa (Tenant)
    const novaEmpresa = await prisma.empresa.create({
      data: {
        nomeFantasia: cleanName,
        razaoSocial: cleanName,
        cnpj: cnpj || "00.000.000/0001-00",
        email: email || session.email,
        telefone: telefone || "(00) 00000-0000",
        endereco: endereco || "Endereço Inicial",
        statusAssinatura: "TRIAL",
        planoAtual: "TRIAL",
        dataInicioTrial: new Date(),
        dataFimTrial: new Date(Date.now() + 7 * 86400000),
      },
    });

    // 2. Vincular o usuário criador como primeiro membro (ADMIN automático)
    const existingUser = await prisma.usuario.findFirst({
      where: { email: session.email },
    });

    if (existingUser) {
      await prisma.usuario.update({
        where: { id: existingUser.id },
        data: {
          empresaId: novaEmpresa.id,
          cargo: "ADMIN",
          status: "ATIVO",
        },
      });
    } else {
      await prisma.usuario.create({
        data: {
          empresaId: novaEmpresa.id,
          nome: session.nome || "Administrador",
          email: session.email,
          senhaHash: "$2a$12$e8F0N.jW2yZ1D2o0zH8w.uWvN.2bX9Y1Z9w0vU8tS7rQ6p5o4n3m2",
          cargo: "ADMIN", // Primeiro membro recebe role 'admin'
          status: "ATIVO",
        },
      });
    }


    return NextResponse.json({
      success: true,
      tenant: {
        id: novaEmpresa.id,
        name: novaEmpresa.nomeFantasia,
        slug,
        role: "admin",
      },
      message: "Organização criada com sucesso.",
    });
  } catch (error: any) {
    console.error("Erro ao criar tenant:", error);
    return NextResponse.json({ error: error.message || "Erro ao criar organização." }, { status: 500 });
  }
}
