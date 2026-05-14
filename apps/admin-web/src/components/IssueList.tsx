import { IssueCard } from "@/components/IssueCard";
import {
  issueDocumentId,
  type LedgeriaIssueStatusSaveHandler,
  type StrapiIssue,
} from "@/lib/ledgeria-issues-shared";

export type IssueListProps = {
  issues: StrapiIssue[];
  submitMode: "server" | "client";
  onSave?: LedgeriaIssueStatusSaveHandler;
  onDelete?: (documentId: string) => void | Promise<void>;
  busyDocumentId?: string | null;
};

export function IssueList({
  issues,
  submitMode,
  onSave,
  onDelete,
  busyDocumentId,
}: IssueListProps) {
  return (
    <div className="mt-10 space-y-6">
      {issues.map((issue) => {
        const id = issueDocumentId(issue);
        if (!id) return null;
        return (
          <IssueCard
            key={id}
            issue={issue}
            variant="full"
            submitMode={submitMode}
            onSave={onSave}
            onDelete={onDelete}
            busy={busyDocumentId === id}
          />
        );
      })}
    </div>
  );
}
