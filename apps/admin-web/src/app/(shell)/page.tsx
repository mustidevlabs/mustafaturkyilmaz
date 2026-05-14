import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin — Home",
};

const products = [
  {
    href: "/ledgeria/issues",
    title: "Ledgeria",
    subtitle: "Issue inbox, board, and Strapi-backed workflows.",
    tone: "emerald" as const,
  },
  {
    href: "/portfolio",
    title: "Portfolio",
    subtitle: "Public site content (CMS wiring next).",
    tone: "zinc" as const,
  },
];

export default function AdminHubPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Where to?
      </h1>
      <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
        Pick a product. More workspaces will show up here as they ship.
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {products.map((p) => (
          <li key={p.href}>
            <Link
              href={p.href}
              className={
                p.tone === "emerald"
                  ? "flex h-full flex-col rounded-xl border border-emerald-200/80 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-emerald-900/50 dark:bg-zinc-900 dark:hover:border-emerald-800"
                  : "flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
              }
            >
              <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {p.title}
              </span>
              <span className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {p.subtitle}
              </span>
              <span className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400">
                Open →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
