"use client";

import { useState } from "react";
import {
  clearCustomerDownloadPassword,
  issueCustomerDownloadPassword,
  resetCustomerLicenseSeats,
} from "@/actions/ledgeria-licensing";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InfoTip } from "@/components/ui/info-tip";

export function CustomerDownloadPassword({
  documentId,
  hasDownloadPassword,
  downloadPasswordSetAt,
  occupiedDeviceCount,
  initialPassword,
  downloadUrl,
}: {
  documentId: string;
  hasDownloadPassword: boolean;
  downloadPasswordSetAt: string | null;
  occupiedDeviceCount: number;
  initialPassword: string | null;
  downloadUrl: string;
}) {
  const [password, setPassword] = useState(initialPassword);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rotateOpen, setRotateOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const setAt = downloadPasswordSetAt
    ? new Date(downloadPasswordSetAt).toLocaleString("tr-TR")
    : null;

  async function issue() {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("documentId", documentId);
    const result = await issueCustomerDownloadPassword(fd);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPassword(result.password);
  }

  return (
    <Card className="mt-6 max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Lisans şifresi
          <InfoTip>
            Masaüstü Ayarlar → Tercihler → Lisans’ta bu şifreyi girer. Aynı şifre
            süre uzatınca da güncel dosyayı indirir.
          </InfoTip>
        </CardTitle>
        <CardDescription>
          URL:{" "}
          <code className="break-all font-mono text-[11px] text-foreground">
            {downloadUrl}
          </code>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {password ? (
          <Alert tone="success">
            <p className="text-xs text-muted-foreground">
              Bir kez gösterilir. Müşteriye iletin; sonra kaybolur.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="rounded-md bg-background px-2 py-1 font-mono text-sm font-semibold">
                {password}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(password);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                {copied ? "Kopyalandı" : "Kopyala"}
              </Button>
            </div>
          </Alert>
        ) : hasDownloadPassword ? (
          <p className="text-sm text-muted-foreground">
            Şifre tanımlı{setAt ? ` · ${setAt}` : ""}. Düz metin saklanmaz.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Henüz şifre yok. Üretince müşteri URL üzerinden lisans alabilir.
          </p>
        )}

        {occupiedDeviceCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            Kayıtlı cihaz: {occupiedDeviceCount}
          </p>
        ) : null}

        {error ? <Alert tone="danger">{error}</Alert> : null}

        <div className="flex flex-wrap gap-2">
          {!hasDownloadPassword && !password ? (
            <Button type="button" onClick={() => void issue()} disabled={pending}>
              {pending ? "Üretiliyor…" : "Şifre üret"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setRotateOpen(true)}
              disabled={pending}
            >
              Yeni şifre
            </Button>
          )}
          {hasDownloadPassword ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setClearOpen(true)}
              disabled={pending}
            >
              Şifreyi kaldır
            </Button>
          ) : null}
          {occupiedDeviceCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setResetOpen(true)}
              disabled={pending}
            >
              Cihazları sıfırla
            </Button>
          ) : null}
        </div>
      </CardContent>

      <ConfirmDialog
        open={rotateOpen}
        title="Yeni lisans şifresi?"
        description="Eski şifre hemen geçersiz olur. Yeni şifre bir kez gösterilir."
        confirmLabel="Üret"
        pending={pending}
        onClose={() => setRotateOpen(false)}
        onConfirm={async () => {
          setRotateOpen(false);
          await issue();
        }}
      />
      <ConfirmDialog
        open={clearOpen}
        title="Şifre kaldırılsın mı?"
        description="URL ile indirme durur. Dosya ile içe aktarma çalışmaya devam eder."
        confirmLabel="Kaldır"
        destructive
        pending={pending}
        onClose={() => setClearOpen(false)}
        onConfirm={async () => {
          setPending(true);
          const fd = new FormData();
          fd.set("documentId", documentId);
          const result = await clearCustomerDownloadPassword(fd);
          setPending(false);
          setClearOpen(false);
          if (!result.ok) setError(result.error);
          else setPassword(null);
        }}
      />
      <ConfirmDialog
        open={resetOpen}
        title="Cihaz koltukları sıfırlansın mı?"
        description="Kayıtlı clientId listesi silinir. Kota yeniden boşalır."
        confirmLabel="Sıfırla"
        destructive
        pending={pending}
        onClose={() => setResetOpen(false)}
        onConfirm={async () => {
          setPending(true);
          const fd = new FormData();
          fd.set("documentId", documentId);
          const result = await resetCustomerLicenseSeats(fd);
          setPending(false);
          setResetOpen(false);
          if (!result.ok) setError(result.error);
        }}
      />
    </Card>
  );
}
