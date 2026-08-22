/**
 * Node-only license signing key persistence.
 * Private material never ships to the browser bundle.
 */
import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  randomBytes,
} from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

/** Embedded Ledgeria `dev` keypair (local demo only). */
export const DEV_LICENSE_PRIVATE_KEY_PKCS8_B64 =
  "MC4CAQAwBQYDK2VwBCIEIOGRLuq+lKQJDytmiA9rz8Rsilv4Bw886jXC9Gh/Hoq4";
export const DEV_LICENSE_PUBLIC_KEY_SPKI_B64 =
  "MCowBQYDK2VwAyEAmMiMHsX2ALjmgn7NQZCDgtbEbPpDoIYCQlgVRDRDRAg=";
export const DEV_LICENSE_KEY_ID = "dev";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(STORE_DIR, "license-signing.json");

export type StoredSigningKeyMeta = {
  keyId: string;
  publicKeySpkiBase64: string;
  source: "env" | "store" | "dev";
  revealedOnce: boolean;
  createdAt: string;
  /** True when env private key is set (store cannot override). */
  envOverrides: boolean;
};

type EncryptedStoreFile = {
  v: 1;
  keyId: string;
  publicKeySpkiBase64: string;
  /** AES-256-GCM ciphertext of PKCS8 DER base64 utf8. */
  ciphertextB64: string;
  ivB64: string;
  tagB64: string;
  revealedOnce: boolean;
  createdAt: string;
  useDevKey?: boolean;
};

function resolveStoreSecret(): Buffer {
  const raw =
    process.env.LEDGERIA_LICENSE_KEY_STORE_SECRET?.trim() ||
    process.env.STRAPI_API_TOKEN?.trim() ||
    "ledgeria-admin-local-dev-key-store";
  return createHash("sha256").update(raw, "utf8").digest();
}

function encryptPrivate(plainPkcs8B64: string): {
  ciphertextB64: string;
  ivB64: string;
  tagB64: string;
} {
  const key = resolveStoreSecret();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([
    cipher.update(plainPkcs8B64, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    ciphertextB64: enc.toString("base64"),
    ivB64: iv.toString("base64"),
    tagB64: tag.toString("base64"),
  };
}

function decryptPrivate(file: EncryptedStoreFile): string {
  const key = resolveStoreSecret();
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(file.ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(file.tagB64, "base64"));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(file.ciphertextB64, "base64")),
    decipher.final(),
  ]);
  return plain.toString("utf8");
}

