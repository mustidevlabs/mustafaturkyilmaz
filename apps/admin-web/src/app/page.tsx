import type { Metadata } from "next";
import { getStrapiPublicUrl } from "@/lib/strapi-public-url";
import { strapiAuthHeaders } from "@/lib/strapi-admin-headers";
import { strapiHttpsRequest } from "@/lib/strapi-node-https";
import {
  pickIssues,
  screenshotSrc,
  STATUS_OPTIONS,
} from "@/lib/ledgeria-issues-shared";
import { updateLedgeriaIssueFromForm } from "./ledgeria-issues-actions";
import { IssueLogsPanel } from "@/components/issue-logs-panel";
import { IssueScreenshotZoom } from "@/components/issue-screenshot-zoom";
import { LedgeriaIssuesBrowserFallback } from "./ledgeria-issues-browser";
import { getStrapiBrowserTlsToken } from "@/lib/strapi-dev-browser-token";

export const metadata: Metadata = {
  title: "Ledgeria issues — Admin",
};

const STRAPI_URL = getStrapiPublicUrl();

function formatFetchError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const parts = [err.message];
  let c: unknown = err.cause;
  let depth = 0;
  while (c instanceof Error && depth < 5) {
    parts.push(`Cause: ${c.message}`);
    c = c.cause;
    depth += 1;
  }
  return parts.join("\n");
}

function isTlsHandshakeFailure(detail?: string): boolean {
  if (!detail) return false;
  return /EPROTO|handshake failure|alert number 40|ssl\/tls alert|ssl3_read_bytes/i.test(
    detail
  );
}

async function fetchIssues(): Promise<
  | { ok: true; issues: ReturnType<typeof pickIssues> }
  | { ok: false; reason: "no_token" | "strapi_error"; detail?: string }
> {
  const token = process.env.STRAPI_API_TOKEN?.trim();
  if (!token) return { ok: false, reason: "no_token" };

  const qs = new URLSearchParams({
    "sort[0]": "createdAt:desc",
    "pagination[pageSize]": "100",
  });

  const url = `${STRAPI_URL}/api/ledgeria-issues?${qs.toString()}`;

  let res: { statusCode: number; body: string };
  try {
    res = await strapiHttpsRequest({
      url,
      method: "GET",
      headers: strapiAuthHeaders(token),
    });
  } catch (err) {
    return {
      ok: false,
      reason: "strapi_error",
      detail: [
        `Network error calling ${url}`,
        formatFetchError(err),
        "",
        "Hints: Node 20 or 22 LTS; confirm Strapi URL; try another network or pause VPN.",
        "Corporate network: set HTTPS_PROXY (and NO_PROXY for local hosts). Node ignores proxy unless configured here.",
        "TLS inspection: point NODE_EXTRA_CA_CERTS at your org root CA if the proxy re-signs TLS.",
        "Dev: NODE_OPTIONS=--dns-result-order=ipv4first is set in npm scripts.",
        "Strapi calls use node:https (direct IPv4 + TLS 1.2–1.3, or HTTPS_PROXY when set).",
        "",
        "If Strapi works in the browser but Node shows TLS errors: set STRAPI_DEV_MIRROR_API_TOKEN_TO_BROWSER=1 in .env.local (development only, reuses STRAPI_API_TOKEN) or set NEXT_PUBLIC_STRAPI_DEV_BROWSER_TOKEN — see .env.example.",
      ].join("\n"),
    };
  }

  if (res.statusCode < 200 || res.statusCode >= 300) {
    return { ok: false, reason: "strapi_error", detail: res.body };
  }

  let json: unknown;
  try {
    json = JSON.parse(res.body);
  } catch {
    return {
      ok: false,
      reason: "strapi_error",
      detail: `Invalid JSON from Strapi (first 400 chars): ${res.body.slice(0, 400)}`,
    };
  }

  return { ok: true, issues: pickIssues(json) };
}

