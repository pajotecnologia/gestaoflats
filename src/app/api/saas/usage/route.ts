import { NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { getOrganizationUsage } from "@/lib/plans/planService";

export async function GET() {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const usage = await getOrganizationUsage(session.empresaId);
    return NextResponse.json(usage);
  } catch (error: any) {
    console.error("Erro ao buscar uso e quotas do plano:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
