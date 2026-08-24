import { NextRequest } from "next/server";

/**
 * Obtém dinamicamente a URL base (domínio / porta / protocolo) da aplicação.
 * Funciona tanto no ambiente de desenvolvimento local quanto hospedado em VPS (Docker, Nginx, Caddy, etc).
 * 
 * Ordem de Prioridade:
 * 1. Variável de ambiente NEXT_PUBLIC_APP_URL ou APP_URL (.env / VPS)
 * 2. Cabeçalhos HTTP de requisição (x-forwarded-host, host, x-forwarded-proto) no lado do servidor
 * 3. window.location.origin no lado do cliente (navegador)
 * 4. Fallback padrão: http://localhost:3000
 */
export function getAppBaseUrl(req?: NextRequest | Request): string {
  // 1. Variáveis de ambiente configuradas no servidor ou VPS
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, "");
  }

  // 2. Requisição no lado do servidor (Next.js API Routes ou Server Components)
  if (req) {
    try {
      const headers = req.headers;
      const host = headers.get("x-forwarded-host") || headers.get("host");
      const proto = headers.get("x-forwarded-proto") || (host && (host.includes("localhost") || host.includes("127.0.0.1")) ? "http" : "https");
      if (host) {
        return `${proto}://${host}`.replace(/\/$/, "");
      }
    } catch (e) {
      // Ignora e avança para fallback
    }
  }

  // 3. Lado do cliente (Navegador)
  if (typeof window !== "undefined" && window.location && window.location.origin) {
    return window.location.origin.replace(/\/$/, "");
  }

  // 4. Fallback Padrão (Porta 3010)
  const port = process.env.PORT || "3010";
  return `http://localhost:${port}`;
}

/**
 * Converte e redimensiona URLs de imagem para Data URIs Base64 compactas para PDFs
 */
export async function convertUrlToBase64(url?: string | null, maxWidth = 700, quality = 0.65): Promise<string> {
  if (!url || !url.trim()) return "";
  const cleanUrl = url.trim();

  try {
    const response = await fetch(cleanUrl);
    const blob = await response.blob();

    if (typeof window === "undefined" || !blob.type.startsWith("image/")) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || cleanUrl);
        reader.onerror = () => resolve(cleanUrl);
        reader.readAsDataURL(blob);
      });
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        } else {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string) || cleanUrl);
          reader.readAsDataURL(blob);
        }
      };
      img.onerror = () => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || cleanUrl);
        reader.readAsDataURL(blob);
      };
      img.src = URL.createObjectURL(blob);
    });
  } catch (err) {
    return cleanUrl;
  }
}
