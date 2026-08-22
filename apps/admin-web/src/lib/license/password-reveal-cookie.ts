import "server-only";

import { cookies } from "next/headers";

export const DOWNLOAD_PASSWORD_REVEAL_COOKIE = "ledgeria-download-pw-reveal";

type RevealPayload = { d: string; p: string };

export async function setDownloadPasswordReveal(
  documentId: string,
  password: string
): Promise<void> {
  const jar = await cookies();
  const payload: RevealPayload = { d: documentId, p: password };
  jar.set(DOWNLOAD_PASSWORD_REVEAL_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/ledgeria/customers",
    maxAge: 10 * 60,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function readDownloadPasswordReveal(
  documentId: string
): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(DOWNLOAD_PASSWORD_REVEAL_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RevealPayload;
    if (parsed.d !== documentId || typeof parsed.p !== "string") return null;
    return parsed.p;
  } catch {
    return null;
  }
}
