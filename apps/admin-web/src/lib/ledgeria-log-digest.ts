/**
 * Turn noisy Electron/renderer console dumps into a short summary + signal lines + rest.
 */

/** Multi-line Electron CSP warning: replace headline + continuation with one line; count dropped. */
function foldElectronCspBlock(lines: string[]): { lines: string[]; dropped: number } {
  const out: string[] = [];
  let skipping = false;
  let dropped = 0;

  for (const line of lines) {
    if (
      /Electron Security Warning/i.test(line) &&
      /Content Security|Content-Security|unsafe-eval/i.test(line)
    ) {
      skipping = true;
      out.push(
        "[Electron] Renderer CSP warning (multi-line detail omitted — see raw log)"
      );
      continue;
    }
    if (skipping) {
      dropped += 1;
      if (/node:electron\/js2c\/renderer_init/i.test(line)) {
        skipping = false;
      }
      continue;
    }
    out.push(line);
  }
  return { lines: out, dropped };
}

const NOISE_LINE = (line: string): boolean => {
  const s = line.toLowerCase();
  if (s.includes("[vite]") || /vite]\s*connecting|vite]\s*connected/i.test(line))
    return true;
  if (s.includes("react-dom_client") && s.includes("react devtools")) return true;
  if (s.includes("locize.com") || s.includes("i18next is maintained")) return true;
  if (s.startsWith("https://electronjs.org/docs/tutorial/security")) return true;
  if (s.includes("this warning will not show up") && s.includes("packaged")) return true;
  if (s.includes("unnecessary security risks")) return true;
  if (s.includes("for more information and help")) return true;
  if (s.includes("policy set or a policy with") && s.includes("unsafe-eval")) return true;
  if (s.includes("node:electron/js2c/renderer_init")) return true;
  if (s.includes("font-weight:bold") && s.includes("react devtools")) return true;
  if (/\[renderer:(verbose|info)\]/i.test(line)) return true;
  if (/missing `description` or `aria-describedby`/i.test(line) && /dialogcontent/i.test(s))
    return true;
  return false;
};

/** High-signal lines for triage (main process + Ledgeria / DB only). */
const SIGNAL_LINE = (line: string): boolean => {
  if (/\[renderer:/i.test(line)) return false;
  if (/issues-sink|issues-http/i.test(line)) return true;
  if (/db path:/i.test(line) && /\.db\b/i.test(line)) return true;
  return false;
};

function buildSummary(signals: string[]): string {
  let postedStrapi = false;
  let accepted = false;
  let dbPath: string | undefined;

  for (const s of signals) {
    if (/issues-sink/i.test(s) && /HTTP POST/i.test(s)) postedStrapi = true;
    if (/issues-http/i.test(s) && /\bOK\s+20\d\b/.test(s)) accepted = true;
    const m = s.match(/DB path:\s*(.+)$/i);
    if (m) dbPath = m[1].trim();
  }

  const parts: string[] = [];
  if (postedStrapi) parts.push("Feedback was sent to Strapi (POST).");
  if (accepted) parts.push("Strapi accepted the issue (HTTP 201).");
  if (dbPath) parts.push(`Local SQLite DB: ${dbPath}`);
  if (parts.length === 0) return "No Ledgeria pipeline lines detected; see raw log.";
  return parts.join(" ");
}

export type LedgeriaLogDigest = {
  /** One or two plain-language sentences from signal lines. */
  summary: string;
  highlights: string[];
  notable: string[];
  rawLineCount: number;
  noiseDropped: number;
};

function dedupeKeepOrder(lines: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const l of lines) {
    const key = l.slice(0, 220);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(l);
  }
  return out;
}

export function digestLedgeriaLog(
  raw: string | null | undefined
): LedgeriaLogDigest | null {
  if (raw == null || !String(raw).trim()) return null;

  const rawLines = String(raw)
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);

  const { lines: folded, dropped: cspDropped } = foldElectronCspBlock(rawLines);

  const highlights: string[] = [];
  const notable: string[] = [];
  let noiseDropped = cspDropped;

  for (const line of folded) {
    if (NOISE_LINE(line)) {
      noiseDropped += 1;
      continue;
    }
    if (SIGNAL_LINE(line)) {
      highlights.push(line);
      continue;
    }
    notable.push(line);
  }

  const mergedHighlights = dedupeKeepOrder(highlights);
  const summary = buildSummary(mergedHighlights);
  const mergedNotable = dedupeKeepOrder(notable);

  return {
    summary,
    highlights: mergedHighlights,
    notable: mergedNotable,
    rawLineCount: rawLines.length,
    noiseDropped,
  };
}
