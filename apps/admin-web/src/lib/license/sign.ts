import "server-only";

import { createPrivateKey, createPublicKey, sign, verify } from "node:crypto";

import { canonicalJson, normalizeLicenseClaims } from "./claims";
import { resolveLicenseSigningMaterial } from "./key-store";
import type { LicenseClaims, SignedLicense } from "./types";

/** Node-only. Never import from client components. */
export function signLicenseClaims(
  claims: LicenseClaims,
  privateKeyPkcs8Base64: string,
  keyId: string
): SignedLicense {
  const normalized = normalizeLicenseClaims(claims);
  const key = createPrivateKey({
    key: Buffer.from(privateKeyPkcs8Base64, "base64"),
    format: "der",
    type: "pkcs8",
  });
  const signature = sign(null, Buffer.from(canonicalJson(normalized), "utf8"), key);
  return {
    claims: normalized,
    signature: signature.toString("base64"),
    keyId: keyId.trim(),
  };
}

/** Same bytes as Ledgeria `@ledria/shared/license` `verifyLicenseSignature`. */
export function verifyLicenseSignature(
  license: SignedLicense,
  publicKeySpkiBase64: string
): boolean {
  try {
    const key = createPublicKey({
      key: Buffer.from(publicKeySpkiBase64, "base64"),
      format: "der",
      type: "spki",
    });
    const normalized = normalizeLicenseClaims(license.claims);
    return verify(
      null,
      Buffer.from(canonicalJson(normalized), "utf8"),
      key,
      Buffer.from(license.signature, "base64")
    );
  } catch {
    return false;
  }
}

/** Sync env-only helper (tests / callers that already have env). Prefer async resolve. */
export function getLicenseSigningConfig(): {
  privateKeyPkcs8Base64: string;
  keyId: string;
} {
  const privateKeyPkcs8Base64 =
    process.env.LEDGERIA_LICENSE_PRIVATE_KEY_PKCS8_B64?.trim() ?? "";
  if (!privateKeyPkcs8Base64) {
    throw new Error(
      "LEDGERIA_LICENSE_PRIVATE_KEY_PKCS8_B64 is not set — Ayarlar → Lisans anahtarları veya .env.local."
    );
  }
  const keyId = process.env.LEDGERIA_LICENSE_KEY_ID?.trim() || "dev";
  return { privateKeyPkcs8Base64, keyId };
}

export async function getLicenseSigningConfigAsync(): Promise<{
  privateKeyPkcs8Base64: string;
  keyId: string;
}> {
  const material = await resolveLicenseSigningMaterial();
  if (!material) {
    throw new Error(
      "Lisans imzalama anahtarı yok. Ayarlar → Lisans anahtarları’ndan üretin veya LEDGERIA_LICENSE_PRIVATE_KEY_PKCS8_B64 ayarlayın."
    );
  }
  return {
    privateKeyPkcs8Base64: material.privateKeyPkcs8Base64,
    keyId: material.keyId,
  };
}
