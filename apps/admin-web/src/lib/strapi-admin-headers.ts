/**
 * Headers for server-side Strapi Cloud requests. Some CDNs reject the default
 * Node `fetch` User-Agent with a TLS handshake failure; a normal browser UA
 * avoids that class of issues.
 */
export function strapiAuthHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  };
}
