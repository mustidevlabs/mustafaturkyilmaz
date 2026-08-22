import type { Metadata } from "next";
import { EditionTable } from "@/components/licensing/EditionTable";
import { EmptyState } from "@/components/ui/empty-state";
import { NextStep } from "@/components/ui/next-step";
import { PageHeader } from "@/components/ui/page-header";
import { StrapiLoadError } from "@/components/ui/strapi-error";
import { fetchEditions } from "@/lib/ledgeria-licensing";
import { getStrapiPublicUrl } from "@/lib/strapi-public-url";

export const metadata: Metadata = {
  title: "Yetki paketleri — Admin",
};

export default async function LedgeriaEditionsPage() {
  const result = await fetchEditions();
  const STRAPI_URL = getStrapiPublicUrl();

  if (!result.ok) {
    return (
      <StrapiLoadError
        title="Yetki paketleri"
        reason={result.reason}
        detail={result.detail}
        strapiUrl={STRAPI_URL}
      />
    );
  }

  const { editions } = result;

  return (
    <div className="py-2">
      <PageHeader
        title="Yetki paketleri"
        description={`${editions.length} yetki paketi · yayınlamada özellikleri ön doldurur`}
      />
      <NextStep href="/ledgeria/licenses/issue" label="Lisans yayınla">
        Paket, yeni lisansta yetkileri hazır doldurur.
      </NextStep>

      {editions.length === 0 ? (
        <EmptyState
          title="Henüz yetki paketi yok"
          description={
            <>
              Strapi açılışında <code className="font-mono text-xs">ngo-full</code>{" "}
              ve{" "}
              <code className="font-mono text-xs">municipality-lite</code> seed
              edilir.
            </>
          }
        />
      ) : (
        <EditionTable editions={editions} />
      )}
    </div>
  );
}
