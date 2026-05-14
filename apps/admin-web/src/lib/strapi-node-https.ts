import dns from "node:dns";
import https, { type Agent, type RequestOptions } from "node:https";
import { URL } from "node:url";
import { getProxyForUrl } from "proxy-from-env";
import { HttpsProxyAgent } from "https-proxy-agent";

export type StrapiHttpsResult = {
  statusCode: number;
  body: string;
};

function httpsAgentForStrapiUrl(urlString: string): Agent | undefined {
  const proxyUrl = getProxyForUrl(urlString);
  if (!proxyUrl) return undefined;
  return new HttpsProxyAgent(proxyUrl);
}

function sendRequest(
  requestOptions: RequestOptions,
  body?: string
): Promise<StrapiHttpsResult> {
  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode ?? 0,
          body: Buffer.concat(chunks).toString("utf8"),
        });
      });
    });

    req.on("error", reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

const tlsRange = {
  minVersion: "TLSv1.2" as const,
  maxVersion: "TLSv1.3" as const,
};

/**
 * HTTPS to Strapi using node:https (not global fetch).
 *
 * - No proxy: resolve IPv4, connect to IP with SNI + Host (stable on broken IPv6 paths).
 * - HTTPS_PROXY / ALL_PROXY (+ NO_PROXY): {@link HttpsProxyAgent} so outbound TLS
 *   matches environments where the browser uses a system proxy but Node would not.
 */
export function strapiHttpsRequest(options: {
  url: string;
  method: "GET" | "PUT" | "DELETE";
  headers: Record<string, string>;
  body?: string;
}): Promise<StrapiHttpsResult> {
  const u = new URL(options.url);
  const port = u.port ? Number(u.port) : 443;
  const path = `${u.pathname}${u.search}`;
  const agent = httpsAgentForStrapiUrl(options.url);

  if (agent) {
    const requestOptions: RequestOptions = {
      hostname: u.hostname,
      port,
      path,
      method: options.method,
      headers: options.headers,
      agent,
      servername: u.hostname,
      ...tlsRange,
    };
    return sendRequest(requestOptions, options.body);
  }

  return (async () => {
    const { address } = await dns.promises.lookup(u.hostname, { family: 4 });
    const hostHeader =
      u.port && u.port !== "443" ? `${u.hostname}:${u.port}` : u.hostname;
    const headers: Record<string, string> = {
      Host: hostHeader,
      ...options.headers,
    };

    const requestOptions: RequestOptions = {
      host: address,
      port,
      path,
      method: options.method,
      headers,
      servername: u.hostname,
      ...tlsRange,
    };

    return sendRequest(requestOptions, options.body);
  })();
}
