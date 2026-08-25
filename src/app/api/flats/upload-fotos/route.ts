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
    const formData = await request.formData();
    const flatId = formData.get("flatId") as string;
    const files = formData.getAll("fotoFiles") as File[];

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    for (const file of files) {
      if (file && file.size > MAX_FILE_SIZE) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        return NextResponse.json(
          { error: `A foto "${file.name}" (${sizeMb} MB) excede o limite máximo permitido de 5 MB.` },
          { status: 400 }
        );
      }
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "flats");
    await mkdir(uploadsDir, { recursive: true });

    const newFotoUrls: string[] = [];

    for (const file of files) {
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = path.extname(file.name) || ".jpg";
        const filename = `flat-${flatId || "upload"}-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
        const filePath = path.join(uploadsDir, filename);

        await writeFile(filePath, buffer);
        await chmod(filePath, 0o755).catch(() => {});

        newFotoUrls.push(`/uploads/flats/${filename}`);
      }
    }

    if (flatId) {
      const flat = await prisma.flat.findUnique({
        where: { id: flatId, empresaId: session.empresaId },
      });

      if (flat) {
        const existingFotos: string[] = flat.fotosUrl ? JSON.parse(flat.fotosUrl) : [];
        const updatedFotosList = [...existingFotos, ...newFotoUrls];

        const updatedFlat = await prisma.flat.update({
          where: { id: flatId },
          data: {
            fotosUrl: JSON.stringify(updatedFotosList),
          },
        });

        return NextResponse.json({
          success: true,
          fotosUrl: updatedFotosList,
          flat: updatedFlat,
        });
      }
    }

    return NextResponse.json({
      success: true,
      fotosUrl: newFotoUrls,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
