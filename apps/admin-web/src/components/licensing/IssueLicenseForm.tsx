"use client";

import { useEffect, useMemo, useRef, useState, useActionState } from "react";
import Link from "next/link";
import {
  issueLicenseFromForm,
  type IssueLicenseResult,
} from "@/actions/ledgeria-licensing";
import { CapabilityTree } from "@/components/licensing/CapabilityTree";
import { triggerLicenseFileDownload } from "@/components/licensing/LicenseActions";
import { LicenseValidityFields } from "@/components/licensing/LicenseValidityFields";
import { tryParseSignedLicenseJson } from "@/lib/license/claims";
import { normalizeCapabilities } from "@/lib/license/capability";
import type {
  LedgeriaCustomer,
  LedgeriaEdition,
  LedgeriaLicenseRecord,
} from "@/lib/ledgeria-licensing";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label, FieldHint } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initial: IssueLicenseResult | null = null;
const STEPS = ["Müşteri", "Özellikler", "Özet ve imza"] as const;

export function IssueLicenseForm({
  customers,
  editions,
  defaultCustomerDocumentId,
  defaultEditionKey,
  sourceLicense,
  highlightValidity = false,
  canSign = true,
}: {
  customers: LedgeriaCustomer[];
  editions: LedgeriaEdition[];
  defaultCustomerDocumentId?: string;
  defaultEditionKey?: string;
  sourceLicense?: LedgeriaLicenseRecord | null;
  highlightValidity?: boolean;
  canSign?: boolean;
}) {
  const parsedSource = sourceLicense
    ? tryParseSignedLicenseJson(sourceLicense.signedLicenseJson)
    : null;
  const sourceClaims = parsedSource?.claims;

  const activeCustomers = customers.filter((c) => c.status === "active");
  const [step, setStep] = useState(highlightValidity ? 2 : 0);
  const [customerId, setCustomerId] = useState(
    defaultCustomerDocumentId ??
      sourceLicense?.customerDocumentId ??
      activeCustomers[0]?.documentId ??
      ""
  );
  const initialEdition =
    (defaultEditionKey &&
      editions.find((e) => e.editionKey === defaultEditionKey)?.editionKey) ||
    sourceClaims?.edition ||
    editions[0]?.editionKey ||
    "";
  const [editionKey, setEditionKey] = useState(
    editions.some((e) => e.editionKey === initialEdition) ? initialEdition : ""
  );
  const [capabilities, setCapabilities] = useState<string[]>(() => {
    if (sourceClaims?.capabilities?.length) {
      return normalizeCapabilities(sourceClaims.capabilities);
    }
    const ed = editions.find((e) => e.editionKey === initialEdition);
    return normalizeCapabilities(ed?.capabilities ?? []);
  });
  const [logoUrl, setLogoUrl] = useState(sourceClaims?.branding?.logoUrl ?? "");
  const [validity, setValidity] = useState({
    unlimitedExpiry: !sourceClaims?.expiresAt,
    expiresDate: "",
    unlimitedDevices:
      sourceClaims?.maxDevices == null || sourceClaims.maxDevices <= 0,
    maxDevices: sourceClaims?.maxDevices && sourceClaims.maxDevices > 0
      ? sourceClaims.maxDevices
      : 1,
  });
  const skipEditionSync = useRef(Boolean(sourceClaims?.capabilities?.length));

  const customer = useMemo(
    () => activeCustomers.find((c) => c.documentId === customerId),
    [activeCustomers, customerId]
  );
  const edition = editions.find((e) => e.editionKey === editionKey);
  const defaultChannel = customer ? `customers/${customer.customerKey}` : "";

  useEffect(() => {
    if (skipEditionSync.current) {
      skipEditionSync.current = false;
      return;
    }
    const ed = editions.find((e) => e.editionKey === editionKey);
    setCapabilities(normalizeCapabilities(ed?.capabilities ?? []));
  }, [editionKey, editions]);

  const [state, action, pending] = useActionState(
    async (_prev: IssueLicenseResult | null, formData: FormData) =>
      issueLicenseFromForm(formData),
    initial
  );

  const downloadedId = useRef<string | null>(null);
  useEffect(() => {
    if (state?.ok && downloadedId.current !== state.licenseId) {
      downloadedId.current = state.licenseId;
      triggerLicenseFileDownload(
        state.signedLicenseJson,
        state.filenameBase,
        "ledgeria-license"
      );
    }
  }, [state]);

  function onLogoFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setLogoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  const locked = !canSign || activeCustomers.length === 0;
  const expiryLabel = validity.unlimitedExpiry
    ? "Süresiz"
    : validity.expiresDate || "Tarih seçilmedi";
  const deviceLabel = validity.unlimitedDevices
    ? "Sınırsız cihaz"
    : `En fazla ${validity.maxDevices}`;

  return (
    <div className="mt-6 max-w-2xl space-y-5">
      {state?.ok ? (
        <Alert tone="success">
          <p className="font-medium">Lisans imzalandı</p>
          <p className="mt-1 font-mono text-xs">{state.licenseId}</p>
          <p className="mt-2 text-xs">
            <code className="font-mono">.ledgeria-license</code> indirildi.
            Ledgeria: Ayarlar → Tercihler → Lisans.
          </p>
          {(() => {
            const issued = tryParseSignedLicenseJson(state.signedLicenseJson);
            const until = issued?.claims.expiresAt
              ? new Date(issued.claims.expiresAt).toLocaleDateString("tr-TR")
              : "Süresiz";
            const devices =
              issued?.claims.maxDevices != null
                ? `en fazla ${issued.claims.maxDevices}`
                : "sınırsız";
            return (
              <p className="mt-1 text-xs">
                Geçerlilik: {until} · Cihaz: {devices}
              </p>
            );
          })()}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() =>
                triggerLicenseFileDownload(
                  state.signedLicenseJson,
                  state.filenameBase,
                  "ledgeria-license"
                )
              }
            >
              .ledgeria-license indir
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                triggerLicenseFileDownload(
                  state.signedLicenseJson,
                  state.filenameBase,
                  "json"
                )
              }
            >
              .json indir
            </Button>
            {state.documentId ? (
              <ButtonLink
                href={`/ledgeria/licenses/${state.documentId}`}
                variant="ghost"
                size="sm"
              >
                Kayıt detayı
              </ButtonLink>
            ) : (
              <ButtonLink href="/ledgeria/licenses" variant="ghost" size="sm">
                Geçmişe git
              </ButtonLink>
            )}
          </div>
        </Alert>
      ) : null}

      {!canSign ? (
        <Alert tone="warn">
          İmzalama kilitli: önce{" "}
          <Link href="/ledgeria/settings/license-keys" className="font-medium underline">
            lisans anahtarı
          </Link>{" "}
          üretin veya gömülü <code className="font-mono text-xs">dev</code> anahtarı
          etkinleştirin.
        </Alert>
      ) : null}
      {activeCustomers.length === 0 ? (
        <Alert tone="warn">
          Aktif müşteri yok.{" "}
          <Link href="/ledgeria/customers/new" className="font-medium underline">
            İlk müşteriyi oluşturun
          </Link>{" "}
          (ör. <code className="font-mono text-xs">demo-musteri</code>).
        </Alert>
      ) : null}

      <ol className="grid grid-cols-3 gap-2">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setStep(i)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg border px-2 py-2 text-left text-xs font-medium",
                i === step
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-foreground/10 text-foreground"
                )}
              >
                {i + 1}
              </span>
              {label}
            </button>
          </li>
        ))}
      </ol>

      <form action={action} className="space-y-5">
        <fieldset disabled={locked} className="space-y-5 disabled:opacity-70">
          <input type="hidden" name="useCustomCapabilities" value="on" />
          <input type="hidden" name="customerDocumentId" value={customerId} />
          <input type="hidden" name="editionKey" value={editionKey} />
          {capabilities.map((id) => (
            <input key={id} type="hidden" name={`cap_${id}`} value="on" />
          ))}

          <div className={cn("space-y-4", step !== 0 && "hidden")}>
              <div>
                <Label htmlFor="customer">Müşteri</Label>
                <NativeSelect
                  id="customer"
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="mt-1"
                >
                  <option value="" disabled>
                    Seçin…
                  </option>
                  {activeCustomers.map((c) => (
                    <option key={c.documentId} value={c.documentId}>
                      {c.displayName}
                    </option>
                  ))}
                </NativeSelect>
                {customer ? (
                  <FieldHint>
                    Anahtar: <code className="font-mono">{customer.customerKey}</code>
                  </FieldHint>
                ) : null}
              </div>
              <div>
                <Label htmlFor="edition">Yetki paketi (ön doldurma)</Label>
                <NativeSelect
                  id="edition"
                  value={editionKey}
                  onChange={(e) => setEditionKey(e.target.value)}
                  className="mt-1"
                >
                  <option value="">Özel (boş)</option>
                  {editions.map((e) => (
                    <option key={e.documentId} value={e.editionKey}>
                      {e.displayName}
                    </option>
                  ))}
                </NativeSelect>
                {edition ? (
                  <FieldHint>
                    {edition.capabilities.length} özellik bu pakette
                    {edition.description ? ` · ${edition.description}` : ""}
                  </FieldHint>
                ) : null}
              </div>
            </div>

          <div className={cn(step !== 1 && "hidden")}>
              <p className="text-sm font-medium">Özellikler</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Modül tek başına alt özelliği açmaz. Örn. pledges açık,
                pledges.installments kapalı olabilir.
              </p>
              <div className="mt-3">
                <CapabilityTree
                  value={capabilities}
                  onChange={setCapabilities}
                  editionCapabilities={edition?.capabilities}
                  formFieldPrefix=""
                />
              </div>
            </div>

          <div className={cn("space-y-4", step !== 2 && "hidden")}>
              <LicenseValidityFields
                defaultExpiresAt={sourceClaims?.expiresAt}
                defaultMaxDevices={sourceClaims?.maxDevices}
                highlight={highlightValidity}
                onMetaChange={setValidity}
              />

              <Card>
                <CardContent className="space-y-2 pt-5">
                  <CardTitle>Özet</CardTitle>
                  <CardDescription>
                    {customer?.displayName ?? "Müşteri yok"} ·{" "}
                    {edition?.displayName ?? "Özel paket"} · {capabilities.length}{" "}
                    özellik · {expiryLabel} · {deviceLabel}
                  </CardDescription>
                  <p className="text-xs text-foreground/80">
                    Kaydet imzalı kaydı arşive yazar. İmzala ve indir aynı kaydı
                    oluşturup dosyayı indirir.
                  </p>
                </CardContent>
              </Card>

              <div>
                <Label htmlFor="clientId">clientId (opsiyonel)</Label>
                <Input
                  id="clientId"
                  name="clientId"
                  placeholder="deployment_id"
                  defaultValue={sourceClaims?.clientId ?? ""}
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="updateChannel">Güncelleme kanalı</Label>
                <Input
                  id="updateChannel"
                  name="updateChannel"
                  defaultValue={sourceClaims?.updateChannel || defaultChannel}
                  key={`${sourceClaims?.updateChannel ?? ""}:${defaultChannel}`}
                  className="mt-1 font-mono"
                />
                <FieldHint>
                  Varsayılan: customers/{"{müşteri anahtarı}"}
                </FieldHint>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="appName">Uygulama adı</Label>
                  <Input
                    id="appName"
                    name="appName"
                    defaultValue={sourceClaims?.branding?.appName ?? ""}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="primaryColor">Ana renk</Label>
                  <Input
                    id="primaryColor"
                    name="primaryColor"
                    placeholder="#0f766e"
                    defaultValue={sourceClaims?.branding?.primaryColor ?? ""}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="brandPackVersion">Marka paketi sürümü</Label>
                <Input
                  id="brandPackVersion"
                  name="brandPackVersion"
                  placeholder="1"
                  defaultValue={sourceClaims?.branding?.brandPackVersion ?? ""}
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="logoUrl">Logo (https veya data URL)</Label>
                <Input
                  id="logoUrl"
                  name="logoUrl"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="logoFile">Logo yükle</Label>
                <Input
                  id="logoFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => onLogoFile(e.target.files?.[0] ?? null)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  defaultValue={sourceClaims?.notes ?? ""}
                  className="mt-1"
                />
              </div>
            </div>
        </fieldset>

        {state && !state.ok ? (
          <Alert tone="danger">{state.error}</Alert>
        ) : null}

        <div className="h-20" />
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {capabilities.length} özellik
              </span>
              {" · "}
              {expiryLabel}
              {" · "}
              {deviceLabel}
            </div>
            <div className="flex shrink-0 gap-2">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                >
                  Geri
                </Button>
              ) : null}
              {step < 2 ? (
                <Button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={step === 0 && !customerId}
                >
                  İleri
                </Button>
              ) : (
                <>
                  <Button
                    type="submit"
                    name="intent"
                    value="save"
                    variant="outline"
                    disabled={pending || locked}
                  >
                    {pending ? "Kaydediliyor…" : "Kaydet"}
                  </Button>
                  <Button
                    type="submit"
                    name="intent"
                    value="download"
                    disabled={pending || locked}
                  >
                    {pending ? "İmzalanıyor…" : "İmzala ve indir"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
