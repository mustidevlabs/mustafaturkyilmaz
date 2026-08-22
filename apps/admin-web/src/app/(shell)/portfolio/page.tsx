import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Portföy — Admin",
};

export default function PortfolioAdminPage() {
  return (
    <div className="py-2">
      <PageHeader
        title="Portföy CMS"
        description="Herkese açık site içeriği buradan yönetilecek. Henüz bağlı değil; Ledgeria’ya hub üzerinden dönebilirsiniz."
      />
    </div>
  );
}
