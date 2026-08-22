import type { Metadata } from "next";
import { CreateCustomerForm } from "@/components/licensing/CustomerForms";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Yeni müşteri — Admin",
};

export default function NewCustomerPage() {
  return (
    <div className="py-2">
      <ButtonLink href="/ledgeria/customers" variant="ghost" size="sm">
        ← Müşteriler
      </ButtonLink>
      <PageHeader
        className="mt-3"
        title="Yeni müşteri"
        description={
          <>
            Örnek anahtar:{" "}
            <code className="font-mono text-xs">demo-musteri</code>
          </>
        }
      />
      <CreateCustomerForm />
    </div>
  );
}
