/**
 * Strapi 5 REST API icin minimal helper.
 *
 * Strapi 5'te response formati duzlestirildi:
 *   { data: [{ id, documentId, ...attributes }] }
 *
 * Public endpoint'lere erisim icin Strapi admin panelinde
 *   Settings -> Users & Permissions Plugin -> Roles -> Public
 * altinda ilgili content type'larda 'find' ve 'findOne' yetkisini ac.
 *
 * Veya .env.local icine STRAPI_API_TOKEN koy.
 */

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

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

/**
 * Strapi'den dondurulen image URL'lerini absolute hale getirir.
 */
export function strapiMedia(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${STRAPI_URL}${url}`;
}
