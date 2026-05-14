import { digestLedgeriaLog } from "@/lib/ledgeria-log-digest";

export function IssueLogsPanel({ logs }: { logs: string | null | undefined }) {
  if (logs == null || !String(logs).trim()) {
    return <p className="text-sm text-zinc-500">No log lines.</p>;
  }

  const digest = digestLedgeriaLog(logs);
  if (!digest) {
    return <p className="text-sm text-zinc-500">No log lines.</p>;
  }

  const { summary, highlights, notable, rawLineCount, noiseDropped } = digest;

  return (
    <div className="space-y-3 text-sm">
      <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-relaxed text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
        {summary}
      </p>

      <p className="text-xs text-zinc-500">
        {rawLineCount} line{rawLineCount === 1 ? "" : "s"} in payload
        {noiseDropped > 0
          ? ` · ${noiseDropped} dev-noise line${noiseDropped === 1 ? "" : "s"} hidden (Vite, DevTools/locize promos, renderer info/verbose, Electron CSP block, Radix Dialog warnings, etc.)`
          : null}
      </p>

      {highlights.length > 0 ? (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Ledgeria pipeline (raw lines)
          </p>
          <ul className="list-inside list-disc space-y-1 font-mono text-xs text-zinc-800 dark:text-zinc-200">
            {highlights.map((line, i) => (
              <li key={i} className="break-all">
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          No main-process Ledgeria lines (`issues-sink` / `issues-http` / `DB path`). Open raw log below.
        </p>
      )}

      {notable.length > 0 ? (
        <details className="rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/80">
          <summary className="cursor-pointer px-2 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Other context ({notable.length}) — renderer / leftovers
          </summary>
          <pre className="max-h-36 overflow-auto whitespace-pre-wrap border-t border-zinc-200 p-2 text-xs leading-snug text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
            {notable.join("\n")}
          </pre>
        </details>
      ) : null}

      <details className="rounded-md border border-zinc-200 dark:border-zinc-700">
        <summary className="cursor-pointer px-2 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Full raw log
        </summary>
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap border-t border-zinc-200 p-2 text-xs dark:border-zinc-700">
          {logs}
        </pre>
      </details>
    </div>
  );
}
