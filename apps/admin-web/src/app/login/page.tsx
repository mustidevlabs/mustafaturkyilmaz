import type { Metadata } from "next";
import { safeRedirectPath } from "@/lib/safe-redirect-path";

export const metadata: Metadata = {
  title: "Sign in — Admin",
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
  credentials: "Email/username or password is incorrect.",
  session: "Your session expired. Sign in again.",
  strapi: "Could not reach Strapi. Check NEXT_PUBLIC_STRAPI_URL and network.",
  signup_disabled:
    "Self-service sign-up is disabled. Ask an administrator to create your application user in Strapi (Settings → Users).",
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
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Admin
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in with your Strapi <strong>application user</strong> (Users &amp; Permissions).
          New accounts are created in Strapi Admin, not here.
        </p>

        {errMsg ? (
          <div className="mt-4 space-y-2">
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950/40 dark:text-red-100">
              {errMsg}
            </p>
            {detail && resolvedKey !== "signup_disabled" ? (
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-red-200 bg-red-50/80 p-2 font-mono text-xs text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
                {detail}
              </pre>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Sign in
          </h2>
          <form
            method="POST"
            action="/api/auth/login"
            className="mt-3 flex flex-col gap-3"
          >
            <input type="hidden" name="redirect" value={redirect} />
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email or username
              <input
                name="identifier"
                type="text"
                required
                autoComplete="username"
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Password
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
