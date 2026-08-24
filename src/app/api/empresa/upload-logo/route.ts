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

    const publicUploadsDir = path.join(process.cwd(), "public", "uploads");
    const rootUploadsDir = path.join(process.cwd(), "uploads");

    await mkdir(publicUploadsDir, { recursive: true });
    await mkdir(rootUploadsDir, { recursive: true });

    const publicFilePath = path.join(publicUploadsDir, filename);
    const rootFilePath = path.join(rootUploadsDir, filename);

    await writeFile(publicFilePath, buffer);
    await writeFile(rootFilePath, buffer);

    await chmod(publicFilePath, 0o777).catch(() => {});
    await chmod(rootFilePath, 0o777).catch(() => {});

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
