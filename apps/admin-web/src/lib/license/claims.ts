import { normalizeCapabilities } from "./capability";
import {
  LICENSE_SCHEMA_VERSION,
  type LicenseBranding,
  type LicenseClaims,
  type SignedLicense,
} from "./types";

/** Deterministic JSON for Ed25519 signing (sorted object keys, no whitespace). */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}

function sortKeysDeep(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    out[key] = sortKeysDeep(obj[key]);
  }
  return out;
}

/** Pretty-printed envelope for `.json` / `.ledgeria-license` download (parse-compatible). */
export function formatSignedLicenseJson(license: SignedLicense): string {
  return `${JSON.stringify(license, null, 2)}\n`;
}

export function parseSignedLicenseJson(raw: unknown): SignedLicense {
  const obj = typeof raw === "string" ? (JSON.parse(raw) as unknown) : raw;
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    throw new Error("LICENSE_MALFORMED");
  }
  const envelope = obj as Record<string, unknown>;
  if (typeof envelope.signature !== "string" || !envelope.signature.trim()) {
    throw new Error("LICENSE_MALFORMED");
  }
  if (typeof envelope.keyId !== "string" || !envelope.keyId.trim()) {
    throw new Error("LICENSE_MALFORMED");
  }
  const claims = normalizeLicenseClaims(envelope.claims);
  return {
    claims,
    signature: envelope.signature.trim(),
    keyId: envelope.keyId.trim(),
  };
}

export function tryParseSignedLicenseJson(raw: string): SignedLicense | null {
  try {
    return parseSignedLicenseJson(raw);
  } catch {
    return null;
  }
}

export function normalizeLicenseClaims(raw: unknown): LicenseClaims {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("LICENSE_MALFORMED");
  }
  const c = raw as Record<string, unknown>;
  if (c.schemaVersion !== LICENSE_SCHEMA_VERSION) {
    throw new Error("LICENSE_SCHEMA_UNSUPPORTED");
  }
  if (typeof c.licenseId !== "string" || !c.licenseId.trim()) {
    throw new Error("LICENSE_MALFORMED");
  }
  if (typeof c.customerKey !== "string" || !c.customerKey.trim()) {
    throw new Error("LICENSE_MALFORMED");
  }
  if (typeof c.edition !== "string" || !c.edition.trim()) {
    throw new Error("LICENSE_MALFORMED");
  }
  if (typeof c.issuedAt !== "string" || !c.issuedAt.trim()) {
    throw new Error("LICENSE_MALFORMED");
  }

  const clientId =
    c.clientId == null || c.clientId === ""
      ? null
      : typeof c.clientId === "string"
        ? c.clientId.trim()
        : null;
  if (c.clientId != null && c.clientId !== "" && clientId == null) {
    throw new Error("LICENSE_MALFORMED");
  }

  const expiresAt =
    c.expiresAt == null || c.expiresAt === ""
      ? null
      : typeof c.expiresAt === "string"
        ? c.expiresAt.trim()
        : null;
  if (c.expiresAt != null && c.expiresAt !== "" && expiresAt == null) {
    throw new Error("LICENSE_MALFORMED");
  }

  const updateChannel =
    c.updateChannel == null || c.updateChannel === ""
      ? null
      : typeof c.updateChannel === "string"
        ? c.updateChannel.trim()
        : null;

  const maxDevices =
    c.maxDevices == null
      ? null
      : typeof c.maxDevices === "number" &&
          Number.isFinite(c.maxDevices) &&
          c.maxDevices > 0
        ? Math.floor(c.maxDevices)
        : null;

  const notes =
    c.notes == null || c.notes === ""
      ? null
      : typeof c.notes === "string"
        ? c.notes.trim()
        : null;

  return {
    schemaVersion: LICENSE_SCHEMA_VERSION,
    licenseId: c.licenseId.trim(),
    customerKey: c.customerKey.trim(),
    clientId,
    edition: c.edition.trim(),
    capabilities: normalizeCapabilities(c.capabilities),
    branding: normalizeBranding(c.branding),
    updateChannel,
    issuedAt: c.issuedAt.trim(),
    expiresAt,
    maxDevices,
    notes,
  };
}

function normalizeBranding(raw: unknown): LicenseBranding | null {
  if (raw == null) return null;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const b = raw as Record<string, unknown>;
  const pick = (key: string): string | null => {
    const v = b[key];
    if (v == null || v === "") return null;
    return typeof v === "string" ? v.trim() : null;
  };
  const branding: LicenseBranding = {
    appName: pick("appName"),
    logoUrl: pick("logoUrl"),
    primaryColor: pick("primaryColor"),
    brandPackVersion: pick("brandPackVersion"),
  };
  if (
    !branding.appName &&
    !branding.logoUrl &&
    !branding.primaryColor &&
    !branding.brandPackVersion
  ) {
    return null;
  }
  return branding;
}
