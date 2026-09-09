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
    const contentType = request.headers.get("content-type") || "";

    // 1) Se for JSON com string base64 / url direta
    if (contentType.includes("application/json")) {
      const { assinaturaUrl, usuarioId } = await request.json();
      
      const targetUserId = (session.cargo === "ADMIN" && usuarioId) ? usuarioId : session.userId;

      if (!targetUserId) {
        return NextResponse.json({ error: "ID de usuário inválido." }, { status: 400 });
      }

      const updatedUser = await prisma.usuario.update({
        where: { id: targetUserId },
        data: { assinaturaUrl },
        select: {
          id: true,
          nome: true,
          email: true,
          cargo: true,
          assinaturaUrl: true,
        },
      });

      return NextResponse.json({
        success: true,
        assinaturaUrl,
        usuario: updatedUser,
      });
    }

    // 2) Se for FormData com arquivo de imagem
    const formData = await request.formData();
    const file = formData.get("assinaturaFile") as File;
    const usuarioId = (formData.get("usuarioId") as string) || "";

    const targetUserId = (session.cargo === "ADMIN" && usuarioId) ? usuarioId : session.userId;

    if (!targetUserId) {
      return NextResponse.json({ error: "ID de usuário inválido." }, { status: 400 });
    }

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

    // Redundância local opcional
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "assinaturas");
      await mkdir(uploadsDir, { recursive: true });
      const filename = `usuario-assinatura-${targetUserId}-${Date.now()}${ext}`;
      const filePath = path.join(uploadsDir, filename);
      await writeFile(filePath, buffer);
    } catch (fsErr) {
      // Fallback silencioso
    }

    const updatedUser = await prisma.usuario.update({
      where: { id: targetUserId },
      data: { assinaturaUrl: assinaturaDataUri },
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        assinaturaUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      assinaturaUrl: assinaturaDataUri,
      usuario: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
