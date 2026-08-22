"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  LEDGERIA_CAPABILITIES,
  normalizeCapabilities,
} from "@/lib/license/capability";
import { formatSignedLicenseJson } from "@/lib/license/claims";
import { derivePublicSpkiFromPrivatePkcs8 } from "@/lib/license/key-store";
import { LICENSE_SCHEMA_VERSION } from "@/lib/license/types";
import {
  getLicenseSigningConfigAsync,
  signLicenseClaims,
  verifyLicenseSignature,
} from "@/lib/license/sign";
import {
  generateDownloadPassword,
  hashDownloadPassword,
  downloadPasswordLookup,
} from "@/lib/license/download-password";
import { setDownloadPasswordReveal } from "@/lib/license/password-reveal-cookie";
import {
  fetchCustomerByDocumentId,
  fetchCustomers,
  fetchEditions,
  updateCustomerDownloadSecret,
  updateCustomerOccupiedClientIds,
} from "@/lib/ledgeria-licensing";
import {
  flattenStrapiOne,
  requireStrapiToken,
  strapiApi,
  strapiErrorMessage,
} from "@/lib/strapi-rest";

const CUSTOMERS_PATH = "/ledgeria/customers";
const EDITIONS_PATH = "/ledgeria/editions";
const LICENSES_PATH = "/ledgeria/licenses";

