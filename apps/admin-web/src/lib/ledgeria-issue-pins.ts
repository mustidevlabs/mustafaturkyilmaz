/** Mirrors `@ledgeria/shared` contract for admin + docs. */

export const ISSUE_SCREENSHOT_PIN_LIMIT = 12;
export const ISSUE_SCREENSHOT_PIN_MESSAGE_MAX_CHARS = 400;

export type IssueScreenshotPin = {
  x: number;
  y: number;
  message: string;
};

/** Strapi / DB sometimes return JSON columns as stringified arrays. */
export function coerceScreenshotPinsInput(v: unknown): unknown {
  if (v == null) return undefined;
  if (typeof v === "string") {
    const t = v.trim();
    if (!t || t === "null") return undefined;
    try {
      return JSON.parse(t) as unknown;
    } catch {
      return undefined;
    }
  }
  return v;
}

function num01(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.trim().replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** Like `num01`, but if a value is in (1, 100] treat it as a percentage (12 → 0.12). */
function num01Display(v: unknown): number | undefined {
  const n = num01(v);
  if (n === undefined) return undefined;
  if (n > 1 && n <= 100) return n / 100;
  return n;
}

function pickPinMessage(o: Record<string, unknown>): string {
  const candidates = [o.message, o.note, o.text, o.body, o.label] as unknown[];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim() !== "") return c.trim();
  }
  return "";
}

/** Strapi / clients sometimes wrap the array in a single JSON object. */
function unwrapPinsArray(v: unknown): unknown[] | undefined {
  if (Array.isArray(v)) return v;
  if (v == null || typeof v !== "object" || Array.isArray(v)) return undefined;
  const r = v as Record<string, unknown>;
  const inner =
    r.pins ??
    r.items ??
    r.points ??
    r.screenshotPins ??
    r.screenshot_pins;
  return Array.isArray(inner) ? inner : undefined;
}

/** Best-effort parse from Strapi JSON (legacy / partial data tolerant). */
export function normalizeIssueScreenshotPins(
  v: unknown
): IssueScreenshotPin[] | undefined {
  const coerced = coerceScreenshotPinsInput(v);
  if (coerced == null) return undefined;
  const arr = unwrapPinsArray(coerced);
  if (!arr) return undefined;
  const out: IssueScreenshotPin[] = [];
  for (const el of arr) {
    if (el == null || typeof el !== "object" || Array.isArray(el)) continue;
    const o = el as Record<string, unknown>;
    const x = num01Display(o.x);
    const y = num01Display(o.y);
    const message = pickPinMessage(o);
    if (x === undefined || y === undefined) continue;
    if (x < 0 || x > 1 || y < 0 || y > 1) continue;
    if (!message) continue;
    if (message.length > ISSUE_SCREENSHOT_PIN_MESSAGE_MAX_CHARS) continue;
    out.push({ x, y, message });
  }
  return out.length > 0 ? out : undefined;
}

/** Read pins from a Strapi entry object (flat or `attributes`, camel or snake). */
export function extractScreenshotPinsFromStrapiEntry(
  entry: Record<string, unknown>
): unknown {
  const attrs = entry.attributes;
  const bag =
    attrs && typeof attrs === "object" && !Array.isArray(attrs)
      ? (attrs as Record<string, unknown>)
      : entry;
  const nested =
    bag.data && typeof bag.data === "object" && !Array.isArray(bag.data)
      ? (bag.data as Record<string, unknown>)
      : undefined;
  return (
    bag.screenshotPins ??
    bag.screenshot_pins ??
    nested?.screenshotPins ??
    nested?.screenshot_pins ??
    entry.screenshotPins ??
    entry.screenshot_pins
  );
}

/**
 * Map normalized pin coords to pixel positions inside the img element’s layout box
 * when the image uses object-fit: contain (letterboxing).
 */
export function computePinPositions(
  img: HTMLImageElement,
  pins: IssueScreenshotPin[]
): Array<{ leftPx: number; topPx: number; pin: IssueScreenshotPin }> {
  const W = img.offsetWidth;
  const H = img.offsetHeight;
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!W || !H || !nw || !nh) {
    return pins.map((pin) => ({
      leftPx: pin.x * W,
      topPx: pin.y * H,
      pin,
    }));
  }
  const scale = Math.min(W / nw, H / nh);
  const dispW = nw * scale;
  const dispH = nh * scale;
  const offsetX = (W - dispW) / 2;
  const offsetY = (H - dispH) / 2;
  return pins.map((pin) => ({
    leftPx: offsetX + pin.x * dispW,
    topPx: offsetY + pin.y * dispH,
    pin,
  }));
}
