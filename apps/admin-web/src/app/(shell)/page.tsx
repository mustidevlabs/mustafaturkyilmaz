import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Admin — Ana sayfa",
};

const products = [
  {
    href: "/ledgeria",
    title: "Ledgeria",
    subtitle: "Lisanslama, yetki paketleri, müşteriler ve geri bildirim.",
  },
  {
    href: "/portfolio",
    title: "Portföy",
    subtitle: "Herkese açık site içeriği (CMS bağlantısı sırada).",
  },
];

export default function AdminHubPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-2xl font-semibold tracking-tight">Nereye?</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Bir ürün seçin. Yeni çalışma alanları geldikçe burada görünür.
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {products.map((p) => (
          <li key={p.href}>
            <Link href={p.href} className="block h-full">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col pt-5">
                  <CardTitle>{p.title}</CardTitle>
                  <CardDescription className="mt-2 flex-1">
                    {p.subtitle}
                  </CardDescription>
                  <span className="mt-4 text-sm font-medium text-primary">
                    Aç →
                  </span>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
