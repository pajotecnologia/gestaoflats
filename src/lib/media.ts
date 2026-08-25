/**
 * Utilitário para formatar URLs de mídia garantindo que passem pela API /api/media do Next.js
 * Evita bloqueios de Nginx ou erros 404 em hospedagens VPS.
 */
export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  
  // Se for Base64 ou URL externa (http/https), retorna diretamente
  if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  
  // Se já for uma URL da API /api/media, retorna sem alterar
  if (url.startsWith("/api/media")) {
    return url;
  }

  // Remove barras iniciais e o prefixo "uploads/" se existir
  const cleanPath = url.replace(/^\/+/, "").replace(/^uploads\//, "");
  return `/api/media?file=${encodeURIComponent(cleanPath)}`;
}
