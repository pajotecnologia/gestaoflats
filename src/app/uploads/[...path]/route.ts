import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = params.path || [];
    if (pathSegments.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Previne Directory Traversal
    const safePathSegments = pathSegments.map((segment) =>
      path.basename(segment)
    );

    // Tenta primeiro em public/uploads/..., depois em uploads/...
    const filePathInPublic = path.join(
      process.cwd(),
      "public",
      "uploads",
      ...safePathSegments
    );
    const filePathInRoot = path.join(
      process.cwd(),
      "uploads",
      ...safePathSegments
    );

    let finalPath = "";
    try {
      await stat(filePathInPublic);
      finalPath = filePathInPublic;
    } catch {
      try {
        await stat(filePathInRoot);
        finalPath = filePathInRoot;
      } catch {
        return new NextResponse("File Not Found", { status: 404 });
      }
    }

    const fileBuffer = await readFile(finalPath);
    const ext = path.extname(finalPath).toLowerCase();

    let contentType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
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
    return new NextResponse("Internal Error", { status: 500 });
  }
}
