import type { Metadata } from "next";
import { IssueLicenseForm } from "@/components/licensing/IssueLicenseForm";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import {
  fetchCustomers,
  fetchEditions,
  fetchLicenseByDocumentId,
} from "@/lib/ledgeria-licensing";
import { resolveLicenseSigningMaterial } from "@/lib/license/key-store";

export const metadata: Metadata = {
  title: "Lisans yayınla — Admin",
};

type Props = {
  searchParams: Promise<{
    customer?: string;
    edition?: string;
    fromLicense?: string;
    focus?: string;
  }>;
};

export default async function IssueLicensePage({ searchParams }: Props) {
  const {
    customer: defaultCustomerDocumentId,
    edition: defaultEditionKey,
    fromLicense: fromLicenseId,
    focus,
  } = await searchParams;
  const [customersResult, editionsResult, signing, sourceLicense] =
    await Promise.all([
      fetchCustomers(),
      fetchEditions(),
      resolveLicenseSigningMaterial(),
      fromLicenseId
        ? fetchLicenseByDocumentId(fromLicenseId)
        : Promise.resolve(null),
    ]);

  if (!customersResult.ok || !editionsResult.ok) {
    return (
      <div className="py-8">
        <PageHeader title="Lisans yayınla" />
        <Alert tone="danger" className="mt-4">
          Müşteri ve yetki paketi listeleri yüklenemedi. Strapi token ve izinleri
          kontrol edin.
        </Alert>
        <pre className="mt-4 max-h-40 overflow-auto rounded bg-muted p-3 text-xs">
          {!customersResult.ok
            ? customersResult.detail
            : !editionsResult.ok
              ? editionsResult.detail
              : ""}
        </pre>
      </div>
    );
  }

  return (
    <div className="py-2">
      <ButtonLink href="/ledgeria/licenses" variant="ghost" size="sm">
        ← Lisanslar
      </ButtonLink>
      <PageHeader
        className="mt-3"
        title="Lisans yayınla"
        description="Ed25519 imza sunucuda üretilir. Private key tarayıcıya gitmez."
      />
      {sourceLicense ? (
        <Alert className="mt-4">
          Önceki lisanstan dolduruldu:{" "}
          <code className="font-mono text-xs">{sourceLicense.licenseId}</code>.
          İmzalı dosya değiştirilemez — yeni süre için yeni lisans üretilir.
          Müşteri yeni dosyayı Ayarlar → Tercihler → Lisans üzerinden içe
          aktarmalı.
        </Alert>
      ) : null}
      {signing ? (
        <p className="mt-3 text-xs text-muted-foreground">
          İmzalama: keyId=
          <code className="font-mono">{signing.keyId}</code> ({signing.source})
        </p>
      ) : null}
      <IssueLicenseForm
        customers={customersResult.customers}
        editions={editionsResult.editions}
        defaultCustomerDocumentId={defaultCustomerDocumentId}
        defaultEditionKey={defaultEditionKey}
        sourceLicense={sourceLicense}
        highlightValidity={focus === "validity"}
        canSign={Boolean(signing)}
      />
    </div>
  );
}
