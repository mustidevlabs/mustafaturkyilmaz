import { strapiHttpsRequest } from "@/lib/strapi-node-https";

/** POST JSON to Strapi over node:https (same TLS/proxy path as Ledgeria server calls). */
export async function strapiHttpsPostJson(
  url: string,
  body: unknown,
  extraHeaders: Record<string, string> = {}
): Promise<{ statusCode: number; body: string }> {
  const json = JSON.stringify(body);
  return strapiHttpsRequest({
    url,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Content-Length": String(Buffer.byteLength(json, "utf8")),
      ...extraHeaders,
    },
    body: json,
  });
}
