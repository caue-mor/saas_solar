import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas que não precisam de autenticação
const publicRoutes = [
  "/",
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
];

// Rotas que começam com estes prefixos são públicas
const publicPrefixes = [
  "/api/webhook",
  "/_next",
  "/favicon",
  "/images",
  "/icons",
];

// Arquivos estáticos que devem ser públicos
const staticFiles = [
  "/site.webmanifest",
  "/favicon.svg",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

// Cookie de autenticação
const AUTH_COOKIE = "solar_auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar se é rota pública
  const isPublicRoute = publicRoutes.includes(pathname);
  const isPublicPrefix = publicPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isStaticFile = staticFiles.includes(pathname);

  // Permitir rotas públicas e arquivos estáticos
  if (isPublicRoute || isPublicPrefix || isStaticFile) {
    return NextResponse.next();
  }

  // Verificar cookie de autenticação
  const authCookie = request.cookies.get(AUTH_COOKIE);

  // Se não está autenticado e tentando acessar rota protegida
  if (!authCookie?.value) {
    // Se é uma rota de API, retornar 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Redirecionar para login
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
