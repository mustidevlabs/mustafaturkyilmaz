"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type SVGProps,
} from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconHome(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 22V12h6v10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLedgeria(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPortfolio(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <rect
        x="3"
        y="3"
        width="7"
        height="9"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <rect
        x="14"
        y="12"
        width="7"
        height="9"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <rect
        x="3"
        y="16"
        width="7"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

type AppTile = {
  href: string;
  label: string;
  Icon: (p: IconProps) => ReactElement;
  match: (path: string) => boolean;
};

const APPS: AppTile[] = [
  {
    href: "/",
    label: "Ana sayfa",
    Icon: IconHome,
    match: (p) => p === "/",
  },
  {
    href: "/ledgeria",
    label: "Ledgeria",
    Icon: IconLedgeria,
    match: (p) => p.startsWith("/ledgeria"),
  },
  {
    href: "/portfolio",
    label: "Portföy",
    Icon: IconPortfolio,
    match: (p) => p.startsWith("/portfolio"),
  },
];

function GridIcon() {
  return (
    <span className="grid grid-cols-3 gap-0.5" aria-hidden>
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          className="size-1 rounded-[1px] bg-current opacity-80"
        />
      ))}
    </span>
  );
}

export function ProductSwitcher() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const activeApp = APPS.find((a) => a.match(pathname)) ?? APPS[0];
  const ActiveIcon = activeApp.Icon;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 text-sm font-medium shadow-sm hover:bg-muted"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Ürünler — etkin: ${activeApp.label}. Menüyü aç.`}
      >
        <GridIcon />
        <span
          className="flex size-8 items-center justify-center rounded-md bg-muted text-foreground"
          title={activeApp.label}
        >
          <ActiveIcon className="size-[18px]" />
        </span>
      </button>
      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,17rem)] rounded-xl border border-border bg-card p-3 shadow-lg"
          role="dialog"
          aria-label="Ürünler"
        >
          <ul className="grid grid-cols-3 gap-2">
            {APPS.map((app) => {
              const active = app.match(pathname);
              const Icon = app.Icon;
              return (
                <li key={app.href} className="aspect-square min-w-0">
                  <Link
                    href={app.href}
                    title={app.label}
                    aria-label={app.label}
                    className={
                      active
                        ? "flex h-full min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl border border-primary/30 bg-primary/10 p-2 text-primary"
                        : "flex h-full min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl border border-transparent p-2 text-foreground hover:border-border hover:bg-muted"
                    }
                    onClick={() => setOpen(false)}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-foreground shadow-sm ring-1 ring-border">
                      <Icon className="size-5" />
                    </span>
                    <span className="w-full truncate text-center text-[10px] font-medium leading-tight">
                      {app.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
