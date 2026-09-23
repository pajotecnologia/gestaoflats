import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionOrFallback } from "@/lib/auth";
import { writeFile, mkdir, chmod } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionOrFallback();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("notaFiles") as File[];
    const singleFile = formData.get("notaFile") as File | null;

    const allFiles: File[] = [];
    if (files && files.length > 0) {
      allFiles.push(...files);
    }
    if (singleFile && singleFile.size > 0 && !allFiles.some((f) => f.name === singleFile.name && f.size === singleFile.size)) {
      allFiles.push(singleFile);
    }

    if (allFiles.length === 0) {
      return NextResponse.json({ error: "Nenhum arquivo de comprovante/nota enviado." }, { status: 400 });
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    for (const file of allFiles) {
      if (file && file.size > MAX_FILE_SIZE) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        return NextResponse.json(
          { error: `O arquivo "${file.name}" (${sizeMb} MB) excede o limite máximo permitido de 10 MB.` },
          { status: 400 }
        );
      }
    }

    const notasAnexadas: Array<{
      id: string;
      url: string;
      nome: string;
      tipo: "IMAGEM" | "PDF" | "DOCUMENTO";
      tamanho: number;
      criadoEm: string;
    }> = [];

    for (const file of allFiles) {
      if (file && file.size > 0) {
        const ext = path.extname(file.name).toLowerCase();
        const buffer = Buffer.from(await file.arrayBuffer());
        const isPdf = file.type === "application/pdf" || ext === ".pdf";
        const isImage = file.type.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp"].includes(ext);

        let finalUrl = "";

        if (isImage) {
          try {
            const { optimizeVistoriaPhoto } = await import("@/lib/imageOptimizer");
            finalUrl = await optimizeVistoriaPhoto(buffer);
          } catch {
            finalUrl = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
          }
        } else if (isPdf) {
          finalUrl = `data:application/pdf;base64,${buffer.toString("base64")}`;
        } else {
          finalUrl = `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
        }

        // Salvar cópia local física opcional para redundância
        try {
          const uploadsDir = path.join(process.cwd(), "public", "uploads", "notas_os");
          await mkdir(uploadsDir, { recursive: true });
          const safeName = `nota-os-${Date.now()}-${Math.random().toString(36).substring(7)}${ext || (isPdf ? ".pdf" : ".jpg")}`;
          const filePath = path.join(uploadsDir, safeName);
          await writeFile(filePath, buffer);
          await chmod(filePath, 0o755).catch(() => {});
        } catch {
          // Fallback silencioso
        }

        notasAnexadas.push({
          id: `nota_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          url: finalUrl,
          nome: file.name,
          tipo: isPdf ? "PDF" : isImage ? "IMAGEM" : "DOCUMENTO",
          tamanho: file.size,
          criadoEm: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      notas: notasAnexadas,
      totalEnviados: notasAnexadas.length,
    });
  } catch (error: any) {
    console.error("Erro no upload de notas de material de O.S:", error);
    return NextResponse.json({ error: error.message || "Erro ao processar comprovantes." }, { status: 500 });
  }
}
