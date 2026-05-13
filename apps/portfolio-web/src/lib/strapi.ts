/**
 * Minimal helper for Strapi 5 REST API.
 *
 * Defaults to Strapi Cloud; set `NEXT_PUBLIC_STRAPI_URL` for a local or other
 * Strapi instance. Portfolio content (Project, Skill, About) is loaded from
 * that Strapi project.
 *
 * Strapi 5 flattened responses:
 *   { data: [{ id, documentId, ...attributes }] }
 *
 * For public endpoints, enable `find` / `findOne` in Strapi admin under
 * Settings → Users & Permissions → Roles → Public for the relevant types.
 *
 * Alternatively set `STRAPI_API_TOKEN` in `.env.local`.
 */

export const STRAPI_PUBLIC_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL?.trim() ||
  "https://timely-spirit-9e046731e1.strapiapp.com";

const STRAPI_URL = STRAPI_PUBLIC_URL;

const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue | QueryValue[]>;

function buildQueryString(params?: QueryParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v !== undefined && v !== null) search.append(key, String(v));
      }
    } else {
      search.append(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchStrapi<T>(
  path: string,
  params?: QueryParams,
  init?: RequestInit
): Promise<T> {
  const url = `${STRAPI_URL}/api/${path.replace(/^\/+/, "")}${buildQueryString(params)}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (STRAPI_TOKEN) {
    headers.Authorization = `Bearer ${STRAPI_TOKEN}`;
  }

  const res = await fetch(url, {
    ...init,
    headers,
    next: { revalidate: 60, ...(init as { next?: object })?.next },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Strapi request failed (${res.status} ${res.statusText}) for ${url}: ${text}`
    );
  }

  return (await res.json()) as T;
}

/** Resolve relative Strapi media URLs to absolute URLs. */
export function strapiMedia(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${STRAPI_URL}${url}`;
}
