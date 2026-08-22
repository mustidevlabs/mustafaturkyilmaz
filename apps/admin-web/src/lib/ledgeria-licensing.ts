import { normalizeCapabilities, type LedgeriaCapability } from "@/lib/license/capability";
import { tryParseSignedLicenseJson } from "@/lib/license/claims";
import { parseOccupiedClientIds } from "@/lib/license/license-seats";
import {
  flattenStrapiList,
  flattenStrapiOne,
  requireStrapiToken,
  strapiApi,
  strapiErrorMessage,
  type StrapiJson,
} from "@/lib/strapi-rest";

export type CustomerStatus = "active" | "suspended";

export type LedgeriaCustomer = {
  documentId: string;
  customerKey: string;
  displayName: string;
  notes: string | null;
  status: CustomerStatus;
  hasDownloadPassword: boolean;
  downloadPasswordSetAt: string | null;
  occupiedDeviceCount: number;
};

/** Server-only: hash fields for the public download endpoint. */
export type LedgeriaCustomerAuth = LedgeriaCustomer & {
  downloadPasswordHash: string;
  occupiedClientIds: string[];
};

function asStatus(v: unknown): CustomerStatus {
  return v === "suspended" ? "suspended" : "active";
}

export function pickCustomer(raw: Record<string, unknown>): LedgeriaCustomer | null {
  const documentId = String(raw.documentId ?? "").trim();
  const customerKey = String(raw.customerKey ?? "").trim();
  const displayName = String(raw.displayName ?? "").trim();
  if (!documentId || !customerKey || !displayName) return null;
  const hash =
    typeof raw.downloadPasswordHash === "string"
      ? raw.downloadPasswordHash.trim()
      : "";
  const setAt =
    raw.downloadPasswordSetAt == null || raw.downloadPasswordSetAt === ""
      ? null
      : String(raw.downloadPasswordSetAt);
  const occupied = parseOccupiedClientIds(raw.occupiedClientIds);
  return {
    documentId,
    customerKey,
    displayName,
    notes: raw.notes == null || raw.notes === "" ? null : String(raw.notes),
    status: asStatus(raw.status),
    hasDownloadPassword: Boolean(hash),
    downloadPasswordSetAt: setAt,
    occupiedDeviceCount: occupied.length,
  };
}

function pickCustomerAuth(
  raw: Record<string, unknown>
): LedgeriaCustomerAuth | null {
  const base = pickCustomer(raw);
  const hash =
    typeof raw.downloadPasswordHash === "string"
      ? raw.downloadPasswordHash.trim()
      : "";
  if (!base || !hash) return null;
  return {
    ...base,
    downloadPasswordHash: hash,
    occupiedClientIds: parseOccupiedClientIds(raw.occupiedClientIds),
  };
}

export function pickCustomers(json: StrapiJson): LedgeriaCustomer[] {
  return flattenStrapiList(json)
    .map(pickCustomer)
    .filter((x): x is LedgeriaCustomer => x != null);
}

export async function fetchCustomers(): Promise<
  | { ok: true; customers: LedgeriaCustomer[] }
  | { ok: false; reason: "no_token" | "strapi_error"; detail?: string }
