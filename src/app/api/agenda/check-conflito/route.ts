import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { flatId, dataCheckIn, dataCheckOut, excludeContratoId } = await request.json();

    if (!flatId || !dataCheckIn || !dataCheckOut) {
      return NextResponse.json({ error: "Parâmetros incompletos." }, { status: 400 });
    }

    const dtIn = new Date(dataCheckIn);
    const dtOut = new Date(dataCheckOut);

    if (dtOut <= dtIn) {
      return NextResponse.json(
        { error: "A data de check-out deve ser posterior à data de check-in." },
        { status: 400 }
      );
    }

    // Busca contratos existentes ativos que colidam com o período
    const conflito = await prisma.contrato.findFirst({
      where: {
        empresaId: session.empresaId,
        flatId,
        status: { not: "CANCELADO" },
        ...(excludeContratoId ? { id: { not: excludeContratoId } } : {}),
        AND: [
          { dataEmissao: { lt: dtOut } },
          { dataFinal: { gt: dtIn } },
        ],
      },
      include: {
        locatario: true,
        flat: true,
      },
    });

    if (conflito) {
      return NextResponse.json({
        disponivel: false,
        conflito: {
          contratoId: conflito.id,
          locatarioNome: conflito.locatario.nome,
          dataInicio: conflito.dataEmissao.toISOString().split("T")[0],
          dataFim: conflito.dataFinal.toISOString().split("T")[0],
        },
      });
    }

    return NextResponse.json({ disponivel: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
