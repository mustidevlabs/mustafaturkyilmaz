import type { Metadata } from "next";
import { LicenseKeysWizard } from "@/components/licensing/LicenseKeysWizard";
import { InfoTip } from "@/components/ui/info-tip";
import { NextStep } from "@/components/ui/next-step";
import { PageHeader } from "@/components/ui/page-header";
import { getSigningKeyMeta } from "@/lib/license/key-store";

export const metadata: Metadata = {
  title: "Lisans anahtarları — Admin",
};

export default async function LicenseKeysSettingsPage() {
  const meta = await getSigningKeyMeta();

  return (
    <div className="py-2">
      <PageHeader
        title="Lisans anahtarları"
        hint={
          <InfoTip label="İmzalama hakkında">
            Ed25519 çifti sunucuda kalır (.data veya env). Private tarayıcıya
            gitmez. Public’i Ledgeria licenseKeys.ts dosyasına ekleyin.
          </InfoTip>
        }
      />
      {meta ? (
        <NextStep href="/ledgeria/customers" label="Müşteri aç">
          Mühür hazır. Sıradaki adım müşteri.
        </NextStep>
      ) : null}
      <LicenseKeysWizard initialMeta={meta} />
    </div>
  );
}
