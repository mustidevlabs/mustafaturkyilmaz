import type { Metadata } from "next";
import { LicenseHistoryTable } from "@/components/licensing/LicenseHistoryTable";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { NextStep } from "@/components/ui/next-step";
import { PageHeader } from "@/components/ui/page-header";
import { StrapiLoadError } from "@/components/ui/strapi-error";
import { fetchLicenses } from "@/lib/ledgeria-licensing";
import { getStrapiPublicUrl } from "@/lib/strapi-public-url";

export const metadata: Metadata = {
  title: "Ledgeria lisanslar — Admin",
};

type Props = { searchParams: Promise<{ issued?: string }> };

export default async function LedgeriaLicensesPage({ searchParams }: Props) {
  const { issued } = await searchParams;
  const result = await fetchLicenses();
  const STRAPI_URL = getStrapiPublicUrl();

  if (!result.ok) {
    return (
      <StrapiLoadError
        title="Lisanslar"
        reason={result.reason}
        detail={result.detail}
        strapiUrl={STRAPI_URL}
      />
    );
  }

  const { licenses } = result;

  return (
    <div className="py-2">
      <PageHeader
        title="Lisanslar"
        description={`${licenses.length} kayıt · imzalı .ledgeria-license indirme`}
        action={
          <ButtonLink href="/ledgeria/licenses/issue">Lisans yayınla</ButtonLink>
        }
      />
      {licenses.length > 0 ? (
        <NextStep href="/ledgeria/customers" label="Şifreyi ilet">
          Süre uzatma ve ilk kurulum: müşteri şifresiyle URL’den indirir. Public
          key Ledgeria’da olmalı.
        </NextStep>
      ) : null}

      {issued ? (
        <Alert tone="success" className="mt-4">
          Lisans oluşturuldu: <code className="font-mono text-xs">{issued}</code>{" "}
          — aşağıdan tekrar indirin. Masaüstü: Ayarlar → Tercihler → Lisans.
        </Alert>
      ) : null}

      {licenses.length === 0 ? (
        <EmptyState
          title="Henüz lisans yok"
          description="Bir müşteri seçip özellikleri işaretleyin; imzalı dosya indirilir."
          action={
            <ButtonLink href="/ledgeria/licenses/issue">
              İlk lisansı yayınla
            </ButtonLink>
          }
        />
      ) : (
        <LicenseHistoryTable licenses={licenses} />
      )}
    </div>
  );
}
