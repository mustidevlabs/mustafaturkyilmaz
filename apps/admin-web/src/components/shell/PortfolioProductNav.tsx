"use client";

export function PortfolioProductNav() {
  return (
    <nav className="flex flex-col gap-1" aria-label="Portföy">
      <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Portföy
      </p>
      <span className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground">
        CMS (yakında)
      </span>
    </nav>
  );
}
