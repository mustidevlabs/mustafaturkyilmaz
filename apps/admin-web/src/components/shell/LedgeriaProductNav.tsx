"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [{ href: "/ledgeria/issues", label: "Issues" }] as const;

export function LedgeriaProductNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="flex flex-row gap-1 border-b border-zinc-200 pb-3 dark:border-zinc-800 lg:flex-col lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4"
      aria-label="Ledgeria"
    >
      <p className="hidden text-xs font-semibold uppercase tracking-wide text-zinc-500 lg:mb-2 lg:block dark:text-zinc-400">
        Ledgeria
      </p>
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100"
                : "rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