> {
  const token = requireStrapiToken();
  if (!token) return { ok: false, reason: "no_token" };

  const qs = new URLSearchParams({
    "sort[0]": "customerKey:asc",
    "pagination[pageSize]": "200",
  });

  try {
    const res = await strapiApi(`/api/ledgeria-customers?${qs}`, { token });
    if (!res.ok) {
      return {
        ok: false,
        reason: "strapi_error",
        detail: strapiErrorMessage(res.json, res.raw.slice(0, 400)),
      };
    }
    return { ok: true, customers: pickCustomers(res.json) };
  } catch (err) {
    return {
      ok: false,
      reason: "strapi_error",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchCustomerByDownloadLookup(
  lookup: string
): Promise<LedgeriaCustomerAuth | null> {
  const token = requireStrapiToken();
  if (!token) return null;
  const hex = lookup.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(hex)) return null;

  const qs = new URLSearchParams({
    "filters[downloadPasswordLookup][$eq]": hex,
    "pagination[pageSize]": "1",
  });
  const res = await strapiApi(`/api/ledgeria-customers?${qs}`, { token });
  if (!res.ok) return null;
  const first = flattenStrapiList(res.json)[0];
  return first ? pickCustomerAuth(first) : null;
}

export async function fetchLatestActiveLicenseForCustomer(
  customerDocumentId: string
): Promise<LedgeriaLicenseRecord | null> {
  const listed = await fetchLicenses({ customerDocumentId });
  if (!listed.ok) return null;
  return (
    listed.licenses.find((lic) => !lic.revoked) ?? null
  );
}

export async function fetchCustomerByDocumentId(
  documentId: string
): Promise<LedgeriaCustomer | null> {
  const token = requireStrapiToken();
  if (!token) return null;
  const res = await strapiApi(
    `/api/ledgeria-customers/${encodeURIComponent(documentId)}`,
    { token }
  );
  if (!res.ok) return null;
  const flat = flattenStrapiOne(res.json);
  return flat ? pickCustomer(flat) : null;
}

export async function updateCustomerDownloadSecret(
  documentId: string,
  data: {
    downloadPasswordHash: string | null;
    downloadPasswordLookup: string | null;
    downloadPasswordSetAt: string | null;
    occupiedClientIds?: string[];
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = requireStrapiToken();
  if (!token) return { ok: false, error: "STRAPI_API_TOKEN eksik." };
  const res = await strapiApi(
    `/api/ledgeria-customers/${encodeURIComponent(documentId)}`,
    {
      method: "PUT",
      token,
      body: { data },
    }
  );
  if (!res.ok) {
    return {
      ok: false,
      error: strapiErrorMessage(res.json, `Strapi ${res.status}`),
    };
  }
  return { ok: true };
}

export async function updateCustomerOccupiedClientIds(
  documentId: string,
  occupiedClientIds: string[]
): Promise<boolean> {
  const token = requireStrapiToken();
  if (!token) return false;
  const res = await strapiApi(
    `/api/ledgeria-customers/${encodeURIComponent(documentId)}`,
    {
      method: "PUT",
      token,
      body: { data: { occupiedClientIds } },
    }
  );
  return res.ok;
}

export type LedgeriaEdition = {
  documentId: string;
  editionKey: string;
  displayName: string;
  description: string | null;
  capabilities: LedgeriaCapability[];
  defaultUpdateChannel: string | null;
};

export function pickEdition(raw: Record<string, unknown>): LedgeriaEdition | null {
  const documentId = String(raw.documentId ?? "").trim();
  const editionKey = String(raw.editionKey ?? "").trim();
  const displayName = String(raw.displayName ?? "").trim();
  if (!documentId || !editionKey || !displayName) return null;
  return {
    documentId,
    editionKey,
    displayName,
    description:
      raw.description == null || raw.description === ""
        ? null
        : String(raw.description),
    capabilities: normalizeCapabilities(raw.capabilities),
    defaultUpdateChannel:
      raw.defaultUpdateChannel == null || raw.defaultUpdateChannel === ""
        ? null
        : String(raw.defaultUpdateChannel),
  };
}

export function pickEditions(json: StrapiJson): LedgeriaEdition[] {
  return flattenStrapiList(json)
    .map(pickEdition)
    .filter((x): x is LedgeriaEdition => x != null);
}

export async function fetchEditions(): Promise<
  | { ok: true; editions: LedgeriaEdition[] }
  | { ok: false; reason: "no_token" | "strapi_error"; detail?: string }
> {
  const token = requireStrapiToken();
  if (!token) return { ok: false, reason: "no_token" };

  const qs = new URLSearchParams({
    "sort[0]": "editionKey:asc",
    "pagination[pageSize]": "50",
  });

  try {
    const res = await strapiApi(`/api/ledgeria-editions?${qs}`, { token });
    if (!res.ok) {
      return {
        ok: false,
        reason: "strapi_error",
        detail: strapiErrorMessage(res.json, res.raw.slice(0, 400)),
      };
    }
    return { ok: true, editions: pickEditions(res.json) };
  } catch (err) {
    return {
      ok: false,
      reason: "strapi_error",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchEditionByDocumentId(
  documentId: string
): Promise<LedgeriaEdition | null> {
  const token = requireStrapiToken();
  if (!token) return null;
  const res = await strapiApi(
    `/api/ledgeria-editions/${encodeURIComponent(documentId)}`,
    { token }
  );
  if (!res.ok) return null;
  const flat = flattenStrapiOne(res.json);
  return flat ? pickEdition(flat) : null;
}

export type LedgeriaLicenseRecord = {
  documentId: string;
  licenseId: string;
  customerKey: string;
  customerDocumentId: string | null;
  edition: string;
  capabilities: LedgeriaCapability[];
  clientId: string | null;
  updateChannel: string | null;
  issuedAt: string;
  expiresAt: string | null;
  maxDevices: number | null;
  revoked: boolean;
  notes: string | null;
  keyId: string;
  signedLicenseJson: string;
};

function pickPositiveInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
  }
  return null;
}

function relationDocumentId(rel: unknown): string | null {
  if (!rel) return null;
  if (typeof rel === "string") return rel.trim() || null;
  if (typeof rel === "object" && !Array.isArray(rel)) {
    const r = rel as Record<string, unknown>;
    if (typeof r.documentId === "string") return r.documentId;
    if (r.data && typeof r.data === "object" && !Array.isArray(r.data)) {
      const d = r.data as Record<string, unknown>;
      if (typeof d.documentId === "string") return d.documentId;
    }
  }
  return null;
}

export function pickLicense(
  raw: Record<string, unknown>
): LedgeriaLicenseRecord | null {
  const documentId = String(raw.documentId ?? "").trim();
  const licenseId = String(raw.licenseId ?? "").trim();
  const customerKey = String(raw.customerKey ?? "").trim();
  const edition = String(raw.edition ?? "").trim();
  const issuedAt = String(raw.issuedAt ?? "").trim();
  const keyId = String(raw.keyId ?? "").trim();
  const signedLicenseJson = String(raw.signedLicenseJson ?? "").trim();
  if (
    !documentId ||
    !licenseId ||
    !customerKey ||
    !edition ||
    !issuedAt ||
    !keyId ||
    !signedLicenseJson
  ) {
    return null;
  }
  return {
    documentId,
    licenseId,
    customerKey,
    customerDocumentId: relationDocumentId(raw.customer),
    edition,
    capabilities: normalizeCapabilities(raw.capabilities),
    clientId:
      raw.clientId == null || raw.clientId === "" ? null : String(raw.clientId),
    updateChannel:
      raw.updateChannel == null || raw.updateChannel === ""
        ? null
        : String(raw.updateChannel),
    issuedAt,
    expiresAt:
      raw.expiresAt == null || raw.expiresAt === ""
        ? null
        : String(raw.expiresAt),
    maxDevices:
      pickPositiveInt(raw.maxDevices) ??
      tryParseSignedLicenseJson(signedLicenseJson)?.claims.maxDevices ??
      null,
    revoked: Boolean(raw.revoked),
    notes: raw.notes == null || raw.notes === "" ? null : String(raw.notes),
    keyId,
    signedLicenseJson,
  };
}

export function pickLicenses(json: StrapiJson): LedgeriaLicenseRecord[] {
  return flattenStrapiList(json)
    .map(pickLicense)
    .filter((x): x is LedgeriaLicenseRecord => x != null);
}

export async function fetchLicenseByDocumentId(
  documentId: string
): Promise<LedgeriaLicenseRecord | null> {
  const token = requireStrapiToken();
  if (!token) return null;
  const id = documentId.trim();
  if (!id) return null;
  const qs = new URLSearchParams({ "populate[0]": "customer" });
  const res = await strapiApi(
    `/api/ledgeria-licenses/${encodeURIComponent(id)}?${qs}`,
    { token }
  );
  if (!res.ok) return null;
  const flat = flattenStrapiOne(res.json);
  return flat ? pickLicense(flat) : null;
}

export async function fetchLicenses(opts?: {
  customerDocumentId?: string;
}): Promise<
  | { ok: true; licenses: LedgeriaLicenseRecord[] }
  | { ok: false; reason: "no_token" | "strapi_error"; detail?: string }
> {
  const token = requireStrapiToken();
  if (!token) return { ok: false, reason: "no_token" };

  const qs = new URLSearchParams({
    "sort[0]": "issuedAt:desc",
    "pagination[pageSize]": "200",
    "populate[0]": "customer",
  });
  if (opts?.customerDocumentId) {
    qs.set("filters[customer][documentId][$eq]", opts.customerDocumentId);
  }

  try {
    const res = await strapiApi(`/api/ledgeria-licenses?${qs}`, { token });
    if (!res.ok) {
      return {
        ok: false,
        reason: "strapi_error",
        detail: strapiErrorMessage(res.json, res.raw.slice(0, 400)),
      };
    }
    return { ok: true, licenses: pickLicenses(res.json) };
  } catch (err) {
    return {
      ok: false,
      reason: "strapi_error",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}
