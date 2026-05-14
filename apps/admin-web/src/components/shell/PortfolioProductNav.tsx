"use client";

export function PortfolioProductNav() {
  return (
    <nav
      className="flex flex-row gap-1 border-b border-zinc-200 pb-3 dark:border-zinc-800 lg:flex-col lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4"
      aria-label="Portfolio"
    >
      <p className="hidden text-xs font-semibold uppercase tracking-wide text-zinc-500 lg:mb-2 lg:block dark:text-zinc-400">
        Portfolio
      </p>
      <span className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 dark:text-zinc-500">
        CMS (soon)
      </span>
    </nav>
  );
}
