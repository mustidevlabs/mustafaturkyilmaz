import "server-only";

import {
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeDownloadPassword(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function generateDownloadPassword(): string {
  const bytes = randomBytes(16);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `LG-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}-${chars.slice(12, 16)}`;
}

function pepper(): string {
  const fromEnv = process.env.LEDGERIA_LICENSE_PASSWORD_PEPPER?.trim();
  if (fromEnv) return fromEnv;
  const file = path.join(process.cwd(), ".data", "password-pepper");
  try {
    if (existsSync(file)) {
      const stored = readFileSync(file, "utf8").trim();
      if (stored) return stored;
    }
    const generated = randomBytes(32).toString("hex");
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, generated, { encoding: "utf8", mode: 0o600 });
    return generated;
  } catch {
    return (
      process.env.LEDGERIA_LICENSE_KEY_STORE_SECRET?.trim() ||
      process.env.STRAPI_API_TOKEN?.trim() ||
      "ledgeria-dev-password-pepper"
    );
  }
}

export function downloadPasswordLookup(password: string): string {
  return createHmac("sha256", pepper())
    .update(normalizeDownloadPassword(password), "utf8")
    .digest("hex");
}

export async function hashDownloadPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = (await scryptAsync(
    normalizeDownloadPassword(password),
    salt,
    64
  )) as Buffer;
  return `scrypt:${salt.toString("base64")}:${hash.toString("base64")}`;
}

export async function verifyDownloadPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "base64");
  const expected = Buffer.from(parts[2], "base64");
  if (!salt.length || expected.length !== 64) return false;
  const hash = (await scryptAsync(
    normalizeDownloadPassword(password),
    salt,
    64
  )) as Buffer;
  if (hash.length !== expected.length) return false;
  return timingSafeEqual(hash, expected);
}

export async function dummyPasswordCheck(password: string): Promise<void> {
  const dummy = await hashDownloadPassword("LG-DUMMY-DUMMY-DUMMY-DUMMY");
  await verifyDownloadPassword(password, dummy);
}

export function licenseDownloadPublicUrl(): string {
  const explicit = process.env.LEDGERIA_LICENSE_DOWNLOAD_PUBLIC_URL?.trim();
  if (explicit) return explicit;
  const origin = process.env.NEXT_PUBLIC_ADMIN_ORIGIN?.trim();
  if (origin) {
    return `${origin.replace(/\/$/, "")}/api/ledgeria/license`;
  }
  return "http://localhost:3002/api/ledgeria/license";
}
