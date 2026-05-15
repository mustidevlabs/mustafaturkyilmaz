import { STRAPI_USER_JWT_COOKIE } from "@/lib/admin-auth-constants";
import { redirectGet } from "@/lib/redirect-get";
import { strapiHttpsPostJson } from "@/lib/strapi-https-json";
import { getStrapiPublicUrl } from "@/lib/strapi-public-url";
import { safeRedirectPath } from "@/lib/safe-redirect-path";

const COOKIE_MAX_SEC = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  let identifier = "";
  let password = "";
  let redirectTo = "/";
  const ct = request.headers.get("content-type") ?? "";

  if (ct.includes("application/json")) {
    const body: unknown = await request.json().catch(() => ({}));
    if (body && typeof body === "object") {
      const o = body as Record<string, unknown>;
      identifier = String(o.identifier ?? "").trim();
      password = String(o.password ?? "");
      redirectTo =
        typeof o.redirect === "string" ? o.redirect.trim() || "/" : "/";
    }
  } else {
    const fd = await request.formData();
    identifier = String(fd.get("identifier") ?? "").trim();
    password = String(fd.get("password") ?? "");
    redirectTo = String(fd.get("redirect") ?? "").trim() || "/";
  }

  if (!identifier || !password) {
    return redirectGet(new URL("/login?e=credentials", request.url));
  }

  const base = getStrapiPublicUrl().replace(/\/$/, "");
  let res: { statusCode: number; body: string };
  try {
    res = await strapiHttpsPostJson(`${base}/api/auth/local`, {
      identifier,
      password,
    });
  } catch {
    return redirectGet(new URL("/login?e=strapi", request.url));
  }

  const data: unknown = (() => {
    try {
      return JSON.parse(res.body) as unknown;
    } catch {
      return null;
    }
  })();

  const jwt =
    data &&
    typeof data === "object" &&
    "jwt" in data &&
    typeof (data as { jwt: unknown }).jwt === "string"
      ? (data as { jwt: string }).jwt
      : null;

  if (res.statusCode < 200 || res.statusCode >= 300 || !jwt) {
    return redirectGet(new URL("/login?e=credentials", request.url));
  }

  const nextPath = safeRedirectPath(redirectTo);
  const out = redirectGet(new URL(nextPath, request.url));
  out.cookies.set(STRAPI_USER_JWT_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_SEC,
  });
  return out;
}
