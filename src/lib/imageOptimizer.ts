import sharp from "sharp";

interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
}

/**
 * Comprime e redimensiona imagens para formato leve de alta qualidade (WebP / JPEG / PNG).
 * Retorna o Data URI pronto para gravação no banco de dados.
 */
export async function optimizeImageToDataUri(
  input: Buffer | string,
  options: OptimizeOptions = {}
): Promise<string> {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 80,
    format = "webp",
  } = options;

  let buffer: Buffer;

  if (typeof input === "string") {
    // Se for data URI ou base64
    const matches = input.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches) {
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(input, "base64");
    }
  } else {
    buffer = input;
  }

  try {
    let pipeline = sharp(buffer).rotate(); // auto-rotate based on EXIF

    if (maxWidth || maxHeight) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    let mimeType = "image/webp";
    if (format === "webp") {
      pipeline = pipeline.webp({ quality, effort: 4 });
      mimeType = "image/webp";
    } else if (format === "png") {
      pipeline = pipeline.png({ quality, compressionLevel: 8 });
      mimeType = "image/png";
    } else {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      mimeType = "image/jpeg";
    }

    const outputBuffer = await pipeline.toBuffer();
    const base64 = outputBuffer.toString("base64");
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.warn("Aviso: Falha ao otimizar imagem via sharp, usando original:", error);
    if (typeof input === "string" && input.startsWith("data:")) {
      return input;
    }
    const base64 = buffer.toString("base64");
    return `data:image/jpeg;base64,${base64}`;
  }
}
