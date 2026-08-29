import { NextResponse } from "next/server";
import { getAuthSessionOrFallback, isUserSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verificarStatusAcesso } from "@/lib/saasConfig";

export async function GET() {
  try {
    const session = await getAuthSessionOrFallback();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isUserSuperAdmin(session.email, session.cargo)) {
      return NextResponse.json(
        { error: "Acesso restrito exclusivamente ao Super Administrador da plataforma SaaS." },
        { status: 403 }
      );
    }

    const empresas = await prisma.empresa.findMany({
      include: {
        usuarios: {
          select: {
            id: true,
            nome: true,
            email: true,
            cargo: true,
          },
        },
        _count: {
          select: {
            flats: true,
            contratos: true,
            locatarios: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const empresasComStatus = await Promise.all(
      empresas.map(async (emp) => {
        const statusAcesso = await verificarStatusAcesso(emp.id);
        return {
          id: emp.id,
          nomeFantasia: emp.nomeFantasia,
          razaoSocial: emp.razaoSocial,
          cnpj: emp.cnpj,
          email: emp.email,
          telefone: emp.telefone,
          cidade: emp.cidade,
          estado: emp.estado,
          createdAt: emp.createdAt,
          statusAssinatura: emp.statusAssinatura,
          dataInicioTrial: emp.dataInicioTrial,
          dataFimTrial: emp.dataFimTrial,
          dataFimAcesso: emp.dataFimAcesso,
          planoAtual: emp.planoAtual,
          ultimoAvisoWhatsAppEm: emp.ultimoAvisoWhatsAppEm,
          usuarios: emp.usuarios,
          counts: emp._count,
          statusAcesso,
        };
      })
    );

    return NextResponse.json({ empresas: empresasComStatus });
  } catch (error: any) {
    console.error("Erro ao listar empresas SaaS:", error);
    return NextResponse.json({ error: error.message || "Erro ao listar empresas" }, { status: 500 });
  }
}
