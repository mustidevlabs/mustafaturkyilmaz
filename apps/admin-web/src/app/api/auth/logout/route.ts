import { STRAPI_USER_JWT_COOKIE } from "@/lib/admin-auth-constants";
import { redirectGet } from "@/lib/redirect-get";

export async function POST(request: Request) {
  const res = redirectGet(new URL("/login", request.url));
  res.cookies.set(STRAPI_USER_JWT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
