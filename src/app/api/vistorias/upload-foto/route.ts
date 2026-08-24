import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, chmod } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("fotoFiles") as File[];
    const singleFile = formData.get("fotoFile") as File | null;

    const allFiles: File[] = [];
    if (files && files.length > 0) {
      allFiles.push(...files);
    }
    if (singleFile && singleFile.size > 0 && !allFiles.includes(singleFile)) {
      allFiles.push(singleFile);
    }

    if (allFiles.length === 0) {
      return NextResponse.json({ error: "Nenhuma imagem enviada." }, { status: 400 });
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    for (const file of allFiles) {
      if (file && file.size > MAX_FILE_SIZE) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        return NextResponse.json(
          { error: `O arquivo "${file.name}" (${sizeMb} MB) excede o limite máximo permitido de 5 MB.` },
          { status: 400 }
        );
      }
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "vistorias");
    await mkdir(uploadsDir, { recursive: true });

    const fotoUrls: string[] = [];

    for (const file of allFiles) {
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = path.extname(file.name) || ".jpg";
        const filename = `vistoria-item-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
        const filePath = path.join(uploadsDir, filename);

        await writeFile(filePath, buffer);
        await chmod(filePath, 0o755).catch(() => {});

        fotoUrls.push(`/uploads/vistorias/${filename}`);
      }
    }

    return NextResponse.json({
      success: true,
      fotoUrl: fotoUrls[0] || "",
      fotoUrls,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro no upload da imagem." }, { status: 500 });
  }
}
