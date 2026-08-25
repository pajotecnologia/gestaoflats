import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let fileParam = searchParams.get("file") || searchParams.get("path") || "";

    if (!fileParam) {
      return new NextResponse("File parameter is required", { status: 400 });
    }

    // Decodifica a URL e limpa barras iniciais e o prefixo "uploads/"
    fileParam = decodeURIComponent(fileParam).replace(/^\/+/, "").replace(/^uploads\//, "");

    // Proteção contra Directory Traversal
    const safePathSegments = fileParam.split("/").map((segment) => path.basename(segment));

    // Possíveis locais físicos onde a imagem pode estar na VPS
    const possiblePaths = [
      path.join(process.cwd(), "public", "uploads", ...safePathSegments),
      path.join(process.cwd(), "uploads", ...safePathSegments),
      path.join(process.cwd(), "public", ...safePathSegments),
    ];

    let foundPath = "";
    for (const p of possiblePaths) {
      try {
        await stat(p);
        foundPath = p;
        break;
      } catch {}
    }

    if (!foundPath) {
      return new NextResponse("Image Not Found on Server Disk", { status: 404 });
    }

    const fileBuffer = await readFile(foundPath);
    const ext = path.extname(foundPath).toLowerCase();

    let contentType = "image/jpeg";
    if (ext === ".png") contentType = "image/png";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".svg") contentType = "image/svg+xml";
    else if (ext === ".pdf") contentType = "application/pdf";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    return new NextResponse("Internal Media Error", { status: 500 });
  }
}
