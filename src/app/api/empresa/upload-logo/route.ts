import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, chmod } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    // 1) Se for JSON com string base64 / url direta
    if (contentType.includes("application/json")) {
      const { logomarcaUrl } = await request.json();

      if (!logomarcaUrl) {
        return NextResponse.json({ error: "Nenhuma imagem enviada." }, { status: 400 });
      }

      const empresaAtualizada = await prisma.empresa.update({
        where: { id: session.empresaId },
        data: { logomarcaUrl },
      });

      return NextResponse.json({
        success: true,
        logomarcaUrl,
        empresa: empresaAtualizada,
      });
    }

    // 2) Se for FormData com arquivo de imagem
    const formData = await request.formData();
    const file = formData.get("logoFile") as File | null;

    if (!file) {
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
    const fileExtension = path.extname(file.name).toLowerCase() || ".png";

    // Otimiza e comprime para WebP de alta qualidade (reduz de megabytes para ~15-20KB)
    const { optimizeLogo } = await import("@/lib/imageOptimizer");
    const logomarcaDataUri = await optimizeLogo(buffer);

    // Também gravamos o arquivo em disco como fallback / redundância
    try {
      const filename = `logo-${session.empresaId}${fileExtension}`;
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });
      const filePath = path.join(uploadsDir, filename);
      await writeFile(filePath, buffer);
      await chmod(filePath, 0o755).catch(() => {});
    } catch (fsErr) {
      console.warn("Aviso: Falha ao gravar arquivo em disco, mas a imagem foi salva no banco de dados:", fsErr);
    }

    // Grava o Base64 Data URI diretamente no banco de dados (100% permanente contra git resets)
    const empresaAtualizada = await prisma.empresa.update({
      where: { id: session.empresaId },
      data: { logomarcaUrl: logomarcaDataUri },
    });

    return NextResponse.json({
      success: true,
      logomarcaUrl: logomarcaDataUri,
      empresa: empresaAtualizada,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Erro no upload da logomarca: ${error.message || error}` },
      { status: 500 }
    );
  }
}
