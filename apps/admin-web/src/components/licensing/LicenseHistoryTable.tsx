"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  licenseFilenameBase,
  triggerLicenseFileDownload,
} from "@/components/licensing/LicenseActions";
import type { LedgeriaLicenseRecord } from "@/lib/ledgeria-licensing";
import { ActionMenu } from "@/components/ui/action-menu";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { Table, THead, Th, Td, Tr } from "@/components/ui/table";
import {
  deleteLicenseFromForm,
  revokeLicenseFromForm,
} from "@/actions/ledgeria-licensing";

function formatDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("tr-TR");
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  return !Number.isNaN(t) && t < Date.now();
}

function statusOf(lic: LedgeriaLicenseRecord): "revoked" | "expired" | "valid" {
  if (lic.revoked) return "revoked";
  if (isExpired(lic.expiresAt)) return "expired";
  return "valid";
}

export function LicenseHistoryTable({
  licenses,
  showCustomer = true,
}: {
  licenses: LedgeriaLicenseRecord[];
  showCustomer?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "valid" | "expired" | "revoked">(
    "all"
  );
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return licenses.filter((lic) => {
      const st = statusOf(lic);
      if (status !== "all" && st !== status) return false;
      if (!needle) return true;
      return (
        lic.licenseId.toLowerCase().includes(needle) ||
        lic.customerKey.toLowerCase().includes(needle) ||
        (lic.edition ?? "").toLowerCase().includes(needle)
      );
    });
  }, [licenses, q, status]);

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Lisans, müşteri veya paket ara…"
          className="max-w-xs"
        />
        <NativeSelect
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "all" | "valid" | "expired" | "revoked")
          }
          className="w-44"
        >
          <option value="all">Tüm durumlar</option>
          <option value="valid">Geçerli</option>
          <option value="expired">Süresi doldu</option>
          <option value="revoked">İptal</option>
        </NativeSelect>
      </div>
      <Table>
        <THead>
          <tr>
            <Th>Lisans</Th>
            {showCustomer ? <Th>Müşteri</Th> : null}
            <Th>Paket</Th>
            <Th>Geçerlilik</Th>
            <Th>Cihaz</Th>
            <Th>Özellik</Th>
            <Th>Durum</Th>
            <Th className="w-12" />
          </tr>
        </THead>
        <tbody>
          {rows.length === 0 ? (
            <Tr>
              <Td
                colSpan={showCustomer ? 8 : 7}
                className="text-muted-foreground"
              >
                Eşleşen kayıt yok.
              </Td>
            </Tr>
          ) : (
            rows.map((lic) => {
              const st = statusOf(lic);
              const issued = formatDay(lic.issuedAt);
              const until = formatDay(lic.expiresAt);
              const customerHref = lic.customerDocumentId
                ? `/ledgeria/customers/${lic.customerDocumentId}`
                : undefined;
              return (
                <Tr key={lic.documentId}>
                  <Td>
                    <Link
                      href={`/ledgeria/licenses/${lic.documentId}`}
                      className="font-mono text-[11px] text-foreground hover:underline"
                    >
                      {lic.licenseId}
                    </Link>
                  </Td>
                  {showCustomer ? (
                    <Td>
                      {customerHref ? (
                        <Link
                          href={customerHref}
                          className="font-mono text-xs hover:underline"
                        >
                          {lic.customerKey}
                        </Link>
                      ) : (
                        <code className="font-mono text-xs">{lic.customerKey}</code>
                      )}
                    </Td>
                  ) : null}
                  <Td className="font-mono text-xs">{lic.edition}</Td>
                  <Td className="whitespace-nowrap text-xs text-muted-foreground">
                    {until ? `${issued} – ${until}` : `${issued} · Süresiz`}
                  </Td>
                  <Td className="whitespace-nowrap text-xs text-muted-foreground">
                    {lic.maxDevices != null
                      ? `En fazla ${lic.maxDevices}`
                      : "Sınırsız"}
                  </Td>
                  <Td className="tabular-nums text-xs text-muted-foreground">
                    {lic.capabilities.length}
                  </Td>
                  <Td>
                    <Badge
                      tone={
                        st === "revoked"
                          ? "danger"
                          : st === "expired"
                            ? "warn"
                            : "success"
                      }
                    >
                      {st === "revoked"
                        ? "İptal"
                        : st === "expired"
                          ? "Süresi doldu"
                          : "Geçerli"}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <ActionMenu
                      items={[
                        {
                          label: "Detay",
                          href: `/ledgeria/licenses/${lic.documentId}`,
                        },
                        {
                          label: ".ledgeria-license indir",
                          onClick: () =>
                            triggerLicenseFileDownload(
                              lic.signedLicenseJson,
                              licenseFilenameBase(lic),
                              "ledgeria-license"
                            ),
                        },
                        {
                          label: ".json indir",
                          onClick: () =>
                            triggerLicenseFileDownload(
                              lic.signedLicenseJson,
                              licenseFilenameBase(lic),
                              "json"
                            ),
                        },
                        {
                          label: "Süreyi değiştir",
                          href: `/ledgeria/licenses/issue?fromLicense=${encodeURIComponent(lic.documentId)}&focus=validity`,
                        },
                        {
                          label: "Yeniden yayınla",
                          href: `/ledgeria/licenses/issue?fromLicense=${encodeURIComponent(lic.documentId)}`,
                        },
                        ...(lic.revoked
                          ? []
                          : [
                              {
                                label: "İptal et",
                                destructive: true,
                                onClick: () => setRevokeId(lic.documentId),
                              },
                            ]),
                        {
                          label: "Sil",
                          destructive: true,
                          onClick: () => setDeleteId(lic.documentId),
                        },
                      ]}
                    />
                  </Td>
                </Tr>
              );
            })
          )}
        </tbody>
      </Table>
      <ConfirmDialog
        open={Boolean(revokeId)}
        title="Lisansı iptal et?"
        description="Kayıt iptal olarak işaretlenir. İmzalı dosya değişmez; müşteri yeni bir lisans içe aktarmadan masaüstünde eski dosya durur."
        confirmLabel="İptal et"
        destructive
        pending={pending}
        onClose={() => setRevokeId(null)}
        onConfirm={async () => {
          if (!revokeId) return;
          setPending(true);
          const fd = new FormData();
          fd.set("documentId", revokeId);
          await revokeLicenseFromForm(fd);
          setPending(false);
          setRevokeId(null);
          router.refresh();
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Lisansı sil?"
        description="Admin kaydı kalıcı olarak silinir. Masaüstüne yüklenmiş dosya durur."
        confirmLabel="Sil"
        destructive
        pending={pending}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          setPending(true);
          const fd = new FormData();
          fd.set("documentId", deleteId);
          await deleteLicenseFromForm(fd);
          setPending(false);
          setDeleteId(null);
          router.refresh();
        }}
      />
    </div>
  );
}
