"use client";

import { useMemo, useState } from "react";
import { updateLedgeriaIssueStatusAction } from "@/actions/ledgeria-issues";
import { IssueList } from "@/components/IssueList";
import { IssuesBoard } from "@/components/IssuesBoard";
import type {
  LedgeriaIssueStatusSaveHandler,
  StrapiIssue,
} from "@/lib/ledgeria-issues-shared";
import { cn } from "@/lib/utils";

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
        <span className="text-xs font-medium text-muted-foreground">
          Görünüm
        </span>
        <div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setMode("list")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "list"
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Liste
          </button>
          <button
            type="button"
            onClick={() => setMode("board")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "board"
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Pano
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
