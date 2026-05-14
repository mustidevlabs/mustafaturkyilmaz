import Link from "next/link";
import { ProductSwitcher } from "@/components/shell/ProductSwitcher";
import { ExternalLinks } from "@/components/shell/ExternalLinks";

const portfolioUrl =
  process.env.NEXT_PUBLIC_PORTFOLIO_URL || "http://localhost:3000";

export function ShellHeader() {
  return (
    <header className="shrink-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Admin
          </Link>
          <ProductSwitcher />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExternalLinks />
          <form method="POST" action="/api/auth/logout" className="inline">
            <button
              type="submit"
              className="rounded-md px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Sign out
            </button>
          </form>
          <Link
            href={portfolioUrl}
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            target="_blank"
            rel="noreferrer"
          >
            Public portfolio →
          </Link>
        </div>
      </div>
    </header>
  );
}
