"use client";

import { useActionState, useState } from "react";
import {
  createCustomerFromForm,
  deleteCustomerFromForm,
  updateCustomerFromForm,
  type ActionResult,
} from "@/actions/ledgeria-licensing";
import type { CustomerStatus, LedgeriaCustomer } from "@/lib/ledgeria-licensing";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label, FieldHint } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initial: ActionResult | null = null;

export function CreateCustomerForm() {
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) =>
      createCustomerFromForm(formData),
    initial
  );

  return (
    <form action={action} className="mt-6 max-w-lg space-y-4">
      <Field
        label="Müşteri adı"
        name="displayName"
        required
      />
      <Field
        label="Müşteri anahtarı"
        name="customerKey"
        placeholder="demo-musteri"
        required
        hint="Küçük harf ve tire. Lisans dosyasına yazılır. Kayıttan sonra lisans şifresi bir kez gösterilir."
        mono
      />
      <div>
        <Label htmlFor="notes">Notlar</Label>
        <Textarea id="notes" name="notes" rows={3} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="status">Durum</Label>
        <NativeSelect id="status" name="status" defaultValue="active" className="mt-1">
          <option value="active">Aktif</option>
          <option value="suspended">Askıda</option>
        </NativeSelect>
      </div>
      {state && !state.ok ? <Alert tone="danger">{state.error}</Alert> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Kaydediliyor…" : "Oluştur"}
      </Button>
    </form>
  );
}

export function EditCustomerForm({ customer }: { customer: LedgeriaCustomer }) {
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) =>
      updateCustomerFromForm(formData),
    initial
  );

  return (
    <form action={action} className="mt-6 max-w-lg space-y-4">
      <input type="hidden" name="documentId" value={customer.documentId} />
      <Field
        label="Müşteri adı"
        name="displayName"
        defaultValue={customer.displayName}
        required
      />
      <Field
        label="Müşteri anahtarı"
        name="customerKey"
        defaultValue={customer.customerKey}
        required
        mono
        hint="Değiştirmek yalnızca yeni lisansları etkiler. Mühürlü masaüstü kurulumunda yeni dosya customer_mismatch verebilir."
      />
      <div>
        <Label htmlFor="notes">Notlar</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={customer.notes ?? ""}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="status">Durum</Label>
        <NativeSelect
          id="status"
          name="status"
          defaultValue={customer.status as CustomerStatus}
          className="mt-1"
        >
          <option value="active">Aktif</option>
          <option value="suspended">Askıda</option>
        </NativeSelect>
      </div>
      {state && !state.ok ? <Alert tone="danger">{state.error}</Alert> : null}
      {state?.ok ? <Alert tone="success">Kaydedildi.</Alert> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </Button>
    </form>
  );
}

export function DeleteCustomerForm({
  documentId,
  customerKey,
}: {
  documentId: string;
  customerKey: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) =>
      deleteCustomerFromForm(formData),
    initial
  );

  return (
    <div className="mt-8 max-w-lg space-y-3 border-t border-border pt-6">
      <form id="delete-customer" action={action}>
        <input type="hidden" name="documentId" value={documentId} />
      </form>
      {state && !state.ok ? <Alert tone="danger">{state.error}</Alert> : null}
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Müşteriyi sil
      </Button>
      <ConfirmDialog
        open={open}
        title="Müşteri silinsin mi?"
        description={`${customerKey} kaydı ve ilişkili lisans geçmişi Strapi’den silinir. İmzalı dosyalar müşteride durmaya devam eder.`}
        confirmLabel="Sil"
        destructive
        pending={pending}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          const form = document.getElementById(
            "delete-customer"
          ) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
    </div>
  );
}

function Field(props: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  defaultValue?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={props.name}>{props.label}</Label>
      <Input
        id={props.name}
        name={props.name}
        required={props.required}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        className={props.mono ? "mt-1 font-mono" : "mt-1"}
      />
      {props.hint ? <FieldHint>{props.hint}</FieldHint> : null}
    </div>
  );
}
