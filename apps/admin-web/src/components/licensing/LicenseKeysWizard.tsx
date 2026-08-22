"use client";

import { useActionState, useRef, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import {
  clearStoredSigningKeyAction,
  dismissPrivateKeyRevealAction,
  enableEmbeddedDevKeyAction,
  generateLicenseKeyPairAction,
  type GenerateKeyActionResult,
  type KeyActionResult,
} from "@/actions/ledgeria-license-keys";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InfoTip } from "@/components/ui/info-tip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type KeyMeta = {
  keyId: string;
  publicKeySpkiBase64: string;
  source: "env" | "store" | "dev";
  revealedOnce: boolean;
  createdAt: string;
  envOverrides: boolean;
};

const SOURCE_LABEL: Record<KeyMeta["source"], string> = {
  env: "env",
  store: "sunucu",
  dev: "demo",
};

function publicPasteBlock(meta: KeyMeta): string {
  return [
    `{`,
    `  keyId: "${meta.keyId}",`,
    meta.source === "dev" ? `  developmentOnly: true,` : null,
    `  publicKeySpkiBase64:`,
    `    "${meta.publicKeySpkiBase64}",`,
    `},`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function LicenseKeysWizard({
  initialMeta,
}: {
  initialMeta: KeyMeta | null;
}) {
  const [reveal, setReveal] = useState<GenerateKeyActionResult | null>(null);
  const [savedChecked, setSavedChecked] = useState(false);
  const [rotateOpen, setRotateOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const rotateAllowed = useRef(false);

  const [genState, genAction, genPending] = useActionState(
    async (_prev: GenerateKeyActionResult | null, formData: FormData) => {
      const result = await generateLicenseKeyPairAction(formData);
      if (result.ok) {
        setReveal(result);
        setSavedChecked(false);
        setRotateOpen(false);
      }
      return result;
    },
    null as GenerateKeyActionResult | null
  );

  const [devState, devAction, devPending] = useActionState(
    async (_prev: KeyActionResult | null) => enableEmbeddedDevKeyAction(),
    null as KeyActionResult | null
  );

  const [clearState, clearAction, clearPending] = useActionState(
    async (_prev: KeyActionResult | null, formData: FormData) =>
      clearStoredSigningKeyAction(formData),
    null as KeyActionResult | null
  );

  const meta = initialMeta;
  const showReveal =
    reveal &&
    reveal.ok &&
    (!meta?.revealedOnce || reveal.privateKeyPkcs8Base64);

  if (showReveal && reveal.ok) {
    return (
      <div className="mt-6 max-w-xl space-y-4 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-semibold">Private key</h2>
          <InfoTip>
            Yalnızca bu ekranda. Onaydan sonra tekrar gösterilmez — yedekleyin.
          </InfoTip>
        </div>
        <CopyRow
          label="Private PKCS8"
          value={reveal.privateKeyPkcs8Base64}
          preview
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadText("ledgeria-license.env", reveal.envSnippet)}
          >
            <Download className="size-3.5" />
            .env
          </Button>
        </div>
        <CopyRow label="Public SPKI" value={reveal.publicKeySpkiBase64} />
        <CopyRow
          label="licenseKeys.ts"
          value={reveal.ledgeriaPasteBlock}
          preview
        />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={savedChecked}
            onCheckedChange={(v) => setSavedChecked(v === true)}
          />
          Yedekledim
        </label>
        <Button
          disabled={!savedChecked}
          onClick={async () => {
            await dismissPrivateKeyRevealAction();
            setReveal(null);
            window.location.reload();
          }}
        >
          Tamam, gizle
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6 max-w-xl space-y-6">
      {meta ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
          <code className="font-mono text-sm font-medium">{meta.keyId}</code>
          <Badge tone={meta.source === "dev" ? "warn" : "success"}>
            {SOURCE_LABEL[meta.source]}
          </Badge>
          {meta.envOverrides ? (
            <Badge tone="warn">env kilitli</Badge>
          ) : null}
          <InfoTip>
            {meta.source === "dev"
              ? "Gömülü demo anahtarı. Gerçek müşteri dosyasında kullanmayın."
              : meta.envOverrides
                ? "LEDGERIA_LICENSE_PRIVATE_KEY_PKCS8_B64 tanımlı. Yeni çift için satırı silip admin’i yeniden başlatın."
                : "Bu mühür lisans dosyalarını imzalar. Public’i Ledgeria licenseKeys.ts içine yapıştırın."}
          </InfoTip>
          <div className="ml-auto">
            <CopyButton value={publicPasteBlock(meta)} label="Public kopyala" />
          </div>
        </div>
      ) : null}

      <form
        id="generate-license-key"
        action={genAction}
        className="space-y-3"
        onSubmit={(e) => {
          if (meta && !meta.envOverrides && !rotateAllowed.current) {
            e.preventDefault();
            setRotateOpen(true);
          }
        }}
      >
        {meta ? <input type="hidden" name="forceRotate" value="on" /> : null}
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1">
              <Label htmlFor="keyId">keyId</Label>
              <InfoTip>
                Mühürün adı (ör. prod-2026). Masaüstü bu kimlikle public key’i
                seçer.
              </InfoTip>
            </div>
            <Input
              id="keyId"
              name="keyId"
              required
              placeholder="prod-2026"
              className="font-mono"
              autoComplete="off"
              disabled={Boolean(meta?.envOverrides)}
            />
          </div>
          <Button
            type="submit"
            disabled={genPending || Boolean(meta?.envOverrides)}
          >
            {genPending ? "Üretiliyor…" : meta ? "Yenile" : "Üret"}
          </Button>
        </div>
        {genState && !genState.ok ? (
          <Alert tone="danger">{genState.error}</Alert>
        ) : null}
      </form>

      <ConfirmDialog
        open={rotateOpen}
        title="Anahtarı değiştir?"
        description="Yeni çift mevcut mühürün yerini alır. Private key bir kez gösterilir."
        confirmLabel="Üret"
        pending={genPending}
        onClose={() => setRotateOpen(false)}
        onConfirm={() => {
          rotateAllowed.current = true;
          const form = document.getElementById(
            "generate-license-key"
          ) as HTMLFormElement | null;
          const confirm = document.createElement("input");
          confirm.type = "hidden";
          confirm.name = "confirmRotate";
          confirm.value = "on";
          form?.appendChild(confirm);
          form?.requestSubmit();
        }}
      />

      {!meta ? (
        <div className="flex items-center gap-2">
          <form action={devAction}>
            <Button type="submit" variant="ghost" size="sm" disabled={devPending}>
              {devPending ? "Kaydediliyor…" : "Local dev anahtarı"}
            </Button>
          </form>
          <InfoTip>
            Ledgeria’daki keyId=dev ile eşleşir. Yalnızca bu makine; müşteri
            dosyasında kullanmayın.
          </InfoTip>
        </div>
      ) : null}
      {devState && !devState.ok ? (
        <Alert tone="danger">{devState.error}</Alert>
      ) : null}
      {devState?.ok ? <Alert tone="success">Dev key kuruldu.</Alert> : null}

      {meta && !meta.envOverrides ? (
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setClearOpen(true)}
          >
            Anahtarı sil
          </Button>
          {clearState && !clearState.ok ? (
            <Alert tone="danger" className="mt-2">
              {clearState.error}
            </Alert>
          ) : null}
          <ConfirmDialog
            open={clearOpen}
            title="Kayıtlı anahtar silinsin mi?"
            description="İmzalama durur. Env ile kurulu mühür bu işlemden etkilenmez."
            confirmLabel="Sil"
            destructive
            pending={clearPending}
            onClose={() => setClearOpen(false)}
            onConfirm={() => {
              const fd = new FormData();
              fd.set("confirmClear", "on");
              clearAction(fd);
              setClearOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function CopyRow({
  label,
  value,
  preview = false,
}: {
  label: string;
  value: string;
  preview?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <CopyButton value={value} />
      </div>
      {preview ? (
        <pre className="mt-1 max-h-24 overflow-auto rounded-lg bg-foreground p-2.5 font-mono text-[11px] text-background">
          {value}
        </pre>
      ) : (
        <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
          {value}
        </p>
      )}
    </div>
  );
}

function CopyButton({
  value,
  label = "Kopyala",
}: {
  value: string;
  label?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setDone(true);
        window.setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {done ? "Kopyalandı" : label}
    </Button>
  );
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
