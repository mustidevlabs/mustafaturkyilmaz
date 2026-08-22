"use client";

import { revokeLicenseFromForm } from "@/actions/ledgeria-licensing";
import type { LedgeriaLicenseRecord } from "@/lib/ledgeria-licensing";

export type LicenseDownloadExt = "json" | "ledgeria-license";

export function triggerLicenseFileDownload(
  signedLicenseJson: string,
  filenameBase: string,
  ext: LicenseDownloadExt
) {
  const blob = new Blob([signedLicenseJson], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

export function licenseFilenameBase(license: LedgeriaLicenseRecord): string {
  return `${license.customerKey}-${license.licenseId.slice(0, 8)}`;
}

export function LicenseDownloadButton({
  license,
}: {
  license: LedgeriaLicenseRecord;
}) {
  const base = licenseFilenameBase(license);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() =>
          triggerLicenseFileDownload(license.signedLicenseJson, base, "json")
        }
        className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
      >
        .json
      </button>
      <button
        type="button"
        onClick={() =>
          triggerLicenseFileDownload(
            license.signedLicenseJson,
            base,
            "ledgeria-license"
          )
        }
        className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
      >
        .ledgeria-license
      </button>
    </div>
  );
}

export function RevokeLicenseButton({ documentId }: { documentId: string }) {
  return (
    <form action={revokeLicenseFromForm}>
      <input type="hidden" name="documentId" value={documentId} />
      <button
        type="submit"
        className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
      >
        İptal edildi olarak işaretle
      </button>
    </form>
  );
}

export function PublishChannelStub({
  customerKey,
  updateChannel,
}: {
  customerKey: string;
  updateChannel: string | null;
}) {
  const channel = updateChannel || `customers/${customerKey}`;
  return (
    <details className="rounded-lg border border-dashed border-zinc-300 p-3 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
      <summary className="cursor-pointer font-medium text-zinc-800 dark:text-zinc-200">
        Güncelleme kanalı (stub)
      </summary>
      <p className="mt-2">
        Ledgeria GitHub Action <code className="font-mono">workflow_dispatch</code>{" "}
        ile <code className="font-mono">customer_key={customerKey}</code> / channel{" "}
        <code className="font-mono">{channel}</code> tetiklenir. MVP&apos;de CI
        entegrasyonu yok — kanal değerini masaüstü lisanstan okur.
      </p>
    </details>
  );
}
