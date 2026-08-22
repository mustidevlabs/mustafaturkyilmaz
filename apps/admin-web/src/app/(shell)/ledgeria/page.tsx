import { redirect } from "next/navigation";

export default function LedgeriaIndexPage() {
  redirect("/ledgeria/settings/license-keys");
}
