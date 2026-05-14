"use client";

import { useMemo, useState } from "react";
import { updateLedgeriaIssueStatusAction } from "@/app/ledgeria-issues-actions";
import { IssueList } from "@/components/IssueList";
import { IssuesBoard } from "@/components/IssuesBoard";
import type {
  LedgeriaIssueStatusSaveHandler,
  StrapiIssue,
} from "@/lib/ledgeria-issues-shared";

export type LedgeriaIssuesViewProps = {
  issues: StrapiIssue[];
  submitMode: "server" | "client";
  onSave?: LedgeriaIssueStatusSaveHandler;
  onDelete?: (documentId: string) => void | Promise<void>;
  busyDocumentId?: string | null;
};

export function LedgeriaIssuesView({
  issues,
  submitMode,
  onSave,
  onDelete,
  busyDocumentId,
}: LedgeriaIssuesViewProps) {
  const [mode, setMode] = useState<"list" | "board">("list");

  const boardOnSave = useMemo(() => {
    if (submitMode === "server") {
      return async (documentId: string, status: string) =>
        (await updateLedgeriaIssueStatusAction(documentId, status)).ok;
    }
    if (!onSave) return undefined;
    return async (documentId: string, status: string) => {
      const r = await onSave(documentId, status);
      return typeof r === "boolean" ? r : true;
    };
  }, [submitMode, onSave]);

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          View
        </span>
        <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setMode("list")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === "list"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setMode("board")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === "board"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            Board
          </button>
        </div>
      </div>

      {mode === "list" ? (
        <IssueList
          issues={issues}
          submitMode={submitMode}
          onSave={onSave}
          onDelete={onDelete}
          busyDocumentId={busyDocumentId}
        />
      ) : (
        <IssuesBoard
          issues={issues}
          submitMode={submitMode}
          onSave={boardOnSave ?? onSave}
          onDelete={onDelete}
          busyDocumentId={busyDocumentId}
        />
      )}
    </div>
  );
}
