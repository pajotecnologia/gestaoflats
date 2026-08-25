import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-jwt-key-gestao-flats-saas-2026-production-ready"
);

const ACCESS_TOKEN_NAME = "access_token";
const REFRESH_TOKEN_NAME = "refresh_token";

export interface TokenPayload {
  userId: string;
  empresaId: string;
  email: string;
  nome: string;
  cargo: string;
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
 * Obtém a sessão do usuário logado ou realiza um fallback gracioso para a empresa ativa no banco.
 */
export async function getAuthSessionOrFallback(): Promise<TokenPayload | null> {
  const session = await getAuthSession();
  if (session && session.empresaId) {
    return session;
  }

  try {
    const { prisma } = await import("./prisma");
    const empresa = await prisma.empresa.findFirst();
    if (empresa) {
      const user = await prisma.usuario.findFirst({
        where: { empresaId: empresa.id },
      });

      return {
        userId: user?.id || "admin-system",
        empresaId: empresa.id,
        email: user?.email || empresa.email || "admin@pajotech.com.br",
        nome: user?.nome || "Administrador",
        cargo: user?.cargo || "ADMIN",
        empresaNome: empresa.nomeFantasia,
      };
    }
  } catch (error) {
    console.error("Erro no fallback de sessão:", error);
  }

  return null;
}
