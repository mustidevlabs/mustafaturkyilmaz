"use client";

import { useCallback, useEffect, useState } from "react";
import type { StrapiBrowserTlsTokenSource } from "@/lib/strapi-dev-browser-token";
import { pickIssues, issueDocumentId, type StrapiIssue } from "@/lib/ledgeria-issues-shared";
import { LedgeriaIssuesView } from "@/components/LedgeriaIssuesView";

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

  const saveStatus = async (
    documentId: string,
    status: string
  ): Promise<boolean> => {
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
        return false;
      }
      setIssues((prev) =>
        prev?.map((row) =>
          (row.documentId ?? String(row.id ?? "")) === documentId
            ? { ...row, status }
            : row
        ) ?? null
      );
      return true;
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const deleteIssue = async (documentId: string) => {
    setBusyId(documentId);
    setErr(null);
    try {
      const res = await fetch(
        `${strapiBase.replace(/\/$/, "")}/api/ledgeria-issues/${encodeURIComponent(documentId)}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const text = await res.text();
      if (!res.ok) {
        setErr(`Delete failed HTTP ${res.status} — ${text.slice(0, 400)}`);
        return;
      }
      setIssues((prev) =>
        prev?.filter((row) => issueDocumentId(row) !== documentId) ?? null
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
        <LedgeriaIssuesView
          issues={issues}
          submitMode="client"
          onSave={saveStatus}
          onDelete={deleteIssue}
          busyDocumentId={busyId}
        />
      ) : null}
    </div>
  );
}
