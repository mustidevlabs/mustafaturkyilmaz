"use server";

import { revalidatePath } from "next/cache";
import { getStrapiPublicUrl } from "@/lib/strapi-public-url";
import { strapiAuthHeaders } from "@/lib/strapi-admin-headers";
import { strapiHttpsRequest } from "@/lib/strapi-node-https";
import { isLedgeriaIssueStatus } from "@/lib/ledgeria-issues-shared";

export async function updateLedgeriaIssueFromForm(formData: FormData): Promise<void> {
  const token = process.env.STRAPI_API_TOKEN?.trim();
  if (!token) return;

  const documentId = String(formData.get("documentId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!documentId || !isLedgeriaIssueStatus(status)) return;

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
    return;
  }

  if (res.statusCode < 200 || res.statusCode >= 300) return;

  revalidatePath("/");
}
