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
  config:
    "Registration is not configured (set ADMIN_WEB_INVITE_SECRET on admin-web and the same value as ADMIN_WEB_INVITE_SECRET on Strapi).",
  invite: "Invitation code does not match.",
  fields: "Fill in username, email, and password.",
  taken: "That email or username is already registered.",
  register:
    "Registration was rejected by Strapi. If a detail line appears below, it comes from the server; otherwise check Strapi Cloud logs.",
  deploy:
    "Strapi returned 404 for the invite register route. Deploy the latest `backend` (with admin-auth route) and set ADMIN_WEB_INVITE_SECRET on Strapi Cloud.",
  created_signin:
    "Account was created but automatic sign-in failed. Try signing in manually.",
};

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const errKey = first(sp.e);
  const errMsg = errKey && ERR_COPY[errKey] ? ERR_COPY[errKey] : null;
  const detailRaw = first(sp.d);
  const detail =
    typeof detailRaw === "string" && detailRaw.trim()
      ? detailRaw.trim().slice(0, 400)
      : null;
  const redirect = safeRedirectPath(first(sp.from));
  const tab = first(sp.tab) === "register" ? "register" : "login";
  const fromParam = redirect !== "/" ? `from=${encodeURIComponent(redirect)}` : "";
  const hrefLogin = `/login${fromParam ? `?${fromParam}` : ""}`;
  const hrefRegister = `/login${fromParam ? `?${fromParam}&` : "?"}tab=register`;

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Admin
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in with your Strapi application user. Sign-up requires the invitation code; in
          Strapi keep <strong>Allow register</strong> disabled so only this path creates users.
        </p>

        {errMsg ? (
          <div className="mt-4 space-y-2">
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950/40 dark:text-red-100">
              {errMsg}
            </p>
            {detail ? (
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-red-200 bg-red-50/80 p-2 font-mono text-xs text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
                {detail}
              </pre>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 space-y-8">
          <section className={tab === "login" ? "" : "opacity-60"}>
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Sign in</h2>
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
          </section>

          <section className={tab === "register" ? "" : "opacity-60"}>
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Sign up (invite)
            </h2>
            <form
              method="POST"
              action="/api/auth/register"
              className="mt-3 flex flex-col gap-3"
            >
              <input type="hidden" name="redirect" value={redirect} />
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Invitation code
                <input
                  name="inviteSecret"
                  type="password"
                  required
                  autoComplete="off"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                  placeholder="Same as ADMIN_WEB_INVITE_SECRET"
                />
              </label>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Username
                <input
                  name="username"
                  type="text"
                  required
                  minLength={3}
                  autoComplete="username"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </label>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </label>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password (min 8 characters)
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </label>
              <button
                type="submit"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Create account and sign in
              </button>
            </form>
          </section>

          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            <a href={tab === "register" ? hrefLogin : hrefRegister} className="underline">
              {tab === "register" ? "Back to sign in" : "Need an account? Sign up"}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
