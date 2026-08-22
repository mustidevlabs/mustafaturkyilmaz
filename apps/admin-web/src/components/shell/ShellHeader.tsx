import Link from "next/link";
import { ProductSwitcher } from "@/components/shell/ProductSwitcher";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { Button } from "@/components/ui/button";

export function ShellHeader() {
  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-md bg-foreground px-2 py-1 text-xs font-semibold uppercase tracking-wide text-background"
          >
            Admin
          </Link>
          <ProductSwitcher />
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <form method="POST" action="/api/auth/logout">
            <Button variant="ghost" size="sm" type="submit">
              Çıkış
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
