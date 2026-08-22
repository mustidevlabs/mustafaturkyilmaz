import { NextResponse } from "next/server";

import {
  dummyPasswordCheck,
  downloadPasswordLookup,
  verifyDownloadPassword,
} from "@/lib/license/download-password";
import { licenseDownloadAllowed } from "@/lib/license/download-rate-limit";
import { allocateLicenseSeat } from "@/lib/license/license-seats";
import {
  formatSignedLicenseJson,
  tryParseSignedLicenseJson,
} from "@/lib/license/claims";
import {
  getLicenseSigningConfigAsync,
  signLicenseClaims,
} from "@/lib/license/sign";
import {
  fetchCustomerByDownloadLookup,
  fetchLatestActiveLicenseForCustomer,
  updateCustomerOccupiedClientIds,
} from "@/lib/ledgeria-licensing";

export const runtime = "nodejs";

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: Request) {
  if (!licenseDownloadAllowed(clientIp(request))) {
    return jsonError(401, "unauthorized");
  }

  let password = "";
  let customerKey = "";
  let clientId = "";
  try {
    const body = (await request.json()) as Record<string, unknown>;
    password = typeof body.password === "string" ? body.password : "";
    customerKey =
      typeof body.customerKey === "string" ? body.customerKey.trim() : "";
    clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
  } catch {
    return jsonError(401, "unauthorized");
  }

  if (!password.trim()) {
    await dummyPasswordCheck("missing");
    return jsonError(401, "unauthorized");
  }

  const customer = await fetchCustomerByDownloadLookup(
    downloadPasswordLookup(password)
  );
  if (!customer) {
    await dummyPasswordCheck(password);
    return jsonError(401, "unauthorized");
  }

  const matches = await verifyDownloadPassword(
    password,
    customer.downloadPasswordHash
  );
  if (!matches) return jsonError(401, "unauthorized");
  if (customer.status === "suspended") return jsonError(401, "unauthorized");
  if (customerKey && customerKey !== customer.customerKey) {
    return jsonError(401, "unauthorized");
  }

  const license = await fetchLatestActiveLicenseForCustomer(customer.documentId);
  if (!license) return jsonError(404, "not_found");

  const parsed = tryParseSignedLicenseJson(license.signedLicenseJson);
  if (!parsed) return jsonError(500, "malformed");

  const maxDevices = parsed.claims.maxDevices ?? license.maxDevices;
  if (parsed.claims.clientId && clientId && parsed.claims.clientId !== clientId) {
    return jsonError(401, "unauthorized");
  }

  let signed = parsed;
  if (maxDevices != null && maxDevices > 0) {
    const seat = allocateLicenseSeat(
      customer.occupiedClientIds,
      maxDevices,
      clientId
    );
    if (!seat.ok) {
      if (seat.code === "device_limit") return jsonError(409, "device_limit");
      return jsonError(401, "unauthorized");
    }
    if (!seat.reused) {
      await updateCustomerOccupiedClientIds(customer.documentId, seat.clientIds);
    }
    if (!parsed.claims.clientId && clientId) {
      try {
        const { privateKeyPkcs8Base64, keyId } =
          await getLicenseSigningConfigAsync();
        signed = signLicenseClaims(
          { ...parsed.claims, clientId },
          privateKeyPkcs8Base64,
          keyId
        );
      } catch {
        signed = parsed;
      }
    }
  } else if (clientId && !parsed.claims.clientId) {
    try {
      const { privateKeyPkcs8Base64, keyId } =
        await getLicenseSigningConfigAsync();
      signed = signLicenseClaims(
        { ...parsed.claims, clientId },
        privateKeyPkcs8Base64,
        keyId
      );
    } catch {
      signed = parsed;
    }
  }

  return new NextResponse(formatSignedLicenseJson(signed), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
