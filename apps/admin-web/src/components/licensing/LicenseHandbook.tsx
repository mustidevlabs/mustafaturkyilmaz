"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    n: 1,
    title: "Anahtar üret",
    body: "Ed25519 çifti oluştur. Private sunucuda kalır; tarayıcıya gitmez.",
    href: "/ledgeria/settings/license-keys",
    match: (p: string) => p.startsWith("/ledgeria/settings/license-keys"),
  },
  {
    n: 2,
    title: "Müşteri aç",
    body: "customerKey lisans dosyasına yazılır. Lisans şifresi bir kez gösterilir; masaüstü bu şifreyle URL’den indirir.",
    href: "/ledgeria/customers",
    match: (p: string) => p.startsWith("/ledgeria/customers"),
  },
  {
    n: 3,
    title: "Lisans yayınla",
    body: "Müşteri + yetki paketi, imzala, .ledgeria-license indir ve gönder.",
    href: "/ledgeria/licenses/issue",
    match: (p: string) => p.startsWith("/ledgeria/licenses"),
  },
  {
    n: 4,
    title: "Ledgeria’ya public",
    body: "Public kaydı yapıştırıp masaüstünü derle. LEDGERIA_LICENSE_DOWNLOAD_URL = admin /api/ledgeria/license. Müşteri: Ayarlar → Tercihler → Lisans (şifre veya dosya).",
    href: "/ledgeria/settings/license-keys",
    path: "packages/shared/src/config/licenseKeys.ts",
    match: () => false,
  },
] as const;

export function LicenseHandbook() {
  const pathname = usePathname() ?? "";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 justify-start gap-2 px-3 text-foreground/80 lg:w-full"
          aria-label="Lisans el kitabı"
        >
          <BookOpen className="size-4 shrink-0" />
          El kitabı
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Lisans el kitabı</SheetTitle>
          <SheetDescription>
            Uçtan uca sıra. Müşteri dosyayı ancak 4. adımdan sonra doğrular.
          </SheetDescription>
        </SheetHeader>
        <ol className="min-h-0 flex-1 space-y-0 overflow-y-auto px-5 py-4">
          {STEPS.map((step, i) => {
            const current = step.match(pathname);
            const last = i === STEPS.length - 1;
            return (
              <li key={step.n} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      current
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                    aria-hidden
                  >
                    {step.n}
                  </span>
                  {!last ? (
                    <span className="my-1 w-px flex-1 bg-border" aria-hidden />
                  ) : null}
                </div>
                <div className={cn("min-w-0 pb-5", last && "pb-1")}>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {step.title}
                    {current ? (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-primary">
                        Şimdi
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                  {"path" in step ? (
                    <code className="mt-1.5 block truncate font-mono text-[10px] text-foreground/70">
                      {step.path}
                    </code>
                  ) : null}
                  <SheetClose asChild>
                    <Link
                      href={step.href}
                      className="mt-1.5 inline-block text-xs font-medium text-primary hover:underline"
                    >
                      {current ? "Bu sayfa" : "Git →"}
                    </Link>
                  </SheetClose>
                </div>
              </li>
            );
          })}
        </ol>
      </SheetContent>
    </Sheet>
  );
}