export default async function AdminHomePage() {
  const result = await fetchIssues();
  const browserTls = getStrapiBrowserTlsToken();

  if (!result.ok) {
    if (result.reason === "no_token") {
      return (
        <div className="mx-auto max-w-lg px-4 py-16">
          <h1 className="text-xl font-semibold">Ledgeria issues</h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Set <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">STRAPI_API_TOKEN</code>{" "}
            in <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">apps/admin-web/.env.local</code>
            . Token needs <strong>find</strong> and <strong>update</strong> on <em>Ledgeria Issue</em> (full
            access is simplest).
          </p>
        </div>
      );
    }

    if (
      result.reason === "strapi_error" &&
      isTlsHandshakeFailure(result.detail) &&
      browserTls
    ) {
      return (
        <LedgeriaIssuesBrowserFallback
          strapiBase={STRAPI_URL}
          token={browserTls.token}
          tokenSource={browserTls.source}
        />
      );
    }

    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-xl font-semibold text-red-700 dark:text-red-400">
          Could not load issues
        </h1>
        <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
          {result.detail ?? "Unknown error"}
        </pre>
        {isTlsHandshakeFailure(result.detail) && !browserTls ? (
          <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
            <strong>TLS from Node failed before HTTP.</strong> Your{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">STRAPI_API_TOKEN</code> is
            not the problem. For local dev, add either{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
              STRAPI_DEV_MIRROR_API_TOKEN_TO_BROWSER=1
            </code>{" "}
            (reuses your server token in the browser — development only) or{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
              NEXT_PUBLIC_STRAPI_DEV_BROWSER_TOKEN
            </code>{" "}
            with the same token value. Restart <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">next dev</code>. See{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">.env.example</code>.
          </p>
        ) : null}
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Check <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">NEXT_PUBLIC_STRAPI_URL</code>{" "}
          ({STRAPI_URL}).
        </p>
      </div>
    );
  }

  const { issues } = result;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Ledgeria issues</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {issues.length} issue{issues.length === 1 ? "" : "s"} · Strapi{" "}
          <span className="font-mono text-xs">{STRAPI_URL}</span>
        </p>
      </div>

      {issues.length === 0 ? (
        <p className="mt-12 text-center text-sm text-zinc-500">No issues yet.</p>
      ) : (
        <div className="mt-10 space-y-6">
          {issues.map((issue) => {
            const id =
              issue.documentId ?? (issue.id != null ? String(issue.id) : "");
            if (!id) return null;
            const img = screenshotSrc(issue.screenshotPngBase64);
            const status = issue.status ?? "open";

            return (
              <article
                key={id}
                className="overflow-visible rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:gap-6">
                  <div className="shrink-0 sm:w-40">
                    {img ? (
                      <IssueScreenshotZoom
                        src={img}
                        alt="Issue screenshot"
                        pins={issue.screenshotPins}
                      />
                    ) : (
                      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
                        No screenshot
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-medium">
                        {issue.title ?? "(no title)"}
                      </h2>
                      {issue.category ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                          {issue.category}
                        </span>
                      ) : null}
                      {issue.priority ? (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {issue.priority}
                        </span>
                      ) : null}
                    </div>
                    <p className="font-mono text-xs text-zinc-500">
                      id {issue.clientId ? String(issue.clientId) : "—"} · doc {id.slice(0, 8)}…
                    </p>
                    <p className="text-xs text-zinc-500">
                      App {issue.appVersion ?? "—"} · reported{" "}
                      {issue.clientCreatedAt ?? issue.createdAt ?? "—"}
                      {issue.lastScreen ? (
                        <>
                          {" "}
                          · screen <span className="font-mono">{issue.lastScreen}</span>
                        </>
                      ) : null}
                    </p>

                    <form
                      action={updateLedgeriaIssueFromForm}
                      className="flex flex-wrap items-center gap-2 pt-2"
                    >
                      <input type="hidden" name="documentId" value={id} />
                      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Status
                      </label>
                      <select
                        name="status"
                        defaultValue={status}
                        className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        Save
                      </button>
                    </form>

                    <details className="pt-2 text-sm">
                      <summary className="cursor-pointer font-medium text-zinc-700 dark:text-zinc-300">
                        Description & logs
                      </summary>
                      <div className="mt-2 space-y-3 rounded-lg bg-zinc-50 p-3 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                        <p className="whitespace-pre-wrap text-sm">
                          {issue.description ?? "—"}
                        </p>
                        {issue.logs ? <IssueLogsPanel logs={issue.logs} /> : null}
                      </div>
                    </details>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
