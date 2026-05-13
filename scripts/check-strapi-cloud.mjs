/**
 * Load apps/admin-web/.env.local into process.env (keys not already set).
 * Run from repo root: node scripts/check-strapi-cloud.mjs
 */
import fs from "node:fs";
import path from "node:path";
import dns from "node:dns";
import https from "node:https";
import { URL, fileURLToPath } from "node:url";
import { getProxyForUrl } from "proxy-from-env";
import { HttpsProxyAgent } from "https-proxy-agent";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const adminEnv = path.join(repoRoot, "apps", "admin-web", ".env.local");

function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
  return true;
}

const DEFAULT =
  "https://timely-spirit-9e046731e1.strapiapp.com";

function httpsGet(urlString, headers) {
  const u = new URL(urlString);
  const port = u.port ? Number(u.port) : 443;
  const path = `${u.pathname}${u.search}`;
  const proxyUrl = getProxyForUrl(urlString);

  if (proxyUrl) {
    const agent = new HttpsProxyAgent(proxyUrl);
    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: u.hostname,
          port,
          path,
          method: "GET",
          headers,
          agent,
          servername: u.hostname,
          minVersion: "TLSv1.2",
          maxVersion: "TLSv1.3",
        },
        (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () =>
            resolve({
              statusCode: res.statusCode ?? 0,
              body: Buffer.concat(chunks).toString("utf8"),
            })
          );
        }
      );
      req.on("error", reject);
      req.end();
    });
  }

  return (async () => {
    const { address } = await dns.promises.lookup(u.hostname, { family: 4 });
    const hostHeader =
      u.port && u.port !== "443" ? `${u.hostname}:${u.port}` : u.hostname;
    const merged = { Host: hostHeader, ...headers };

    return await new Promise((resolve, reject) => {
      const req = https.request(
        {
          host: address,
          port,
          path,
          method: "GET",
          headers: merged,
          servername: u.hostname,
          minVersion: "TLSv1.2",
          maxVersion: "TLSv1.3",
        },
        (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () =>
            resolve({
              statusCode: res.statusCode ?? 0,
              body: Buffer.concat(chunks).toString("utf8"),
            })
          );
        }
      );
      req.on("error", reject);
      req.end();
    });
  })();
}

async function main() {
  loadDotEnvFile(adminEnv);

  const base = (process.env.NEXT_PUBLIC_STRAPI_URL || DEFAULT).replace(
    /\/$/,
    ""
  );
  const token = (process.env.STRAPI_API_TOKEN || "").trim();

  console.log("Strapi base:", base);
  const proxyUrl = getProxyForUrl(`${base}/api/ledgeria-issues`);
  if (proxyUrl) {
    try {
      const u = new URL(proxyUrl);
      console.log("HTTPS proxy:", `${u.protocol}//${u.host} (from env)`);
    } catch {
      console.log("HTTPS proxy: (set)");
    }
  } else {
    console.log("HTTPS proxy: (none — direct TLS to Strapi host)");
  }
  console.log(
    "STRAPI_API_TOKEN:",
    token ? `set (${token.length} chars)` : "MISSING — admin UI will not fetch issues"
  );
  console.log("");

  const qs = new URLSearchParams({
    "sort[0]": "createdAt:desc",
    "pagination[pageSize]": "3",
  });
  const url = `${base}/api/ledgeria-issues?${qs.toString()}`;

  try {
    const headers = {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await httpsGet(url, headers);
    console.log("GET /api/ledgeria-issues → HTTP", res.statusCode);
    if (res.statusCode < 200 || res.statusCode >= 300) {
      console.log("Body (first 500 chars):", res.body.slice(0, 500));
      process.exitCode = 1;
      return;
    }
    let json;
    try {
      json = JSON.parse(res.body);
    } catch {
      console.log("Non-JSON body:", res.body.slice(0, 200));
      process.exitCode = 1;
      return;
    }
    const n = Array.isArray(json?.data) ? json.data.length : 0;
    console.log("OK — issues in this page:", n);
    if (n > 0 && json.data[0]) {
      const first = json.data[0];
      const id = first.documentId ?? first.id;
      console.log("First issue id/documentId:", id);
      const attrs = first.attributes;
      const bag =
        attrs && typeof attrs === "object" && !Array.isArray(attrs)
          ? attrs
          : first;
      const pins = bag.screenshotPins ?? bag.screenshot_pins;
      const pinSummary =
        pins == null
          ? "absent/null"
          : Array.isArray(pins)
            ? `array length ${pins.length}`
            : typeof pins;
      console.log(
        "First issue screenshotPins (Ledgeria):",
        pinSummary,
        "(if always absent after deploy, Cloud schema may lack this JSON field.)"
      );
    }
  } catch (e) {
    console.error("Request failed:", e.message);
    if (e.cause) console.error("Cause:", e.cause);
    process.exitCode = 1;
  }
}

main();
