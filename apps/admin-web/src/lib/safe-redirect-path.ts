/** Only same-origin relative paths; prevents open redirects. */
export function safeRedirectPath(raw: string | null | undefined): string {
  if (raw == null) return "/";
  const t = String(raw).trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/";
  if (t.includes("://")) return "/";
  return t;
}
