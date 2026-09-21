import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { optimizeLogo } from "@/lib/imageOptimizer";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("logoFile") as File;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { error: `A logomarca (${sizeMb} MB) excede o limite máximo permitido de 5 MB.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const logoDataUri = await optimizeLogo(buffer);

    return NextResponse.json({ logomarcaUrl: logoDataUri });
  } catch (error: any) {
    console.error("Erro no upload de logomarca do condomínio:", error);
    return NextResponse.json({ error: error.message || "Falha ao processar a logomarca." }, { status: 500 });
  }
}
