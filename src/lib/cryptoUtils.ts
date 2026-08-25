import crypto from "crypto";

/**
 * Calcula o Hash SHA-256 (64 caracteres hexadecimais) de um Buffer ou String
 */
export function calculateSha256(input: Buffer | string): string {
  const buffer = typeof input === "string" ? Buffer.from(input, "utf-8") : input;
  return crypto.createHash("sha256").update(buffer).digest("hex");
}
