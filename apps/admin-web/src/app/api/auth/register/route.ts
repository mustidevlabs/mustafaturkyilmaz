import { NextResponse } from "next/server";
import { STRAPI_USER_JWT_COOKIE } from "@/lib/admin-auth-constants";
import { strapiHttpsPostJson } from "@/lib/strapi-https-json";
import { getStrapiPublicUrl } from "@/lib/strapi-public-url";
import { safeRedirectPath } from "@/lib/safe-redirect-path";

const COOKIE_MAX_SEC = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  const expectedInvite = process.env.ADMIN_WEB_INVITE_SECRET?.trim();
  if (!expectedInvite) {
    return NextResponse.redirect(new URL("/login?e=config&tab=register", request.url));
  }

  let username = "";
  let email = "";
  let password = "";
  let inviteSecret = "";
  let redirectTo = "/";
  const ct = request.headers.get("content-type") ?? "";

  if (ct.includes("application/json")) {
    const body: unknown = await request.json().catch(() => ({}));
    if (body && typeof body === "object") {
      const o = body as Record<string, unknown>;
      username = String(o.username ?? "").trim();
      email = String(o.email ?? "").trim().toLowerCase();
      password = String(o.password ?? "");
      inviteSecret = String(o.inviteSecret ?? "").trim();
      redirectTo =
        typeof o.redirect === "string" ? o.redirect.trim() || "/" : "/";
    }
  } else {
    const fd = await request.formData();
    username = String(fd.get("username") ?? "").trim();
    email = String(fd.get("email") ?? "").trim().toLowerCase();
    password = String(fd.get("password") ?? "");
    inviteSecret = String(fd.get("inviteSecret") ?? "").trim();
    redirectTo = String(fd.get("redirect") ?? "").trim() || "/";
  }

  if (inviteSecret !== expectedInvite) {
    return NextResponse.redirect(new URL("/login?e=invite&tab=register", request.url));
  }

  if (!username || !email || !password) {
    return NextResponse.redirect(new URL("/login?e=fields&tab=register", request.url));
  }

  const base = getStrapiPublicUrl().replace(/\/$/, "");

  let regRes: { statusCode: number; body: string };
  try {
    regRes = await strapiHttpsPostJson(
      `${base}/api/admin-auth/register`,
      { username, email, password },
      { "x-admin-invite-secret": expectedInvite }
    );
  } catch {
    return NextResponse.redirect(new URL("/login?e=strapi&tab=register", request.url));
  }

  if (regRes.statusCode === 404) {
    return NextResponse.redirect(new URL("/login?e=deploy&tab=register", request.url));
  }

  if (regRes.statusCode < 200 || regRes.statusCode >= 300) {
    let msg = "";
    try {
      const errBody = JSON.parse(regRes.body) as unknown;
      if (
        errBody &&
        typeof errBody === "object" &&
        "error" in errBody &&
        errBody.error &&
        typeof errBody.error === "object" &&
        "message" in (errBody.error as object)
      ) {
        msg = String((errBody as { error: { message?: string } }).error.message ?? "");
      }
    } catch {
      /* ignore */
    }
    const q = msg.toLowerCase().includes("taken") ? "taken" : "register";
    const detail = msg.replace(/\s+/g, " ").trim().slice(0, 220);
    const u = new URL(`/login`, request.url);
    u.searchParams.set("e", q);
    u.searchParams.set("tab", "register");
    if (detail) u.searchParams.set("d", detail);
    return NextResponse.redirect(u);
  }

  let loginRes: { statusCode: number; body: string };
  try {
    loginRes = await strapiHttpsPostJson(`${base}/api/auth/local`, {
      identifier: email,
      password,
    });
  } catch {
    return NextResponse.redirect(new URL("/login?e=strapi&tab=register", request.url));
  }

  const loginData: unknown = (() => {
    try {
      return JSON.parse(loginRes.body) as unknown;
    } catch {
      return null;
    }
  })();

  const jwt =
    loginData &&
    typeof loginData === "object" &&
    "jwt" in loginData &&
    typeof (loginData as { jwt: unknown }).jwt === "string"
      ? (loginData as { jwt: string }).jwt
      : null;

  if (loginRes.statusCode < 200 || loginRes.statusCode >= 300 || !jwt) {
    return NextResponse.redirect(
      new URL("/login?e=created_signin&tab=register", request.url)
    );
  }

  const nextPath = safeRedirectPath(redirectTo);
  const out = NextResponse.redirect(new URL(nextPath, request.url));
  out.cookies.set(STRAPI_USER_JWT_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_SEC,
  });
  return out;
}
