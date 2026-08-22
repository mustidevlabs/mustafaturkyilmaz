import dns from "node:dns";
import http from "node:http";
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
  transport: typeof http | typeof https,
  requestOptions: RequestOptions,
  body?: string
): Promise<StrapiHttpsResult> {
  return new Promise((resolve, reject) => {
    const req = transport.request(requestOptions, (res) => {
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
 * HTTP(S) to Strapi using node:http / node:https (not global fetch).
 *
 * - `http://` (local Strapi): plain HTTP.
 * - `https://` no proxy: resolve IPv4, connect to IP with SNI + Host.
 * - HTTPS_PROXY / ALL_PROXY (+ NO_PROXY): {@link HttpsProxyAgent}.
 */
export function strapiHttpsRequest(options: {
  url: string;
  method: "GET" | "PUT" | "DELETE" | "POST";
  headers: Record<string, string>;
  body?: string;
}): Promise<StrapiHttpsResult> {
  const u = new URL(options.url);
  const isHttp = u.protocol === "http:";
  const port = u.port
    ? Number(u.port)
    : isHttp
      ? 80
      : 443;
  const path = `${u.pathname}${u.search}`;

  if (isHttp) {
    const hostHeader =
      u.port && u.port !== "80" ? `${u.hostname}:${u.port}` : u.hostname;
    const requestOptions: RequestOptions = {
      hostname: u.hostname,
      port,
      path,
      method: options.method,
      headers: {
        Host: hostHeader,
        ...options.headers,
      },
    };
    return sendRequest(http, requestOptions, options.body);
  }

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
    return sendRequest(https, requestOptions, options.body);
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

    return sendRequest(https, requestOptions, options.body);
  })();
}
