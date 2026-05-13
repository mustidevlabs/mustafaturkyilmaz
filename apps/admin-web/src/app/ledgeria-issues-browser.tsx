"use client";

import { useCallback, useEffect, useState } from "react";
import { IssueLogsPanel } from "@/components/issue-logs-panel";
import { IssueScreenshotZoom } from "@/components/issue-screenshot-zoom";
import type { StrapiBrowserTlsTokenSource } from "@/lib/strapi-dev-browser-token";
import {
  pickIssues,
  screenshotSrc,
  STATUS_OPTIONS,
  type StrapiIssue,
} from "@/lib/ledgeria-issues-shared";

function BrowserIssueCard({
  issue,
  busy,
  onSave,
}: {
  issue: StrapiIssue;
  busy: boolean;
  onSave: (documentId: string, status: string) => void;
}) {
  const id =
    issue.documentId ?? (issue.id != null ? String(issue.id) : "");
  const [status, setStatus] = useState(issue.status ?? "open");

  useEffect(() => {
    setStatus(issue.status ?? "open");
  }, [issue.status]);

  if (!id) return null;

  const img = screenshotSrc(issue.screenshotPngBase64);

  return (
    <article className="overflow-visible rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
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
            id {issue.clientId ? String(issue.clientId) : "—"} · doc{" "}
            {id.slice(0, 8)}…
          </p>
          <p className="text-xs text-zinc-500">
            App {issue.appVersion ?? "—"} · reported{" "}
            {issue.clientCreatedAt ?? issue.createdAt ?? "—"}
            {issue.lastScreen ? (
              <>
                {" "}
                · screen{" "}
                <span className="font-mono">{issue.lastScreen}</span>
              </>
            ) : null}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={busy}
              onClick={() => onSave(id, status)}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>

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
}

function issuesListUrl(base: string): string {
  const qs = new URLSearchParams({
    "sort[0]": "createdAt:desc",
    "pagination[pageSize]": "100",
  });
  return `${base.replace(/\/$/, "")}/api/ledgeria-issues?${qs.toString()}`;
}

export function LedgeriaIssuesBrowserFallback({
  strapiBase,
  token,
  tokenSource,
}: {
  strapiBase: string;
  token: string;
  tokenSource: StrapiBrowserTlsTokenSource;
}) {
  const [issues, setIssues] = useState<StrapiIssue[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const url = issuesListUrl(strapiBase);
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const text = await res.text();
      if (!res.ok) {
        setErr(`HTTP ${res.status} — ${text.slice(0, 600)}`);
        setIssues(null);
        return;
      }
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        setErr("Invalid JSON from Strapi.");
        setIssues(null);
        return;
      }
      setIssues(pickIssues(json));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setIssues(null);
    }
  }, [strapiBase, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveStatus = async (documentId: string, status: string) => {
    setBusyId(documentId);
    setErr(null);
    try {
      const body = JSON.stringify({ data: { status } });
      const res = await fetch(
        `${strapiBase.replace(/\/$/, "")}/api/ledgeria-issues/${encodeURIComponent(documentId)}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body,
        }
      );
      const text = await res.text();
      if (!res.ok) {
        setErr(`Save failed HTTP ${res.status} — ${text.slice(0, 400)}`);
        return;
      }
      setIssues((prev) =>
        prev?.map((row) =>
          (row.documentId ?? String(row.id ?? "")) === documentId
            ? { ...row, status }
            : row
        ) ?? null
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        <strong>Dev browser mode:</strong> Strapi is loaded from your browser (TLS
        stack), not Node.{" "}
        {tokenSource === "next_public" ? (
          <>
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
              NEXT_PUBLIC_STRAPI_DEV_BROWSER_TOKEN
            </code>{" "}
            is exposed in the client bundle — localhost only.
          </>
        ) : (
          <>
            Token comes from{" "}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
              STRAPI_API_TOKEN
            </code>{" "}
            via{" "}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
              STRAPI_DEV_MIRROR_API_TOKEN_TO_BROWSER=1
            </code>{" "}
            (development only). Do not deploy with mirroring enabled.
          </>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Ledgeria issues</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {issues?.length ?? "…"} issues · Strapi{" "}
          <span className="font-mono text-xs">{strapiBase}</span>
        </p>
      </div>

      {err ? (
        <pre className="mt-6 max-h-48 overflow-auto rounded-lg bg-red-50 p-3 text-xs text-red-900 dark:bg-red-950/50 dark:text-red-100">
          {err}
        </pre>
      ) : null}

      {issues === null && !err ? (
        <p className="mt-12 text-center text-sm text-zinc-500">Loading…</p>
      ) : null}

      {issues && issues.length === 0 ? (
        <p className="mt-12 text-center text-sm text-zinc-500">No issues yet.</p>
      ) : null}

      {issues && issues.length > 0 ? (
        <div className="mt-10 space-y-6">
          {issues.map((issue) => {
            const id =
              issue.documentId ?? (issue.id != null ? String(issue.id) : "");
            if (!id) return null;
            return (
              <BrowserIssueCard
                key={id}
                issue={issue}
                busy={busyId === id}
                onSave={saveStatus}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
