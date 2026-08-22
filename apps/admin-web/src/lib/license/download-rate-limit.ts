type Bucket = { count: number; resetAt: number };

const WINDOW_MS = 15 * 60 * 1000;
const MAX = 30;
const buckets = new Map<string, Bucket>();

export function licenseDownloadAllowed(ip: string): boolean {
  const now = Date.now();
  const key = ip.trim() || "unknown";
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX) return false;
  current.count += 1;
  return true;
}
