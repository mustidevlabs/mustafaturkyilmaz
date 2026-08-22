import type { Metadata } from "next";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { safeRedirectPath } from "@/lib/safe-redirect-path";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Giriş — Admin",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

const ERR_COPY: Record<string, string> = {
  credentials: "E-posta/kullanıcı adı veya şifre hatalı.",
  session: "Oturumunuz doldu. Yeniden giriş yapın.",
  strapi: "Strapi’ye ulaşılamadı. NEXT_PUBLIC_STRAPI_URL ve ağı kontrol edin.",
  signup_disabled:
    "Kendi kendine kayıt kapalı. Hesabı Strapi’de bir yönetici oluştursun (Ayarlar → Users).",
};

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const errKey = first(sp.e);
  const legacySignupKeys = new Set([
    "config",
    "invite",
    "fields",
    "taken",
    "register",
    "deploy",
    "created_signin",
  ]);
  const resolvedKey =
    errKey && legacySignupKeys.has(errKey) ? "signup_disabled" : errKey;
  const errMsg =
    resolvedKey && ERR_COPY[resolvedKey] ? ERR_COPY[resolvedKey] : null;
  const detailRaw = first(sp.d);
  const detail =
    typeof detailRaw === "string" && detailRaw.trim()
      ? detailRaw.trim().slice(0, 400)
      : null;
  const redirect = safeRedirectPath(first(sp.from));

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-4 py-16">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Admin</CardTitle>
          <CardDescription>
            Strapi uygulama kullanıcısı ile giriş yapın. Yeni hesaplar burada
            değil, Strapi Admin’de açılır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errMsg ? (
            <Alert tone="danger" className="mb-4">
              {errMsg}
              {detail && resolvedKey !== "signup_disabled" ? (
                <pre className="mt-2 max-h-32 overflow-auto font-mono text-xs">
                  {detail}
                </pre>
              ) : null}
            </Alert>
          ) : null}
          <form method="POST" action="/api/auth/login" className="space-y-3">
            <input type="hidden" name="redirect" value={redirect} />
            <div>
              <Label htmlFor="identifier">E-posta veya kullanıcı adı</Label>
              <Input
                id="identifier"
                name="identifier"
                required
                autoComplete="username"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full">
              Giriş yap
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
