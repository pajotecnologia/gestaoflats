import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const flat = await prisma.flat.findUnique({
      where: {
        id: params.id,
        empresaId: session.empresaId,
      },
      include: {
        local: true,
        contratos: {
          include: {
            locatario: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        vistoriasChecklist: {
          include: {
            locatario: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!flat) {
      return NextResponse.json({ error: "Flat não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ flat });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
