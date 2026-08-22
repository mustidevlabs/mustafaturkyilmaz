import type { Metadata } from "next";
import { CustomerTable } from "@/components/licensing/CustomerTable";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { NextStep } from "@/components/ui/next-step";
import { PageHeader } from "@/components/ui/page-header";
import { StrapiLoadError } from "@/components/ui/strapi-error";
import { fetchCustomers } from "@/lib/ledgeria-licensing";
import { getStrapiPublicUrl } from "@/lib/strapi-public-url";

export const metadata: Metadata = {
  title: "Ledgeria müşteriler — Admin",
};

export default async function LedgeriaCustomersPage() {
  const result = await fetchCustomers();
  const STRAPI_URL = getStrapiPublicUrl();

  if (!result.ok) {
    return (
      <StrapiLoadError
        title="Müşteriler"
        reason={result.reason}
        detail={result.detail}
        strapiUrl={STRAPI_URL}
      />
    );
  }

  const { customers } = result;

  return (
    <div className="py-2">
      <PageHeader
        title="Müşteriler"
        description={`${customers.length} kayıt · lisans dosyasına yazılan anahtarı siz belirlersiniz`}
        action={<ButtonLink href="/ledgeria/customers/new">Yeni müşteri</ButtonLink>}
      />
      {customers.length > 0 ? (
        <NextStep href="/ledgeria/licenses/issue" label="Lisans yayınla">
          Sıradaki adım lisans.
        </NextStep>
      ) : null}

      {customers.length === 0 ? (
        <EmptyState
          title="Henüz müşteri yok"
          description={
            <>
              İlk kaydı <code className="font-mono text-xs">demo-musteri</code>{" "}
              gibi bir anahtarla oluşturun; ardından lisans yayınlayabilirsiniz.
            </>
          }
          action={
            <ButtonLink href="/ledgeria/customers/new">
              İlk müşteriyi oluştur
            </ButtonLink>
          }
        />
      ) : (
        <CustomerTable customers={customers} />
      )}
    </div>
  );
}
