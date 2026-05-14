/** Short display for ISO timestamps on issue cards (en-GB). */
export function formatIssueDateTime(iso?: string | null): string {
  if (iso == null || typeof iso !== "string") return "—";
  const t = Date.parse(iso.trim());
  if (Number.isNaN(t)) return iso.trim();
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(t));
}