const CUSTOMER_KEY_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function revalidateLicensing(licenseDocumentId?: string) {
  revalidatePath(CUSTOMERS_PATH);
  revalidatePath(EDITIONS_PATH);
  revalidatePath(LICENSES_PATH);
  revalidatePath("/ledgeria/licenses/issue");
  if (licenseDocumentId) {
    revalidatePath(`${LICENSES_PATH}/${licenseDocumentId}`);
  }
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export type IssueLicenseResult =
  | {
      ok: true;
      licenseId: string;
      signedLicenseJson: string;
      filenameBase: string;
      documentId: string;
    }
  | { ok: false; error: string };

export async function createCustomerFromForm(
  formData: FormData
): Promise<ActionResult> {
  const token = requireStrapiToken();
  if (!token) return { ok: false, error: "STRAPI_API_TOKEN eksik." };

  const customerKey = String(formData.get("customerKey") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const status =
    String(formData.get("status") ?? "active").trim() === "suspended"
      ? "suspended"
      : "active";

  if (!CUSTOMER_KEY_RE.test(customerKey)) {
    return {
      ok: false,
      error: "customerKey slug olmalı (ör. demo-musteri).",
    };
  }
  if (!displayName) return { ok: false, error: "Görünen ad gerekli." };

  const res = await strapiApi("/api/ledgeria-customers", {
    method: "POST",
    token,
    body: {
      data: {
        customerKey,
        displayName,
        notes: notesRaw || null,
        status,
      },
    },
  });

  if (!res.ok) {
    return {
      ok: false,
      error: strapiErrorMessage(res.json, `Strapi ${res.status}`),
    };
  }

  const created = flattenStrapiOne(res.json);
  const documentId =
    created && typeof created.documentId === "string" ? created.documentId : "";

  if (documentId) {
    const issued = await persistNewDownloadPassword(documentId);
    if (issued.ok) {
      await setDownloadPasswordReveal(documentId, issued.password);
    }
  }

  revalidateLicensing();
  redirect(documentId ? `${CUSTOMERS_PATH}/${documentId}` : CUSTOMERS_PATH);
}

async function persistNewDownloadPassword(
  documentId: string
): Promise<{ ok: true; password: string } | { ok: false; error: string }> {
  const password = generateDownloadPassword();
  const saved = await updateCustomerDownloadSecret(documentId, {
    downloadPasswordHash: await hashDownloadPassword(password),
    downloadPasswordLookup: downloadPasswordLookup(password),
    downloadPasswordSetAt: new Date().toISOString(),
  });
  if (!saved.ok) return saved;
  return { ok: true, password };
}

export type IssuePasswordResult =
  | { ok: true; password: string }
  | { ok: false; error: string };

export async function issueCustomerDownloadPassword(
  formData: FormData
): Promise<IssuePasswordResult> {
  const documentId = String(formData.get("documentId") ?? "").trim();
  if (!documentId) return { ok: false, error: "documentId eksik." };

  const existing = await fetchCustomerByDocumentId(documentId);
  if (!existing) return { ok: false, error: "Müşteri bulunamadı." };

  const issued = await persistNewDownloadPassword(documentId);
  if (!issued.ok) return issued;

  await setDownloadPasswordReveal(documentId, issued.password);
  revalidateLicensing();
  revalidatePath(`${CUSTOMERS_PATH}/${documentId}`);
  return issued;
}

export async function clearCustomerDownloadPassword(
  formData: FormData
): Promise<ActionResult> {
  const documentId = String(formData.get("documentId") ?? "").trim();
  if (!documentId) return { ok: false, error: "documentId eksik." };

  const saved = await updateCustomerDownloadSecret(documentId, {
    downloadPasswordHash: null,
    downloadPasswordLookup: null,
    downloadPasswordSetAt: null,
  });
  if (!saved.ok) return saved;
  revalidateLicensing();
  revalidatePath(`${CUSTOMERS_PATH}/${documentId}`);
  return { ok: true };
}

export async function resetCustomerLicenseSeats(
  formData: FormData
): Promise<ActionResult> {
  const documentId = String(formData.get("documentId") ?? "").trim();
  if (!documentId) return { ok: false, error: "documentId eksik." };
  const ok = await updateCustomerOccupiedClientIds(documentId, []);
  if (!ok) return { ok: false, error: "Cihaz koltukları sıfırlanamadı." };
  revalidateLicensing();
  revalidatePath(`${CUSTOMERS_PATH}/${documentId}`);
  return { ok: true };
}

export async function deleteCustomerFromForm(
  formData: FormData
): Promise<ActionResult> {
  const token = requireStrapiToken();
  if (!token) return { ok: false, error: "STRAPI_API_TOKEN eksik." };

  const documentId = String(formData.get("documentId") ?? "").trim();
  if (!documentId) return { ok: false, error: "documentId eksik." };

  const res = await strapiApi(
    `/api/ledgeria-customers/${encodeURIComponent(documentId)}`,
    { method: "DELETE", token }
  );

  if (!res.ok) {
    return {
      ok: false,
      error: strapiErrorMessage(res.json, `Strapi ${res.status}`),
    };
  }

  revalidateLicensing();
  redirect(CUSTOMERS_PATH);
}

export async function updateCustomerFromForm(
  formData: FormData
): Promise<ActionResult> {
  const token = requireStrapiToken();
  if (!token) return { ok: false, error: "STRAPI_API_TOKEN eksik." };

  const documentId = String(formData.get("documentId") ?? "").trim();
  const customerKey = String(formData.get("customerKey") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const status =
    String(formData.get("status") ?? "active").trim() === "suspended"
      ? "suspended"
      : "active";

  if (!documentId) return { ok: false, error: "documentId eksik." };
  if (!displayName) return { ok: false, error: "Görünen ad gerekli." };
  if (!CUSTOMER_KEY_RE.test(customerKey)) {
    return {
      ok: false,
      error: "customerKey slug olmalı (ör. demo-musteri).",
    };
  }

  const existing = await fetchCustomerByDocumentId(documentId);
  if (!existing) return { ok: false, error: "Müşteri bulunamadı." };

  if (customerKey !== existing.customerKey) {
    const listed = await fetchCustomers();
    if (
      listed.ok &&
      listed.customers.some(
        (c) => c.customerKey === customerKey && c.documentId !== documentId
      )
    ) {
      return { ok: false, error: "Bu customerKey zaten kullanılıyor." };
    }
  }

  const res = await strapiApi(
    `/api/ledgeria-customers/${encodeURIComponent(documentId)}`,
    {
      method: "PUT",
      token,
      body: {
        data: {
          customerKey,
          displayName,
          notes: notesRaw || null,
          status,
        },
      },
    }
  );

  if (!res.ok) {
    return {
      ok: false,
      error: strapiErrorMessage(res.json, `Strapi ${res.status}`),
    };
  }

  revalidateLicensing();
  revalidatePath(`${CUSTOMERS_PATH}/${documentId}`);
  return { ok: true };
}

export async function updateEditionCapabilitiesFromForm(
  formData: FormData
): Promise<ActionResult> {
  const token = requireStrapiToken();
  if (!token) return { ok: false, error: "STRAPI_API_TOKEN eksik." };

  const documentId = String(formData.get("documentId") ?? "").trim();
  if (!documentId) return { ok: false, error: "documentId eksik." };

  const selected = LEDGERIA_CAPABILITIES.filter(
    (cap) => formData.get(`cap_${cap}`) === "on"
  );
  const capabilities = normalizeCapabilities(selected);
  const defaultUpdateChannel = String(
    formData.get("defaultUpdateChannel") ?? ""
  ).trim();
  const description = String(formData.get("description") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();

  const res = await strapiApi(
    `/api/ledgeria-editions/${encodeURIComponent(documentId)}`,
    {
      method: "PUT",
      token,
      body: {
        data: {
          ...(displayName ? { displayName } : {}),
          description: description || null,
          capabilities,
          defaultUpdateChannel: defaultUpdateChannel || null,
        },
      },
    }
  );

  if (!res.ok) {
    return {
      ok: false,
      error: strapiErrorMessage(res.json, `Strapi ${res.status}`),
    };
  }

  revalidateLicensing();
  revalidatePath(`${EDITIONS_PATH}/${documentId}`);
  return { ok: true };
}

export async function revokeLicenseFromForm(formData: FormData): Promise<void> {
  const token = requireStrapiToken();
  if (!token) return;

  const documentId = String(formData.get("documentId") ?? "").trim();
  if (!documentId) return;

  const res = await strapiApi(
    `/api/ledgeria-licenses/${encodeURIComponent(documentId)}`,
    {
      method: "PUT",
      token,
      body: { data: { revoked: true } },
    }
  );

  if (!res.ok) return;

  revalidateLicensing(documentId);
}

export async function deleteLicenseFromForm(
  formData: FormData
): Promise<ActionResult> {
  const token = requireStrapiToken();
  if (!token) return { ok: false, error: "STRAPI_API_TOKEN eksik." };

  const documentId = String(formData.get("documentId") ?? "").trim();
  if (!documentId) return { ok: false, error: "documentId eksik." };

  const res = await strapiApi(
    `/api/ledgeria-licenses/${encodeURIComponent(documentId)}`,
    { method: "DELETE", token }
  );

  if (!res.ok) {
    return {
      ok: false,
      error: strapiErrorMessage(res.json, `Strapi ${res.status}`),
    };
  }

  revalidateLicensing(documentId);
  return { ok: true };
}

export async function issueLicenseFromForm(
  formData: FormData
): Promise<IssueLicenseResult> {
  const token = requireStrapiToken();
  if (!token) return { ok: false, error: "STRAPI_API_TOKEN eksik." };

  const customerDocumentId = String(
    formData.get("customerDocumentId") ?? ""
  ).trim();
  const editionKey = String(formData.get("editionKey") ?? "").trim();
  const clientIdRaw = String(formData.get("clientId") ?? "").trim();
  const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const appName = String(formData.get("appName") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const primaryColor = String(formData.get("primaryColor") ?? "").trim();
  const brandPackVersion = String(formData.get("brandPackVersion") ?? "").trim();
  const updateChannelRaw = String(formData.get("updateChannel") ?? "").trim();
  const useCustomCaps = formData.get("useCustomCapabilities") === "on";
  const maxDevicesRaw = String(formData.get("maxDevices") ?? "").trim();
  const intent = String(formData.get("intent") ?? "download").trim();

  if (!customerDocumentId) {
    return { ok: false, error: "Müşteri seçin." };
  }

  const customer = await fetchCustomerByDocumentId(customerDocumentId);
  if (!customer) return { ok: false, error: "Müşteri bulunamadı." };
  if (customer.status === "suspended") {
    return { ok: false, error: "Askıdaki müşteriye lisans verilemez." };
  }

  const editionsResult = await fetchEditions();
  if (!editionsResult.ok) {
    return {
      ok: false,
      error: editionsResult.detail ?? "Yetki paketi listesi alınamadı.",
    };
  }

  const edition = editionsResult.editions.find((e) => e.editionKey === editionKey);
  if (!edition && !useCustomCaps && !editionKey) {
    return { ok: false, error: "Yetki paketi seçin veya özellik ağacından seçin." };
  }

  let capabilities = edition ? [...edition.capabilities] : [];
  if (useCustomCaps) {
    capabilities = normalizeCapabilities(
      LEDGERIA_CAPABILITIES.filter((cap) => formData.get(`cap_${cap}`) === "on")
    );
  } else {
    capabilities = normalizeCapabilities(capabilities);
  }
  if (capabilities.length === 0) {
    return { ok: false, error: "En az bir capability seçin." };
  }

  const maxDevices =
    maxDevicesRaw === ""
      ? null
      : Number.isFinite(Number(maxDevicesRaw)) && Number(maxDevicesRaw) > 0
        ? Math.floor(Number(maxDevicesRaw))
        : null;
  if (maxDevicesRaw && maxDevices == null) {
    return { ok: false, error: "Geçersiz maxDevices." };
  }

  const effectiveEdition = editionKey || edition?.editionKey || "custom";
  const updateChannel =
    updateChannelRaw ||
    `customers/${customer.customerKey}`;

  const expiresAt =
    expiresAtRaw === ""
      ? null
      : /^\d{4}-\d{2}-\d{2}$/.test(expiresAtRaw)
        ? new Date(
            Number(expiresAtRaw.slice(0, 4)),
            Number(expiresAtRaw.slice(5, 7)) - 1,
            Number(expiresAtRaw.slice(8, 10)),
            23,
            59,
            59,
            999
          ).toISOString()
        : Number.isNaN(Date.parse(expiresAtRaw))
          ? null
          : new Date(expiresAtRaw).toISOString();

  if (expiresAtRaw && !expiresAt) {
    return { ok: false, error: "Geçersiz expiresAt." };
  }

  const branding =
    appName || logoUrl || primaryColor || brandPackVersion
      ? {
          appName: appName || null,
          logoUrl: logoUrl || null,
          primaryColor: primaryColor || null,
          brandPackVersion: brandPackVersion || null,
        }
      : null;

  const licenseId = crypto.randomUUID();
  const issuedAt = new Date().toISOString();

  let signed;
  try {
    const { privateKeyPkcs8Base64, keyId } =
      await getLicenseSigningConfigAsync();
    signed = signLicenseClaims(
      {
        schemaVersion: LICENSE_SCHEMA_VERSION,
        licenseId,
        customerKey: customer.customerKey,
        clientId: clientIdRaw || null,
        edition: effectiveEdition,
        capabilities,
        branding,
        updateChannel,
        issuedAt,
        expiresAt,
        maxDevices,
        notes: notesRaw || null,
      },
      privateKeyPkcs8Base64,
      keyId
    );
    const publicKeySpkiBase64 =
      derivePublicSpkiFromPrivatePkcs8(privateKeyPkcs8Base64);
    if (!verifyLicenseSignature(signed, publicKeySpkiBase64)) {
      return {
        ok: false,
        error: "İmza üretildi ama public key ile doğrulanamadı.",
      };
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const signedLicenseJson = formatSignedLicenseJson(signed);

  const payload = {
    licenseId: signed.claims.licenseId,
    customer: customerDocumentId,
    customerKey: customer.customerKey,
    edition: signed.claims.edition,
    capabilities: signed.claims.capabilities,
    clientId: signed.claims.clientId,
    updateChannel: signed.claims.updateChannel,
    issuedAt: signed.claims.issuedAt,
    expiresAt: signed.claims.expiresAt,
    maxDevices: signed.claims.maxDevices,
    revoked: false,
    notes: signed.claims.notes,
    keyId: signed.keyId,
    signedLicenseJson,
    branding: signed.claims.branding,
  };

  let res = await strapiApi("/api/ledgeria-licenses", {
    method: "POST",
    token,
    body: { data: payload },
  });

  if (!res.ok && /maxDevices/i.test(strapiErrorMessage(res.json, ""))) {
    const { maxDevices: _omit, ...withoutMaxDevices } = payload;
    void _omit;
    res = await strapiApi("/api/ledgeria-licenses", {
      method: "POST",
      token,
      body: { data: withoutMaxDevices },
    });
  }

  if (!res.ok) {
    return {
      ok: false,
      error: strapiErrorMessage(res.json, `Strapi ${res.status}`),
    };
  }

  const created = flattenStrapiOne(res.json);
  const documentId =
    created && typeof created.documentId === "string"
      ? created.documentId
      : "";

  revalidateLicensing(documentId || undefined);

  if (intent === "save") {
    if (!documentId) {
      return {
        ok: false,
        error: "Lisans kaydedildi ama kayıt kimliği alınamadı.",
      };
    }
    redirect(`${LICENSES_PATH}/${documentId}`);
  }

  return {
    ok: true,
    licenseId,
    signedLicenseJson,
    filenameBase: `${customer.customerKey}-${licenseId.slice(0, 8)}`,
    documentId,
  };
}
