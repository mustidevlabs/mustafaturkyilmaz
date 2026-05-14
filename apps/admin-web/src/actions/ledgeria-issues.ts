"use server";

import { revalidatePath } from "next/cache";
import { getStrapiPublicUrl } from "@/lib/strapi-public-url";
import { strapiAuthHeaders } from "@/lib/strapi-admin-headers";
import { strapiHttpsRequest } from "@/lib/strapi-node-https";
import {
  isLedgeriaIssueStatus,
  type LedgeriaIssueStatus,
} from "@/lib/ledgeria-issues-shared";

const ISSUES_PATH = "/ledgeria/issues";

async function putLedgeriaIssueStatus(
  documentId: string,
  status: LedgeriaIssueStatus
): Promise<boolean> {
  const token = process.env.STRAPI_API_TOKEN?.trim();
  if (!token) return false;

  const STRAPI_URL = getStrapiPublicUrl();
  const body = JSON.stringify({ data: { status } });
  let res: { statusCode: number; body: string };
  try {
    res = await strapiHttpsRequest({
      url: `${STRAPI_URL}/api/ledgeria-issues/${encodeURIComponent(documentId)}`,
      method: "PUT",
      headers: {
        ...strapiAuthHeaders(token),
        "Content-Type": "application/json",
        "Content-Length": String(Buffer.byteLength(body, "utf8")),
      },
      body,
    });
  } catch {
    return false;
  }

  return res.statusCode >= 200 && res.statusCode < 300;
}

/** Programmatic status update (e.g. board drag-and-drop). */
export async function updateLedgeriaIssueStatusAction(
  documentId: string,
  status: string
): Promise<{ ok: boolean }> {
  const id = String(documentId ?? "").trim();
  if (!id || !isLedgeriaIssueStatus(status)) return { ok: false };
  const ok = await putLedgeriaIssueStatus(id, status);
  if (ok) revalidatePath(ISSUES_PATH);
  return { ok };
}

export async function updateLedgeriaIssueFromForm(formData: FormData): Promise<void> {
  const documentId = String(formData.get("documentId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!documentId || !isLedgeriaIssueStatus(status)) return;

  const ok = await putLedgeriaIssueStatus(documentId, status);
  if (ok) revalidatePath(ISSUES_PATH);
}

export async function deleteLedgeriaIssueFromForm(formData: FormData): Promise<void> {
  const token = process.env.STRAPI_API_TOKEN?.trim();
  if (!token) return;

  const documentId = String(formData.get("documentId") ?? "").trim();
  if (!documentId) return;

  const STRAPI_URL = getStrapiPublicUrl();
  let res: { statusCode: number; body: string };
  try {
    res = await strapiHttpsRequest({
      url: `${STRAPI_URL}/api/ledgeria-issues/${encodeURIComponent(documentId)}`,
      method: "DELETE",
      headers: strapiAuthHeaders(token),
    });
  } catch {
    return;
  }

  if (res.statusCode < 200 || res.statusCode >= 300) return;

  revalidatePath(ISSUES_PATH);
}
