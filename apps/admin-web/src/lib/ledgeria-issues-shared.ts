import {
  extractScreenshotPinsFromStrapiEntry,
  normalizeIssueScreenshotPins,
  type IssueScreenshotPin,
} from "@/lib/ledgeria-issue-pins";

export type StrapiIssue = {
  documentId?: string;
  id?: number;
  clientId?: string;
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  status?: string;
  appVersion?: string;
  clientCreatedAt?: string;
  lastScreen?: string | null;
  logs?: string | null;
  screenshotPngBase64?: string | null;
  screenshotPins?: IssueScreenshotPin[];
  createdAt?: string;
};

export const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "triaged", label: "Triaged" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] as const;

export type LedgeriaIssueStatus = (typeof STATUS_OPTIONS)[number]["value"];

/** Status PUT from client UI (forms, board drag). `false` means rollback for optimistic board moves. */
export type LedgeriaIssueStatusSaveHandler = (
  documentId: string,
  status: string
) => void | boolean | Promise<void | boolean>;

export function isLedgeriaIssueStatus(v: string): v is LedgeriaIssueStatus {
  return STATUS_OPTIONS.some((o) => o.value === v);
}

/** Strapi document id for REST / forms (required for updates). */
export function issueDocumentId(issue: StrapiIssue): string | null {
  const id = issue.documentId ?? (issue.id != null ? String(issue.id) : "");
  return id.trim() !== "" ? id : null;
}

/** Normalized status for grouping (unknown → open). */
export function issueEffectiveStatus(issue: StrapiIssue): LedgeriaIssueStatus {
  const s = issue.status ?? "open";
  return isLedgeriaIssueStatus(s) ? s : "open";
}

export function pickIssues(payload: unknown): StrapiIssue[] {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];
  return data
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const o = raw as Record<string, unknown>;
      if (o.attributes && typeof o.attributes === "object") {
        const attrs = o.attributes as Record<string, unknown>;
        const rawPins = extractScreenshotPinsFromStrapiEntry(o);
        return {
          ...attrs,
          screenshotPins: normalizeIssueScreenshotPins(rawPins),
          documentId: o.documentId as string | undefined,
          id: o.id as number | undefined,
        } as StrapiIssue;
      }
      const flat = raw as Record<string, unknown>;
      const rawPins = extractScreenshotPinsFromStrapiEntry(flat);
      return {
        ...flat,
        screenshotPins: normalizeIssueScreenshotPins(rawPins),
      } as StrapiIssue;
    })
    .filter((x): x is StrapiIssue => x != null);
}

export function screenshotSrc(b64?: string | null): string | null {
  if (!b64 || typeof b64 !== "string" || b64.length < 32) return null;
  const clean = b64.trim();
  if (clean.startsWith("data:")) return clean;
  return `data:image/png;base64,${clean}`;
}
