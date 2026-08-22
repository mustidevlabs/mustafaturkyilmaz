"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteLicenseFromForm,
  revokeLicenseFromForm,
} from "@/actions/ledgeria-licensing";
import {
  licenseFilenameBase,
  triggerLicenseFileDownload,
} from "@/components/licensing/LicenseActions";
import type { LedgeriaLicenseRecord } from "@/lib/ledgeria-licensing";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function LicenseDetailActions({
  license,
}: {
  license: LedgeriaLicenseRecord;
}) {
  const router = useRouter();
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const base = licenseFilenameBase(license);

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() =>
          triggerLicenseFileDownload(
            license.signedLicenseJson,
            base,
            "ledgeria-license"
          )
        }
      >
        .ledgeria-license indir
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          triggerLicenseFileDownload(license.signedLicenseJson, base, "json")
        }
      >
        .json indir
      </Button>
      <ButtonLink
        href={`/ledgeria/licenses/issue?fromLicense=${encodeURIComponent(license.documentId)}&focus=validity`}
        variant="outline"
      >
        Süreyi değiştir
      </ButtonLink>
      <ButtonLink
        href={`/ledgeria/licenses/issue?fromLicense=${encodeURIComponent(license.documentId)}`}
        variant="outline"
      >
        Yeniden yayınla
      </ButtonLink>
      {!license.revoked ? (
        <Button variant="destructive" onClick={() => setRevokeOpen(true)}>
          İptal et
        </Button>
      ) : null}
      <Button
        variant={license.revoked ? "destructive" : "outline"}
        onClick={() => setDeleteOpen(true)}
      >
        Sil
      </Button>
      <ConfirmDialog
        open={revokeOpen}
        title="Lisansı iptal et?"
        description="Kayıt iptal olarak işaretlenir. İmzalı dosya değişmez."
        confirmLabel="İptal et"
        destructive
        pending={pending}
        onClose={() => setRevokeOpen(false)}
        onConfirm={async () => {
          setPending(true);
          const fd = new FormData();
          fd.set("documentId", license.documentId);
          await revokeLicenseFromForm(fd);
          setPending(false);
          setRevokeOpen(false);
          router.refresh();
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="Lisansı sil?"
        description="Admin kaydı kalıcı olarak silinir. Masaüstüne yüklenmiş dosya durur."
        confirmLabel="Sil"
        destructive
        pending={pending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setPending(true);
          const fd = new FormData();
          fd.set("documentId", license.documentId);
          const result = await deleteLicenseFromForm(fd);
          setPending(false);
          setDeleteOpen(false);
          if (result.ok) {
            router.push("/ledgeria/licenses");
            router.refresh();
          }
        }}
      />
    </div>
  );
}
