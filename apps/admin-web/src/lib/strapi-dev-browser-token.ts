export type StrapiBrowserTlsTokenSource = "next_public" | "mirrored";

export type StrapiBrowserTlsToken = {
  token: string;
  source: StrapiBrowserTlsTokenSource;
};

/**
 * When Node cannot complete TLS to Strapi, the admin UI can load data from the
 * browser instead. Token source (dev only):
 *
 * 1) `NEXT_PUBLIC_STRAPI_DEV_BROWSER_TOKEN` — duplicated token, inlined in client JS.
 * 2) `STRAPI_DEV_MIRROR_API_TOKEN_TO_BROWSER=1` — reuse `STRAPI_API_TOKEN` only when
 *    `NODE_ENV === "development"`. Token is still sent to the client (RSC + client fetch).
 *    Never enable in production deployments.
 */
export function getStrapiBrowserTlsToken(): StrapiBrowserTlsToken | undefined {
  const pub = process.env.NEXT_PUBLIC_STRAPI_DEV_BROWSER_TOKEN?.trim();
  if (pub) return { token: pub, source: "next_public" };

  if (process.env.NODE_ENV !== "development") return undefined;

  const mirror = process.env.STRAPI_DEV_MIRROR_API_TOKEN_TO_BROWSER?.trim().toLowerCase();
  if (mirror !== "1" && mirror !== "true" && mirror !== "yes") return undefined;

  const server = process.env.STRAPI_API_TOKEN?.trim();
  if (!server) return undefined;
  return { token: server, source: "mirrored" };
}
