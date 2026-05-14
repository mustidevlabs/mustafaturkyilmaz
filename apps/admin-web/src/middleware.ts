import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { STRAPI_USER_JWT_COOKIE } from "@/lib/admin-auth-constants";
import { isAuthSkipped } from "@/lib/admin-env";
import { verifyStrapiUserJwt } from "@/lib/strapi-user-auth";

function loginUrl(request: NextRequest, extra?: Record<string, string>): URL {
  const u = new URL("/login", request.url);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      u.searchParams.set(k, v);
    }
  }
  return u;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login")) {
    if (!isAuthSkipped()) {
      const jwt = request.cookies.get(STRAPI_USER_JWT_COOKIE)?.value;
      if (jwt && (await verifyStrapiUserJwt(jwt))) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/auth/login")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/auth/logout")) {
    return NextResponse.next();
  }

  if (isAuthSkipped()) {
    return NextResponse.next();
  }

  const jwt = request.cookies.get(STRAPI_USER_JWT_COOKIE)?.value;

  if (!jwt) {
    const dest = `${pathname}${request.nextUrl.search}`;
    const u = loginUrl(request);
    if (dest !== "/") u.searchParams.set("from", dest);
    return NextResponse.redirect(u);
  }

  const ok = await verifyStrapiUserJwt(jwt);
  if (!ok) {
    const res = NextResponse.redirect(loginUrl(request, { e: "session" }));
    res.cookies.set(STRAPI_USER_JWT_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
