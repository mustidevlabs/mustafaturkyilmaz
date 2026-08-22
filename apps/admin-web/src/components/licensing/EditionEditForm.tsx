"use client";

import { useState, useActionState } from "react";
import {
  updateEditionCapabilitiesFromForm,
  type ActionResult,
} from "@/actions/ledgeria-licensing";
import { CapabilityTree } from "@/components/licensing/CapabilityTree";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { normalizeCapabilities } from "@/lib/license/capability";
import type { LedgeriaEdition } from "@/lib/ledgeria-licensing";

const initial: ActionResult | null = null;

export function EditionEditForm({ edition }: { edition: LedgeriaEdition }) {
  const [capabilities, setCapabilities] = useState(() =>
    normalizeCapabilities(edition.capabilities)
  );

  const [state, action, pending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) =>
      updateEditionCapabilitiesFromForm(formData),
    initial
  );

  return (
    <form action={action} className="max-w-2xl space-y-4">
      <input type="hidden" name="documentId" value={edition.documentId} />
      <div>
        <Label htmlFor="displayName">Görünen ad</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={edition.displayName}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={edition.description ?? ""}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="defaultUpdateChannel">Varsayılan güncelleme kanalı</Label>
        <Input
          id="defaultUpdateChannel"
          name="defaultUpdateChannel"
          defaultValue={edition.defaultUpdateChannel ?? ""}
          className="mt-1 font-mono"
        />
      </div>
      <fieldset>
        <legend className="text-sm font-medium">
          Özellikler ({capabilities.length} seçili)
        </legend>
        <div className="mt-2">
          <CapabilityTree
            value={capabilities}
            onChange={setCapabilities}
            editionCapabilities={edition.capabilities}
          />
        </div>
      </fieldset>
      {state && !state.ok ? <Alert tone="danger">{state.error}</Alert> : null}
      {state?.ok ? <Alert tone="success">Kaydedildi.</Alert> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </Button>
    </form>
  );
}
