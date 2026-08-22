import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LicenseDetailActions } from "@/components/licensing/LicenseDetailActions";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  LEDGERIA_CAPABILITY_CATALOG,
  capabilityLabelTr,
} from "@/lib/license/capability";
import { tryParseSignedLicenseJson } from "@/lib/license/claims";
import { fetchLicenseByDocumentId } from "@/lib/ledgeria-licensing";

type Props = { params: Promise<{ documentId: string }> };

function formatDay(iso: string | null | undefined): string {
  if (!iso) return "Süresiz";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("tr-TR");
}

function statusOf(revoked: boolean, expiresAt: string | null) {
  if (revoked) return { label: "İptal", tone: "danger" as const };
  if (expiresAt && Date.parse(expiresAt) < Date.now()) {
    return { label: "Süresi doldu", tone: "warn" as const };
  }
  return { label: "Geçerli", tone: "success" as const };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { documentId } = await params;
  const license = await fetchLicenseByDocumentId(documentId);
  return {
    title: license
      ? `${license.licenseId.slice(0, 8)} — Lisans`
      : "Lisans — Admin",
  };
}

export default async function LicenseDetailPage({ params }: Props) {
  const { documentId } = await params;
  const license = await fetchLicenseByDocumentId(documentId);
  if (!license) notFound();

  const parsed = tryParseSignedLicenseJson(license.signedLicenseJson);
  const selected = new Set(license.capabilities);
  const status = statusOf(license.revoked, license.expiresAt);
  const customerHref = license.customerDocumentId
    ? `/ledgeria/customers/${license.customerDocumentId}`
    : null;

  return (
    <div className="py-2">
      <ButtonLink href="/ledgeria/licenses" variant="ghost" size="sm">
        ← Lisanslar
      </ButtonLink>
      <PageHeader
        className="mt-3"
        title="Lisans detayı"
        description={
          <code className="font-mono text-xs text-foreground">
            {license.licenseId}
          </code>
        }
        action={<Badge tone={status.tone}>{status.label}</Badge>}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <CardDescription>Müşteri</CardDescription>
            <CardTitle className="mt-1 text-base">
              {customerHref ? (
                <Link href={customerHref} className="hover:underline">
                  {license.customerKey}
                </Link>
              ) : (
                license.customerKey
              )}
            </CardTitle>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <CardDescription>Geçerlilik</CardDescription>
            <CardTitle className="mt-1 text-base">
              {formatDay(license.issuedAt)} – {formatDay(license.expiresAt)}
            </CardTitle>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <CardDescription>Cihaz</CardDescription>
            <CardTitle className="mt-1 text-base">
              {license.maxDevices != null
                ? `En fazla ${license.maxDevices}`
                : "Sınırsız"}
            </CardTitle>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <LicenseDetailActions license={license} />
      </div>

      <section className="mt-8 max-w-2xl space-y-3">
        <h2 className="text-sm font-semibold">Özellikler</h2>
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {LEDGERIA_CAPABILITY_CATALOG.map((mod) => {
            const children = (mod.children ?? []).filter((c) =>
              selected.has(c.id)
            );
            const on = selected.has(mod.id);
            if (!on && children.length === 0) return null;
            return (
              <li key={mod.id} className="px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  {mod.labelTr}
                </p>
                {children.length > 0 ? (
                  <ul className="mt-1 space-y-0.5 text-sm text-foreground/80">
                    {children.map((c) => (
                      <li key={c.id}>{c.labelTr}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
          {license.capabilities
            .filter((id) => !LEDGERIA_CAPABILITY_CATALOG.some((m) => m.id === id || m.children?.some((c) => c.id === id)))
            .map((id) => (
              <li key={id} className="px-4 py-3 text-sm">
                {capabilityLabelTr(id)}
              </li>
            ))}
        </ul>
      </section>

      <dl className="mt-8 grid max-w-2xl gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-foreground/70">Paket</dt>
          <dd className="font-mono text-foreground">{license.edition}</dd>
        </div>
        <div>
          <dt className="text-foreground/70">keyId</dt>
          <dd className="font-mono text-foreground">{license.keyId}</dd>
        </div>
        <div>
          <dt className="text-foreground/70">Kanal</dt>
          <dd className="font-mono text-foreground">
            {license.updateChannel ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-foreground/70">clientId</dt>
          <dd className="font-mono text-foreground">
            {parsed?.claims.clientId ?? license.clientId ?? "—"}
          </dd>
        </div>
        {license.notes ? (
          <div className="sm:col-span-2">
            <dt className="text-foreground/70">Notlar</dt>
            <dd className="text-foreground">{license.notes}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
