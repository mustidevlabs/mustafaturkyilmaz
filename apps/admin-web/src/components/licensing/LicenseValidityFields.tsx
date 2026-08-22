"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  defaultExpiresAt?: string | null;
  defaultMaxDevices?: number | null;
  highlight?: boolean;
  onMetaChange?: (meta: {
    unlimitedExpiry: boolean;
    expiresDate: string;
    unlimitedDevices: boolean;
    maxDevices: number;
  }) => void;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDaysFromToday(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function LicenseValidityFields({
  defaultExpiresAt,
  defaultMaxDevices,
  highlight = false,
  onMetaChange,
}: Props) {
  const [unlimitedExpiry, setUnlimitedExpiry] = useState(!defaultExpiresAt);
  const [expiresDate, setExpiresDate] = useState(
    () => toDateInput(defaultExpiresAt) || addDaysFromToday(365)
  );
  const [unlimitedDevices, setUnlimitedDevices] = useState(
    defaultMaxDevices == null || defaultMaxDevices <= 0
  );
  const [maxDevices, setMaxDevices] = useState(
    defaultMaxDevices && defaultMaxDevices > 0 ? defaultMaxDevices : 1
  );
  const boxRef = useRef<HTMLFieldSetElement>(null);
  const onMetaChangeRef = useRef(onMetaChange);
  onMetaChangeRef.current = onMetaChange;

  useEffect(() => {
    onMetaChangeRef.current?.({
      unlimitedExpiry,
      expiresDate,
      unlimitedDevices,
      maxDevices,
    });
  }, [unlimitedExpiry, expiresDate, unlimitedDevices, maxDevices]);

  useEffect(() => {
    if (highlight) {
      boxRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [highlight]);

  return (
    <fieldset
      id="license-validity"
      ref={boxRef}
      className={cn(
        "space-y-4 rounded-xl border p-4",
        highlight
          ? "border-primary bg-primary/5"
          : "border-border bg-card"
      )}
    >
      <legend className="px-1 text-sm font-semibold">Geçerlilik ve cihazlar</legend>
      <p className="text-xs text-muted-foreground">
        Süre dolunca masaüstünde özellikler kilitlenir (gösterge paneli ve ayarlar
        açık kalır). Cihaz kotası internetten indirmede uygulanır; USB dosyası
        başka bilgisayarda da açılabilir.
      </p>

      <div className="space-y-2">
        <p className="text-sm font-medium">Geçerlilik süresi</p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary"
            checked={unlimitedExpiry}
            onChange={(e) => setUnlimitedExpiry(e.target.checked)}
          />
          Süresiz
        </label>
        {unlimitedExpiry ? (
          <input type="hidden" name="expiresAt" value="" />
        ) : (
          <>
            <label className="block text-sm">
              <span className="text-xs text-muted-foreground">Bitiş tarihi</span>
              <Input
                type="date"
                name="expiresAt"
                required
                value={expiresDate}
                onChange={(e) => setExpiresDate(e.target.value)}
                className="mt-1"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { days: 30, label: "30 gün" },
                { days: 90, label: "90 gün" },
                { days: 365, label: "1 yıl" },
              ].map((p) => (
                <Button
                  key={p.days}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setExpiresDate(addDaysFromToday(p.days))}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Cihaz sayısı</p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary"
            checked={unlimitedDevices}
            onChange={(e) => setUnlimitedDevices(e.target.checked)}
          />
          Sınırsız
        </label>
        {unlimitedDevices ? (
          <input type="hidden" name="maxDevices" value="" />
        ) : (
          <label className="block text-sm">
            <span className="text-xs text-muted-foreground">En fazla cihaz</span>
            <Input
              type="number"
              name="maxDevices"
              required
              min={1}
              step={1}
              value={maxDevices}
              onChange={(e) => setMaxDevices(Number(e.target.value) || 1)}
              className="mt-1"
            />
          </label>
        )}
      </div>
    </fieldset>
  );
}
