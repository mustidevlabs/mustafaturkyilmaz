import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerDownloadPassword } from "@/components/licensing/CustomerDownloadPassword";
import { DeleteCustomerForm, EditCustomerForm } from "@/components/licensing/CustomerForms";
import { LicenseHistoryTable } from "@/components/licensing/LicenseHistoryTable";
import { ButtonLink } from "@/components/ui/button-link";
import { NextStep } from "@/components/ui/next-step";
import { PageHeader } from "@/components/ui/page-header";
import { licenseDownloadPublicUrl } from "@/lib/license/download-password";
import { readDownloadPasswordReveal } from "@/lib/license/password-reveal-cookie";
import {
  fetchCustomerByDocumentId,
  fetchLicenses,
} from "@/lib/ledgeria-licensing";

type Props = { params: Promise<{ documentId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { documentId } = await params;
  const customer = await fetchCustomerByDocumentId(documentId);
  return {
    title: customer ? `${customer.displayName} — Müşteri` : "Müşteri — Admin",
  };
}

export default async function CustomerDetailPage({ params }: Props) {
  const { documentId } = await params;
  const customer = await fetchCustomerByDocumentId(documentId);
  if (!customer) notFound();

  const licensesResult = await fetchLicenses({
    customerDocumentId: customer.documentId,
  });
  const licenses = licensesResult.ok ? licensesResult.licenses : [];
  const initialPassword = await readDownloadPasswordReveal(customer.documentId);

  return (
    <div className="py-2">
      <ButtonLink href="/ledgeria/customers" variant="ghost" size="sm">
        ← Müşteriler
      </ButtonLink>
      <PageHeader
        className="mt-3"
        title={customer.displayName}
        description={
          <>
            Anahtar:{" "}
            <code className="font-mono text-xs">{customer.customerKey}</code>
          </>
        }
        action={
          <ButtonLink
            href={`/ledgeria/licenses/issue?customer=${customer.documentId}`}
          >
            Lisans yayınla
          </ButtonLink>
        }
      />
      {licenses.length === 0 ? (
        <NextStep
          href={`/ledgeria/licenses/issue?customer=${customer.documentId}`}
          label="Lisans yayınla"
        >
          Şifre hazır. Sıradaki adım bu müşteriye lisans.
        </NextStep>
      ) : (
        <NextStep href="/ledgeria/settings/license-keys" label="Public’i kontrol et">
          Şifreyi müşteriye ver. Masaüstü URL’den indirir; public key Ledgeria’da
          olmalı.
        </NextStep>
      )}

      <CustomerDownloadPassword
        documentId={customer.documentId}
        hasDownloadPassword={customer.hasDownloadPassword}
        downloadPasswordSetAt={customer.downloadPasswordSetAt}
        occupiedDeviceCount={customer.occupiedDeviceCount}
        initialPassword={initialPassword}
        downloadUrl={licenseDownloadPublicUrl()}
      />

      <EditCustomerForm customer={customer} />
      <DeleteCustomerForm
        documentId={customer.documentId}
        customerKey={customer.customerKey}
      />

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Lisans geçmişi</h2>
        <LicenseHistoryTable licenses={licenses} showCustomer={false} />
      </section>
    </div>
  );
}
