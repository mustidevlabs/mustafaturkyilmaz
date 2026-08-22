"use server";

import { revalidatePath } from "next/cache";

import {
  clearStoredSigningKey,
  generateEd25519LicenseKeyPair,
  getSigningKeyMeta,
  markPrivateKeyRevealDismissed,
  persistEmbeddedDevKey,
  persistGeneratedKeyPair,
  type PersistGeneratedKeyResult,
  type StoredSigningKeyMeta,
} from "@/lib/license/key-store";

const SETTINGS_PATH = "/ledgeria/settings/license-keys";

export type KeyActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type GenerateKeyActionResult =
  | ({ ok: true } & PersistGeneratedKeyResult)
  | { ok: false; error: string };

export async function fetchSigningKeyStatus(): Promise<StoredSigningKeyMeta | null> {
  return getSigningKeyMeta();
}

export async function generateLicenseKeyPairAction(
  formData: FormData
): Promise<GenerateKeyActionResult> {
  const meta = await getSigningKeyMeta();
  if (meta?.envOverrides) {
    return {
      ok: false,
      error:
        "Ortam değişkeninde (LEDGERIA_LICENSE_PRIVATE_KEY_PKCS8_B64) anahtar var. Önce env’i kaldırın veya rotate için env’i değiştirin.",
    };
  }
  if (meta && formData.get("forceRotate") !== "on") {
    return {
      ok: false,
      error: "Anahtar zaten kurulu. Döndürmek için çift onaylı rotate kullanın.",
    };
  }
  if (meta && formData.get("confirmRotate") !== "on") {
    return {
      ok: false,
      error: "Rotate için onay kutusunu işaretleyin.",
    };
  }

  const keyIdRaw = String(formData.get("keyId") ?? "").trim();
  const keyId =
    keyIdRaw ||
    `prod-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;

  try {
    const pair = generateEd25519LicenseKeyPair(keyId);
    const saved = await persistGeneratedKeyPair(pair);
    revalidatePath(SETTINGS_PATH);
    revalidatePath("/ledgeria/licenses/issue");
    return { ok: true, ...saved };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function dismissPrivateKeyRevealAction(): Promise<KeyActionResult> {
  try {
    await markPrivateKeyRevealDismissed();
    revalidatePath(SETTINGS_PATH);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function enableEmbeddedDevKeyAction(): Promise<KeyActionResult> {
  const meta = await getSigningKeyMeta();
  if (meta?.envOverrides) {
    return {
      ok: false,
      error: "Env anahtarı tanımlı; gömülü dev key kullanılamaz.",
    };
  }
  try {
    await persistEmbeddedDevKey();
    revalidatePath(SETTINGS_PATH);
    revalidatePath("/ledgeria/licenses/issue");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function clearStoredSigningKeyAction(
  formData: FormData
): Promise<KeyActionResult> {
  if (formData.get("confirmClear") !== "on") {
    return { ok: false, error: "Temizlemek için onay gerekli." };
  }
  const meta = await getSigningKeyMeta();
  if (meta?.envOverrides) {
    return {
      ok: false,
      error: "Env anahtarı var; yalnızca .env.local üzerinden kaldırılır.",
    };
  }
  try {
    await clearStoredSigningKey();
    revalidatePath(SETTINGS_PATH);
    revalidatePath("/ledgeria/licenses/issue");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
