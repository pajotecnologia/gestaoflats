import sharp from "sharp";

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  effort?: number;
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
    maxWidth = 1200,
    maxHeight = 900,
    quality = 75,
    effort = 6,
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
      pipeline = pipeline.webp({ quality, effort: effort || 6 });
      mimeType = "image/webp";
    } else if (format === "png") {
      pipeline = pipeline.png({ quality, compressionLevel: 9, effort: 8 });
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

/**
 * Preset ultra-otimizado para Fotos de Imóveis e Flats (~30-45 KB por foto com ótima nitidez).
 */
export async function optimizeFlatPhoto(input: Buffer | string): Promise<string> {
  return optimizeImageToDataUri(input, {
    maxWidth: 1200,
    maxHeight: 900,
    quality: 75,
    effort: 6,
    format: "webp",
  });
}

/**
 * Preset ultra-otimizado para Fotos de Vistorias e Checklists (~25-35 KB por foto).
 */
export async function optimizeVistoriaPhoto(input: Buffer | string): Promise<string> {
  return optimizeImageToDataUri(input, {
    maxWidth: 1000,
    maxHeight: 750,
    quality: 70,
    effort: 6,
    format: "webp",
  });
}

/**
 * Preset ultra-otimizado para Assinaturas Digitais Touch/Mouse (~4-8 KB).
 */
export async function optimizeSignature(input: Buffer | string): Promise<string> {
  return optimizeImageToDataUri(input, {
    maxWidth: 450,
    maxHeight: 180,
    quality: 70,
    effort: 6,
    format: "webp",
  });
}

/**
 * Preset para Logomarcas da Empresa (~15-20 KB).
 */
export async function optimizeLogo(input: Buffer | string): Promise<string> {
  return optimizeImageToDataUri(input, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 80,
    effort: 6,
    format: "webp",
  });
}

/**
 * Calcula o tamanho real em bytes de uma string Data URI ou Base64.
 */
export function calculateDataUriBytes(dataUriOrBase64?: string | null): number {
  if (!dataUriOrBase64) return 0;
  const commaIdx = dataUriOrBase64.indexOf(",");
  const base64Str = commaIdx !== -1 ? dataUriOrBase64.slice(commaIdx + 1) : dataUriOrBase64;
  return Math.ceil((base64Str.length * 3) / 4);
}

/**
 * Formata bytes para string legível (ex: "45.2 MB", "820 KB", "1.4 GB").
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
