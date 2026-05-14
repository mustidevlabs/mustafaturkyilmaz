"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { IssueCard } from "@/components/IssueCard";
import {
  STATUS_OPTIONS,
  issueDocumentId,
  issueEffectiveStatus,
  isLedgeriaIssueStatus,
  type LedgeriaIssueStatus,
  type LedgeriaIssueStatusSaveHandler,
  type StrapiIssue,
} from "@/lib/ledgeria-issues-shared";

const DRAG_MIME = "application/x-ledgeria-board-drag";

const COLUMN_TITLE: Record<LedgeriaIssueStatus, string> = {
  open: "Open",
  triaged: "Triaged",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

function insertIndexFromPointer(columnEl: Element, clientY: number): number {
  const rows = columnEl.querySelectorAll("[data-board-issue-id]");
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i].getBoundingClientRect();
    if (clientY < r.top + r.height / 2) return i;
  }
  return rows.length;
}

function applyBoardDrop(
  all: StrapiIssue[],
  documentId: string,
  toStatus: LedgeriaIssueStatus,
  insertIndex: number
): StrapiIssue[] {
  const moved = all.find((i) => issueDocumentId(i) === documentId);
  if (!moved) return all;

  const withoutMoved = all.filter((i) => issueDocumentId(i) !== documentId);
  const targetCol = withoutMoved.filter(
    (i) => issueEffectiveStatus(i) === toStatus
  );
  const insertAt = Math.max(0, Math.min(insertIndex, targetCol.length));
  const updated: StrapiIssue = { ...moved, status: toStatus };
  const newTargetCol = [
    ...targetCol.slice(0, insertAt),
    updated,
    ...targetCol.slice(insertAt),
  ];
  const rest = withoutMoved.filter((i) => issueEffectiveStatus(i) !== toStatus);
  return [...rest, ...newTargetCol];
}

function issuesSignature(list: StrapiIssue[]): string {
  return list
    .map((i) => `${issueDocumentId(i) ?? ""}:${i.status ?? ""}:${i.createdAt ?? ""}`)
    .join("|");
}

export type IssuesBoardProps = {
  issues: StrapiIssue[];
  submitMode: "server" | "client";
  onSave?: LedgeriaIssueStatusSaveHandler;
  onDelete?: (documentId: string) => void | Promise<void>;
  busyDocumentId?: string | null;
};

