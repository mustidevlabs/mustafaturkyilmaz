import { getStrapiPublicUrl } from "@/lib/strapi-public-url";
import { strapiAuthHeaders } from "@/lib/strapi-admin-headers";
import { strapiHttpsRequest } from "@/lib/strapi-node-https";

export type StrapiJson = {
  data?: unknown;
  error?: { message?: string; name?: string };
};

export function requireStrapiToken(): string | null {
  return process.env.STRAPI_API_TOKEN?.trim() || null;
}

export async function strapiApi(
  pathAndQuery: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    token: string;
  }
): Promise<{ ok: boolean; status: number; json: StrapiJson; raw: string }> {
  const base = getStrapiPublicUrl();
  const method = options.method ?? "GET";
  const body =
    options.body === undefined ? undefined : JSON.stringify(options.body);
  const headers: Record<string, string> = {
    ...strapiAuthHeaders(options.token),
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    headers["Content-Length"] = String(Buffer.byteLength(body, "utf8"));
  }

  const res = await strapiHttpsRequest({
    url: `${base}${pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`}`,
    method,
    headers,
    body,
  });

  let json: StrapiJson = {};
  try {
    json = JSON.parse(res.body) as StrapiJson;
  } catch {
    json = {};
  }

  return {
    ok: res.statusCode >= 200 && res.statusCode < 300,
    status: res.statusCode,
    json,
    raw: res.body,
  };
}

/** Flatten Strapi v5 document or attributes-shaped entry. */
export function flattenStrapiEntry(
  entry: unknown
): Record<string, unknown> | null {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
  const e = entry as Record<string, unknown>;
  const attrs =
    e.attributes && typeof e.attributes === "object" && !Array.isArray(e.attributes)
      ? (e.attributes as Record<string, unknown>)
      : null;
  const base = attrs ? { ...attrs } : { ...e };
  if (typeof e.documentId === "string") base.documentId = e.documentId;
  else if (typeof e.id === "string" || typeof e.id === "number") {
    base.documentId = String(e.id);
  }
  if (typeof e.id === "number" || typeof e.id === "string") base.id = e.id;
  return base;
}

export function flattenStrapiList(json: StrapiJson): Record<string, unknown>[] {
  const data = json.data;
  if (!Array.isArray(data)) return [];
  return data
    .map(flattenStrapiEntry)
    .filter((x): x is Record<string, unknown> => x != null);
}

export function flattenStrapiOne(
  json: StrapiJson
): Record<string, unknown> | null {
  return flattenStrapiEntry(json.data);
}

export function strapiErrorMessage(json: StrapiJson, fallback: string): string {
  return json.error?.message?.trim() || fallback;
}
