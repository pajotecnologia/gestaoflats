import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-jwt-key-gestao-flats-saas-2026-production-ready"
);

const ACCESS_TOKEN_NAME = "access_token";
const REFRESH_TOKEN_NAME = "refresh_token";

export const SUPER_ADMIN_EMAILS = [
  "pajotecnologia@gmail.com",
  "admin@primeflats.com.br",
  "contato@pajotech.com.br",
  "admin@pajotech.com.br",
  "admin@pajotecnologia.com.br",
];

/**
 * Valida se um usuário é Super Administrador global do SaaS
 */
export function isUserSuperAdmin(email?: string | null, cargo?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  
  if (cargo === "SUPER_ADMIN") return true;
  if (SUPER_ADMIN_EMAILS.includes(cleanEmail)) return true;
  if (process.env.ADMIN_NOTIFICATION_EMAIL && cleanEmail === process.env.ADMIN_NOTIFICATION_EMAIL.trim().toLowerCase()) {
    return true;
  }
  return false;
}

export interface TokenPayload {
  userId: string;
  empresaId: string;
  email: string;
  nome: string;
  cargo: string;
  isSuperAdmin?: boolean;
  [key: string]: unknown;
}

/**
 * Hash de senha com bcrypt (salt rounds = 12) para máxima segurança.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Compara a senha informada com o hash salvo no banco.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Gera um JWT Access Token assinado.
 */
export async function createAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(JWT_SECRET);
}

/**
 * Gera um JWT Refresh Token.
 */
export async function createRefreshToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, empresaId: payload.empresaId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Verifica um token JWT.
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Define os cookies seguros HttpOnly no cliente.
 */
export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = cookies();
  // Só define secure=true se a URL configurada iniciar explicitamente com https://
  const isHttps = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") || false;

  cookieStore.set(ACCESS_TOKEN_NAME, accessToken, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });

  cookieStore.set(REFRESH_TOKEN_NAME, refreshToken, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
}

/**
 * Remove os cookies HttpOnly no logout.
 */
export async function clearAuthCookies() {
  const cookieStore = cookies();
  cookieStore.delete(ACCESS_TOKEN_NAME);
  cookieStore.delete(REFRESH_TOKEN_NAME);
}

/**
 * Obtém a sessão do usuário logado diretamente dos cookies HttpOnly no servidor.
 */
export async function getAuthSession(): Promise<TokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(ACCESS_TOKEN_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Obtém a sessão do usuário logado.
 * Retorna a sessão ativa ou null se o usuário não estiver devidamente autenticado.
 */
export async function getAuthSessionOrFallback(): Promise<TokenPayload | null> {
  const session = await getAuthSession();
  if (session && session.empresaId) {
    return session;
  }
  return null;
}