export function IssuesBoard({
  issues,
  submitMode,
  onSave,
  onDelete,
  busyDocumentId,
}: IssuesBoardProps) {
  const [localIssues, setLocalIssues] = useState<StrapiIssue[]>(issues);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropGlow, setDropGlow] = useState<LedgeriaIssueStatus | null>(null);
  const [insertHint, setInsertHint] = useState<{
    column: LedgeriaIssueStatus;
    index: number;
  } | null>(null);

  const localIssuesRef = useRef(localIssues);
  localIssuesRef.current = localIssues;

  const upstreamKey = useMemo(() => issuesSignature(issues), [issues]);
  useEffect(() => {
    setLocalIssues(issues);
  }, [upstreamKey, issues]);

  useEffect(() => {
    const clear = () => {
      setDropGlow(null);
      setInsertHint(null);
    };
    window.addEventListener("dragend", clear);
    return () => window.removeEventListener("dragend", clear);
  }, []);

  const byStatus = useMemo(() => {
    const m = new Map<LedgeriaIssueStatus, StrapiIssue[]>();
    for (const o of STATUS_OPTIONS) m.set(o.value, []);
    for (const issue of localIssues) {
      const st = issueEffectiveStatus(issue);
      m.get(st)!.push(issue);
    }
    return m;
  }, [localIssues]);

  const handleDragOverColumn = useCallback(
    (col: LedgeriaIssueStatus, e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDropGlow(col);
      setInsertHint({
        column: col,
        index: insertIndexFromPointer(e.currentTarget, e.clientY),
      });
    },
    []
  );

  const handleDropOnColumn = useCallback(
    async (col: LedgeriaIssueStatus, e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDropGlow(null);
      setInsertHint(null);

      const raw = e.dataTransfer.getData(DRAG_MIME);
      if (!raw) return;

      let parsed: { documentId?: string; status?: unknown };
      try {
        parsed = JSON.parse(raw) as { documentId?: string; status?: unknown };
      } catch {
        return;
      }
      if (
        typeof parsed.documentId !== "string" ||
        !isLedgeriaIssueStatus(String(parsed.status))
      ) {
        return;
      }
      const documentId = parsed.documentId;
      const fromStatus = parsed.status as LedgeriaIssueStatus;
      const targetStatus = col;

      const insertIndex = insertIndexFromPointer(e.currentTarget, e.clientY);
      const prev = localIssuesRef.current;
      const next = applyBoardDrop(
        prev,
        documentId,
        targetStatus,
        insertIndex
      );
      setLocalIssues(next);

      const statusChanged = fromStatus !== targetStatus;
      if (!statusChanged) return;

      if (!onSave) {
        setLocalIssues(prev);
        return;
      }

      try {
        const out = await onSave(documentId, targetStatus);
        if (out === false) setLocalIssues(prev);
      } catch {
        setLocalIssues(prev);
      }
    },
    [onSave]
  );

  return (
    <div className="mt-10 flex gap-3 overflow-x-auto pb-2">
      <p className="sr-only">
        Drag cards between columns to change status. Reordering within a column
        updates this view only until reload; Strapi has no rank field yet.
      </p>
      {STATUS_OPTIONS.map((col) => {
        const columnIssues = byStatus.get(col.value) ?? [];
        const isGlow = dropGlow === col.value && draggingId !== null;
        return (
          <section
            key={col.value}
            className="flex h-[min(70vh,52rem)] min-h-[18rem] w-[min(100%,20rem)] min-w-[17rem] shrink-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <header className="sticky top-0 z-10 shrink-0 border-b border-zinc-200 bg-zinc-50/95 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/95">
              <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {COLUMN_TITLE[col.value]}
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {columnIssues.length}{" "}
                {columnIssues.length === 1 ? "issue" : "issues"}
              </p>
            </header>
            <div
              className={`flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-2 transition-[box-shadow,background-color] ${
                isGlow
                  ? "bg-amber-50/60 ring-2 ring-inset ring-amber-400/70 dark:bg-amber-950/25 dark:ring-amber-500/45"
                  : ""
              }`}
              onDragOver={(e) => handleDragOverColumn(col.value, e)}
              onDrop={(e) => void handleDropOnColumn(col.value, e)}
            >
              {columnIssues.length === 0 ? (
                <div
                  className={`flex min-h-[12rem] flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed px-2 text-center text-xs font-medium transition-colors ${
                    isGlow
                      ? "border-amber-500 bg-amber-50/70 text-amber-950 dark:border-amber-400 dark:bg-amber-950/50 dark:text-amber-100"
                      : "border-zinc-300 text-zinc-500 dark:border-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  Drag an issue here
                </div>
              ) : null}
              {columnIssues.map((issue, idx) => {
                const id = issueDocumentId(issue);
                if (!id) return null;
                const showLineBefore =
                  insertHint?.column === col.value &&
                  insertHint.index === idx &&
                  draggingId !== null &&
                  draggingId !== id;
                return (
                  <div key={id} className="flex flex-col gap-0">
                    {showLineBefore ? (
                      <div
                        className="-mx-1 mb-1 h-0.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400"
                        aria-hidden
                      />
                    ) : null}
                    <div
                      data-board-issue-id={id}
                      draggable
                      onDragStart={(ev) => {
                        ev.dataTransfer.setData(
                          DRAG_MIME,
                          JSON.stringify({
                            documentId: id,
                            status: issueEffectiveStatus(issue),
                          })
                        );
                        ev.dataTransfer.setData("text/plain", id);
                        ev.dataTransfer.effectAllowed = "move";
                        setDraggingId(id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDropGlow(null);
                        setInsertHint(null);
                      }}
                      className={`shrink-0 rounded-lg ${
                        draggingId === id
                          ? "cursor-grabbing ring-2 ring-amber-500 ring-offset-2 ring-offset-white dark:ring-amber-400 dark:ring-offset-zinc-950"
                          : "cursor-grab"
                      }`}
                    >
                      <IssueCard
                        issue={issue}
                        variant="board"
                        submitMode={submitMode}
                        onSave={onSave}
                        onDelete={onDelete}
                        busy={busyDocumentId === id}
                      />
                    </div>
                  </div>
                );
              })}
              {insertHint?.column === col.value &&
              insertHint.index === columnIssues.length &&
              draggingId !== null ? (
                <div
                  className="-mx-1 h-0.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400"
                  aria-hidden
                />
              ) : null}
              {columnIssues.length > 0 ? (
                <div className="min-h-8 shrink-0 flex-grow basis-0" aria-hidden />
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
