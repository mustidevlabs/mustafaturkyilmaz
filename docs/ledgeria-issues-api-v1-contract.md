# Ledgeria issues API v1 — HTTP contract

Base path (Strapi custom routes): `POST /ledgeria/v1/issues` and alias `POST /api/ledgeria/v1/issues`.

Authentication: optional `LEDGERIA_ISSUES_API_KEY` via `Authorization: Bearer …` or `X-API-Key`.

## 3.2 Request body

JSON object (`IssuePayload`). Required fields: `id` (UUID v4), `title`, `description`, `category`, `appVersion`, `os`, `clientCreatedAt` (ISO 8601). Optional: `priority`, `locale`, `lastScreen`, `logs`, `screenshotPath`, `screenshotPngBase64`, `screenshotPins`.

## 3.3 `screenshotPngBase64`

- Type: string or omitted.
- PNG bytes encoded as Base64 **without** a `data:image/png;base64,` prefix (client may send raw base64).
- Server enforces a maximum length (see `issue-ingestion.ts`).

## 3.4 `screenshotPins`

- Type: array of objects, or omitted / `null` / empty array `[]` (stored as empty / null).
- **Rule:** If the array is **non-empty**, `screenshotPngBase64` **must** be present and non-trivial; otherwise the server responds with **400** and `{ "message": "…" }`.
- **Length:** at most **12** elements (constant `ISSUE_SCREENSHOT_PIN_LIMIT` in `@ledgeria/shared` / mirrored in backend).
- **Per element:**

| Field     | Type   | Rules |
|-----------|--------|--------|
| `x`       | number | `0 ≤ x ≤ 1`, normalized to PNG **natural width** (left → right). |
| `y`       | number | `0 ≤ y ≤ 1`, normalized to PNG **natural height** (top → bottom). |
| `message` | string | After trim, non-empty; max **400** characters (`ISSUE_SCREENSHOT_PIN_MESSAGE_MAX_CHARS`). |

- Coordinates are **independent of display scale**. Consumers that render with CSS `object-fit: contain` must apply letterbox offsets: compute displayed image width/height inside the element, then map `x,y` to pixel offsets (see `apps/admin-web` `computePinPositions`).

## 5 Storage (Strapi)

- Field `screenshotPins`: JSON (array of `{ x, y, message }`).
- `screenshotPngBase64` may be large; a future migration can move binaries to **Media Library** and keep pins JSON alongside a media relation.
- **Backward compatibility:** older issues have no `screenshotPins`; omit or null is valid.

## Example fragment

```json
{
  "screenshotPngBase64": "iVBORw0KGgo…",
  "screenshotPins": [
    { "x": 0.12, "y": 0.45, "message": "Label overlaps the button." },
    { "x": 0.78, "y": 0.22, "message": "Spinner never stops." }
  ]
}
```
