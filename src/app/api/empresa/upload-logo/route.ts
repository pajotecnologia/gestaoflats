import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, chmod } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
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
    const fileExtension = path.extname(file.name) || ".png";
    const filename = `logo-${session.empresaId}-${Date.now()}${fileExtension}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, buffer);
    await chmod(filePath, 0o755).catch(() => {});

    const logomarcaUrl = `/uploads/${filename}`;

    const empresaAtualizada = await prisma.empresa.update({
      where: { id: session.empresaId },
      data: { logomarcaUrl },
    });

    return NextResponse.json({
      success: true,
      logomarcaUrl,
      empresa: empresaAtualizada,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Erro no upload da logomarca: ${error.message || error}` },
      { status: 500 }
    );
  }
}
