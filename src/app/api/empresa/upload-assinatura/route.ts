import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("assinaturaFile") as File;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Arquivo de assinatura não enviado." }, { status: 400 });
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { error: `O arquivo de assinatura (${sizeMb} MB) excede o limite máximo permitido de 5 MB.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name).toLowerCase() || ".png";
    let mimeType = "image/png";
    if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
    else if (ext === ".webp") mimeType = "image/webp";
    else if (ext === ".svg") mimeType = "image/svg+xml";

    const base64Data = buffer.toString("base64");
    const assinaturaDataUri = `data:${mimeType};base64,${base64Data}`;

    // Gravação em disco como redundância local
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "assinaturas");
      await mkdir(uploadsDir, { recursive: true });
      const filename = `empresa-assinatura-${session.empresaId}-${Date.now()}${ext}`;
      const filePath = path.join(uploadsDir, filename);
      await writeFile(filePath, buffer);
    } catch (fsErr) {
      console.warn("Aviso: Falha ao gravar assinatura em disco, mantida no banco de dados:", fsErr);
    }

    // Grava o Base64 Data URI diretamente no banco de dados (100% permanente contra git resets)
    const updatedEmpresa = await prisma.empresa.update({
      where: { id: session.empresaId },
      data: { assinaturaUrl: assinaturaDataUri },
    });

    if (session.userId) {
      await prisma.usuario.updateMany({
        where: { id: session.userId },
        data: { assinaturaUrl: assinaturaDataUri },
      });
    }

    return NextResponse.json({
      success: true,
      assinaturaUrl: assinaturaDataUri,
      empresa: updatedEmpresa,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
