"use client";

import { useEffect, useRef, useState } from "react";
import {
  deleteLedgeriaIssueFromForm,
  updateLedgeriaIssueFromForm,
} from "@/app/ledgeria-issues-actions";
import { IssueLogsPanel } from "@/components/IssueLogsPanel";
import { IssueScreenshotZoom } from "@/components/IssueScreenshotZoom";
import {
  STATUS_OPTIONS,
  issueDocumentId,
  screenshotSrc,
  type LedgeriaIssueStatusSaveHandler,
  type StrapiIssue,
} from "@/lib/ledgeria-issues-shared";
import { formatIssueDateTime } from "@/lib/format-issue-datetime";

export type IssueCardProps = {
  issue: StrapiIssue;
  /** Admin list row vs compact Kanban card */
  variant?: "full" | "board";
  /** `server`: Strapi update via server action + revalidate. `client`: browser fetch (TLS fallback). */
  submitMode: "server" | "client";
  onSave?: LedgeriaIssueStatusSaveHandler;
  /** TLS fallback: Strapi DELETE from the browser. Server mode uses the delete server action. */
  onDelete?: (documentId: string) => void | Promise<void>;
  busy?: boolean;
};

function StatusControl({
  documentId,
  status,
  submitMode,
  busy,
  onSave,
  compact,
}: {
  documentId: string;
  status: string;
  submitMode: "server" | "client";
  busy?: boolean;
  onSave?: LedgeriaIssueStatusSaveHandler;
  compact?: boolean;
}) {
  const [local, setLocal] = useState(status);

  useEffect(() => {
    setLocal(status);
  }, [status]);

  const selectClass = compact
    ? "w-full min-w-0 rounded-md border border-zinc-300 bg-white px-1.5 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-900"
    : "w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900 sm:w-auto lg:w-full";

  const btnClass = compact
    ? "rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    : "rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 lg:w-full";

  if (submitMode === "server") {
    return (
      <form
        key={status}
        action={updateLedgeriaIssueFromForm}
        className={
          compact
            ? "flex w-full flex-col gap-1.5"
            : "flex w-full flex-wrap items-center gap-2 lg:flex-col lg:items-stretch"
        }
      >
        <input type="hidden" name="documentId" value={documentId} />
        <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
          Status
        </label>
        <select
          name="status"
          defaultValue={status}
          draggable={false}
          className={selectClass}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button type="submit" className={btnClass}>
          Save
        </button>
      </form>
    );
  }

  return (
    <div
      className={
        compact
          ? "flex w-full flex-col gap-1.5"
          : "flex w-full flex-wrap items-center gap-2 lg:flex-col lg:items-stretch"
      }
    >
      <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
        Status
      </label>
      <select
        value={local}
        draggable={false}
        onChange={(e) => setLocal(e.target.value)}
        className={selectClass}
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
        onClick={() => void onSave?.(documentId, local)}
        className={`${btnClass} disabled:opacity-50`}
      >
        {busy ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

const DELETE_CONFIRM_MSG =
  "Permanently delete this issue from Strapi? This cannot be undone.";

/** Corner (board) or toolbar (list): overflow `···` menu; currently delete only. */
function IssueOverflowMenu({
  documentId,
  submitMode,
  busy,
  onDelete,
  placement,
}: {
  documentId: string;
  submitMode: "server" | "client";
  busy?: boolean;
  onDelete?: (documentId: string) => void | Promise<void>;
  placement: "corner" | "toolbar";
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  if (submitMode === "client" && !onDelete) return null;

  const closeMenu = () => {
    detailsRef.current?.removeAttribute("open");
  };

  const panelClass =
    "absolute right-0 top-full z-30 mt-1 min-w-[9rem] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950";

  const summaryBtn =
    "flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 [&::-webkit-details-marker]:hidden";

  const deleteRowClass =
    "block w-full px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/50";

  return (
    <details
      ref={detailsRef}
      className={
        placement === "corner"
          ? "absolute right-1 top-1 z-20"
          : "relative shrink-0 justify-self-end"
      }
    >
      <summary className={summaryBtn} title="Actions">
        <span className="select-none text-lg font-bold leading-none tracking-[0.15em]" aria-hidden>
          ···
        </span>
        <span className="sr-only">Actions menu</span>
      </summary>
      <div className={panelClass}>
        {submitMode === "server" ? (
          <form
            action={deleteLedgeriaIssueFromForm}
            onSubmit={(e) => {
              if (!confirm(DELETE_CONFIRM_MSG)) e.preventDefault();
              else closeMenu();
            }}
          >
            <input type="hidden" name="documentId" value={documentId} />
            <button type="submit" className={deleteRowClass}>
              Delete permanently
            </button>
          </form>
        ) : (
          <button
            type="button"
            disabled={busy}
            className={deleteRowClass}
            onClick={() => {
              if (!confirm(DELETE_CONFIRM_MSG)) return;
              closeMenu();
              void onDelete?.(documentId);
            }}
          >
            {busy ? "Deleting…" : "Delete permanently"}
          </button>
        )}
      </div>
    </details>
  );
}

export function IssueCard({
  issue,
  variant = "full",
  submitMode,
  onSave,
  onDelete,
  busy,
}: IssueCardProps) {
  const id = issueDocumentId(issue);
  const status = issue.status ?? "open";
  if (!id) return null;

  const img = screenshotSrc(issue.screenshotPngBase64);

  if (variant === "board") {
    return (
      <article className="relative overflow-visible rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <IssueOverflowMenu
          documentId={id}
          submitMode={submitMode}
          busy={busy}
          onDelete={onDelete}
          placement="corner"
        />
        <div className="grid grid-cols-2 gap-2 p-2 pr-10 pt-1">
          <div className="min-w-0">
            {img ? (
              <IssueScreenshotZoom
                src={img}
                alt=""
                className="max-h-16 w-full rounded-md border border-zinc-200 object-contain dark:border-zinc-700"
                pins={issue.screenshotPins}
              />
            ) : (
              <div className="flex h-16 items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-[10px] text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
                —
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="line-clamp-2 text-sm font-medium leading-snug">
              {issue.title ?? "(no title)"}
            </h2>
            <div className="flex flex-wrap gap-1">
              {issue.category ? (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  {issue.category}
                </span>
              ) : null}
              {issue.priority ? (
                <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {issue.priority}
                </span>
              ) : null}
            </div>
            <p className="truncate font-mono text-[10px] text-zinc-500">
              {issue.clientId ? String(issue.clientId).slice(0, 12) + "…" : "—"}
            </p>
          </div>
          <div className="col-span-2 flex min-w-0 items-center justify-between gap-2 border-t border-zinc-100 pt-1.5 dark:border-zinc-800">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Created
            </span>
            {issue.createdAt ? (
              <time
                dateTime={issue.createdAt}
                className="truncate text-right font-mono text-[10px] tabular-nums text-zinc-600 dark:text-zinc-300"
              >
                {formatIssueDateTime(issue.createdAt)}
              </time>
            ) : (
              <span className="truncate text-right font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                —
              </span>
            )}
          </div>
          <div className="col-span-2 min-w-0 pt-2">
            <StatusControl
              documentId={id}
              status={status}
              submitMode={submitMode}
              busy={busy}
              onSave={onSave}
              compact
            />
          </div>
          <details className="col-span-2 text-[11px]">
            <summary className="cursor-pointer font-medium text-zinc-600 dark:text-zinc-400">
              Description & logs
            </summary>
            <div className="mt-1 max-h-32 overflow-y-auto rounded-md bg-zinc-50 p-2 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              <p className="whitespace-pre-wrap">{issue.description ?? "—"}</p>
              {issue.logs ? <IssueLogsPanel logs={issue.logs} /> : null}
            </div>
          </details>
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-visible rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-6 lg:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0 max-w-full">
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
        <div className="min-w-0 flex flex-col gap-3 lg:col-span-1 lg:row-span-1">
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
            <p className="break-all font-mono text-xs text-zinc-500">
              id {issue.clientId ? String(issue.clientId) : "—"} · doc{" "}
              {id.slice(0, 8)}…
            </p>
            <p className="text-xs text-zinc-500">
              App {issue.appVersion ?? "—"}
              {issue.lastScreen ? (
                <>
                  {" "}
                  · screen{" "}
                  <span className="break-all font-mono">{issue.lastScreen}</span>
                </>
              ) : null}
            </p>
            <dl className="grid gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 sm:grid-cols-2 sm:gap-x-4">
              <div className="min-w-0">
                <dt className="font-medium text-zinc-500 dark:text-zinc-500">
                  Client sent at
                </dt>
                <dd className="break-words font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                  {formatIssueDateTime(issue.clientCreatedAt ?? undefined)}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="font-medium text-zinc-500 dark:text-zinc-500">
                  Recorded (Strapi)
                </dt>
                <dd className="break-words font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                  {formatIssueDateTime(issue.createdAt ?? undefined)}
                </dd>
              </div>
            </dl>

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
        <div className="flex min-w-0 flex-col gap-3 border-zinc-200 sm:col-span-2 sm:flex-row sm:flex-wrap sm:items-center sm:border-t sm:pt-3 lg:col-span-1 lg:row-span-1 lg:flex-col lg:items-stretch lg:border-l lg:border-t-0 lg:pt-0 lg:pl-6 dark:border-zinc-700">
          <div className="flex w-full justify-end lg:justify-end">
            <IssueOverflowMenu
              documentId={id}
              submitMode={submitMode}
              busy={busy}
              onDelete={onDelete}
              placement="toolbar"
            />
          </div>
          <StatusControl
            documentId={id}
            status={status}
            submitMode={submitMode}
            busy={busy}
            onSave={onSave}
          />
        </div>
      </div>
    </article>
  );
}
