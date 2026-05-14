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
    label: "Home",
    Icon: IconHome,
    match: (p) => p === "/",
  },
  {
    href: "/ledgeria/issues",
    label: "Ledgeria",
    Icon: IconLedgeria,
    match: (p) => p.startsWith("/ledgeria"),
  },
  {
    href: "/portfolio",
    label: "Portfolio",
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
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Products — active: ${activeApp.label}. Open menu.`}
      >
        <GridIcon />
        <span
          className="flex size-8 items-center justify-center rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          title={activeApp.label}
        >
          <ActiveIcon className="size-[18px]" />
        </span>
      </button>
      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,17rem)] rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          role="dialog"
          aria-label="Products"
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
                        ? "flex h-full min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100"
                        : "flex h-full min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl border border-transparent p-2 text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                    }
                    onClick={() => setOpen(false)}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-900 dark:ring-zinc-600">
                      <Icon className="size-5" />
                    </span>
                    <span className="w-full truncate text-center text-[10px] font-medium leading-tight text-zinc-700 dark:text-zinc-300">
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
