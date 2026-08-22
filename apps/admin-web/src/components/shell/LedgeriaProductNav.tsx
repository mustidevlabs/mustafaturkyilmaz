"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LicenseHandbook } from "@/components/licensing/LicenseHandbook";
import { cn } from "@/lib/utils";

const licenseFlow = [
  {
    href: "/ledgeria/settings/license-keys",
    label: "Lisans anahtarları",
    step: 1,
  },
  { href: "/ledgeria/customers", label: "Müşteriler", step: 2 },
  { href: "/ledgeria/licenses", label: "Lisanslar", step: 3 },
  { href: "/ledgeria/editions", label: "Yetki paketleri" },
] as const;

function NavLink({
  href,
  label,
  pathname,
  step,
}: {
  href: string;
  label: string;
  pathname: string;
  step?: number;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
        active
          ? "bg-primary/15 text-primary"
          : "text-foreground/80 hover:bg-muted hover:text-foreground"
      )}
    >
      {step != null ? (
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
            active
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
          aria-hidden
        >
          {step}
        </span>
      ) : null}
      <span>{label}</span>
    </Link>
  );
}

export function LedgeriaProductNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
      aria-label="Ledgeria"
    >
      <div className="lg:mb-3">
        <LicenseHandbook />
      </div>
      <p className="hidden px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:mb-1 lg:block">
        Sıra
      </p>
      {licenseFlow.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          pathname={pathname}
          step={"step" in item ? item.step : undefined}
        />
      ))}
      <div className="hidden lg:my-3 lg:block lg:h-px lg:bg-border" aria-hidden />
      <NavLink
        href="/ledgeria/issues"
        label="Geri bildirim"
        pathname={pathname}
      />
    </nav>
  );
}