async function readStoreFile(): Promise<EncryptedStoreFile | null> {
  try {
    const raw = await readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as EncryptedStoreFile;
    if (parsed?.v !== 1 || !parsed.keyId || !parsed.publicKeySpkiBase64) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function writeStoreFile(file: EncryptedStoreFile): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(STORE_FILE, JSON.stringify(file, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
}

export function derivePublicSpkiFromPrivatePkcs8(
  privateKeyPkcs8Base64: string
): string {
  const privateKey = createPrivateKey({
    key: Buffer.from(privateKeyPkcs8Base64, "base64"),
    format: "der",
    type: "pkcs8",
  });
  const publicKey = createPublicKey(privateKey);
  return publicKey.export({ type: "spki", format: "der" }).toString("base64");
}

export function generateEd25519LicenseKeyPair(keyId: string): {
  keyId: string;
  privateKeyPkcs8Base64: string;
  publicKeySpkiBase64: string;
} {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  return {
    keyId: keyId.trim() || `k-${Date.now().toString(36)}`,
    privateKeyPkcs8Base64: privateKey
      .export({ type: "pkcs8", format: "der" })
      .toString("base64"),
    publicKeySpkiBase64: publicKey
      .export({ type: "spki", format: "der" })
      .toString("base64"),
  };
}

export type LicenseSigningMaterial = {
  privateKeyPkcs8Base64: string;
  keyId: string;
  publicKeySpkiBase64: string;
  source: "env" | "store" | "dev";
};

/** Resolve signing material: env wins, then encrypted store (incl. saved dev). */
export async function resolveLicenseSigningMaterial(): Promise<LicenseSigningMaterial | null> {
  const envPrivate = process.env.LEDGERIA_LICENSE_PRIVATE_KEY_PKCS8_B64?.trim();
  if (envPrivate) {
    const keyId = process.env.LEDGERIA_LICENSE_KEY_ID?.trim() || "dev";
    let publicKeySpkiBase64 = "";
    try {
      publicKeySpkiBase64 = derivePublicSpkiFromPrivatePkcs8(envPrivate);
    } catch {
      publicKeySpkiBase64 = "";
    }
    return {
      privateKeyPkcs8Base64: envPrivate,
      keyId,
      publicKeySpkiBase64,
      source: "env",
    };
  }

  const store = await readStoreFile();
  if (!store) return null;

  if (store.useDevKey) {
    return {
      privateKeyPkcs8Base64: DEV_LICENSE_PRIVATE_KEY_PKCS8_B64,
      keyId: DEV_LICENSE_KEY_ID,
      publicKeySpkiBase64: DEV_LICENSE_PUBLIC_KEY_SPKI_B64,
      source: "dev",
    };
  }

  try {
    const privateKeyPkcs8Base64 = decryptPrivate(store);
    return {
      privateKeyPkcs8Base64,
      keyId: store.keyId,
      publicKeySpkiBase64: store.publicKeySpkiBase64,
      source: "store",
    };
  } catch {
    return null;
  }
}

export async function getSigningKeyMeta(): Promise<StoredSigningKeyMeta | null> {
  const material = await resolveLicenseSigningMaterial();
  if (!material) return null;

  const store = await readStoreFile();
  const envOverrides = Boolean(
    process.env.LEDGERIA_LICENSE_PRIVATE_KEY_PKCS8_B64?.trim()
  );

  return {
    keyId: material.keyId,
    publicKeySpkiBase64: material.publicKeySpkiBase64,
    source: material.source,
    revealedOnce: store?.revealedOnce ?? true,
    createdAt: store?.createdAt ?? "",
    envOverrides,
  };
}

export type PersistGeneratedKeyResult = {
  keyId: string;
  privateKeyPkcs8Base64: string;
  publicKeySpkiBase64: string;
  envSnippet: string;
  ledgeriaPasteBlock: string;
};

export async function persistGeneratedKeyPair(opts: {
  keyId: string;
  privateKeyPkcs8Base64: string;
  publicKeySpkiBase64: string;
}): Promise<PersistGeneratedKeyResult> {
  const { keyId, privateKeyPkcs8Base64, publicKeySpkiBase64 } = opts;
  const enc = encryptPrivate(privateKeyPkcs8Base64);
  const createdAt = new Date().toISOString();
  await writeStoreFile({
    v: 1,
    keyId,
    publicKeySpkiBase64,
    ...enc,
    revealedOnce: false,
    createdAt,
    useDevKey: false,
  });

  return {
    keyId,
    privateKeyPkcs8Base64,
    publicKeySpkiBase64,
    envSnippet: [
      `# Ledgeria license signing — keep private; never commit`,
      `LEDGERIA_LICENSE_PRIVATE_KEY_PKCS8_B64=${privateKeyPkcs8Base64}`,
      `LEDGERIA_LICENSE_KEY_ID=${keyId}`,
    ].join("\n"),
    ledgeriaPasteBlock: buildLedgeriaPasteBlock(keyId, publicKeySpkiBase64),
  };
}

export async function persistEmbeddedDevKey(): Promise<void> {
  const enc = encryptPrivate(DEV_LICENSE_PRIVATE_KEY_PKCS8_B64);
  await writeStoreFile({
    v: 1,
    keyId: DEV_LICENSE_KEY_ID,
    publicKeySpkiBase64: DEV_LICENSE_PUBLIC_KEY_SPKI_B64,
    ...enc,
    revealedOnce: true,
    createdAt: new Date().toISOString(),
    useDevKey: true,
  });
}

export async function markPrivateKeyRevealDismissed(): Promise<void> {
  const store = await readStoreFile();
  if (!store) return;
  await writeStoreFile({ ...store, revealedOnce: true });
}

export async function clearStoredSigningKey(): Promise<void> {
  try {
    await unlink(STORE_FILE);
  } catch {
    /* missing is fine */
  }
}

export function buildLedgeriaPasteBlock(
  keyId: string,
  publicKeySpkiBase64: string,
  developmentOnly = false
): string {
  return [
    `{`,
    `  keyId: "${keyId}",`,
    developmentOnly ? `  developmentOnly: true,` : null,
    `  publicKeySpkiBase64:`,
    `    "${publicKeySpkiBase64}",`,
    `},`,
  ]
    .filter(Boolean)
    .join("\n");
}
