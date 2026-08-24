import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-jwt-key-gestao-flats-saas-2026-production-ready"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas protegidas
  const protectedPrefixes = [
    "/dashboard",
    "/flats",
    "/locatarios",
    "/fornecedores",
    "/contratos",
    "/financeiro",
    "/parametros",
    "/empresa",
    "/funcionarios",
  ];

  const isProtectedPath = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isProtectedPath) {
    const accessToken = request.cookies.get("access_token")?.value;

    if (!accessToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(accessToken, JWT_SECRET);
      
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-empresa-id", (payload.empresaId as string) || "");
      requestHeaders.set("x-user-id", (payload.userId as string) || "");

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (err) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/flats/:path*",
    "/locatarios/:path*",
    "/fornecedores/:path*",
    "/contratos/:path*",
    "/financeiro/:path*",
    "/parametros/:path*",
    "/empresa/:path*",
    "/funcionarios/:path*",
  ],
};
