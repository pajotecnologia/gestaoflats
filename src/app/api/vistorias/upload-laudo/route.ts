import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("laudoFile") as File;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { error: `O arquivo "${file.name}" (${sizeMb} MB) excede o limite máximo permitido de 10 MB.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "vistorias");
    await mkdir(uploadsDir, { recursive: true });

    const fileExt = path.extname(file.name) || ".pdf";
    const filename = `laudo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${fileExt}`;
    const filePath = path.join(uploadsDir, filename);

    await writeFile(filePath, buffer);

    const laudoImpressoUrl = `/uploads/vistorias/${filename}`;

    return NextResponse.json({
      success: true,
      laudoImpressoUrl,
      fileName: file.name,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao processar upload do laudo." }, { status: 500 });
  }
}
