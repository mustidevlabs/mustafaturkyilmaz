import type { Metadata } from "next";
import { getStrapiPublicUrl } from "@/lib/strapi-public-url";
import { strapiAuthHeaders } from "@/lib/strapi-admin-headers";
import { strapiHttpsRequest } from "@/lib/strapi-node-https";
import { pickIssues } from "@/lib/ledgeria-issues-shared";
import { LedgeriaIssuesBrowserFallback } from "./ledgeria-issues-browser";
import { getStrapiBrowserTlsToken } from "@/lib/strapi-dev-browser-token";
import { LedgeriaIssuesView } from "@/components/LedgeriaIssuesView";

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

export default async function LedgeriaIssuesPage() {
  const result = await fetchIssues();
  const browserTls = getStrapiBrowserTlsToken();

  if (!result.ok) {
    if (result.reason === "no_token") {
      return (
        <div className="max-w-lg py-8">
          <h1 className="text-xl font-semibold">Ledgeria issues</h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Set <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">STRAPI_API_TOKEN</code>{" "}
            in <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">apps/admin-web/.env.local</code>
            . Token needs <strong>find</strong>, <strong>update</strong>, and <strong>delete</strong> on{" "}
            <em>Ledgeria Issue</em> (full
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
      <div className="max-w-lg py-8">
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
    <div className="py-4">
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
        <LedgeriaIssuesView issues={issues} submitMode="server" />
      )}
    </div>
  );
}
