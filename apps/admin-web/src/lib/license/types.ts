import type { LedgeriaCapabilityId } from "./capability";

export const LICENSE_SCHEMA_VERSION = 1 as const;

export type LicenseBranding = {
  appName?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  brandPackVersion?: string | null;
};

export type LicenseClaims = {
  schemaVersion: typeof LICENSE_SCHEMA_VERSION;
  licenseId: string;
  customerKey: string;
  clientId?: string | null;
  edition: string;
  capabilities: LedgeriaCapabilityId[];
  branding?: LicenseBranding | null;
  updateChannel?: string | null;
  issuedAt: string;
  expiresAt?: string | null;
  maxDevices?: number | null;
  notes?: string | null;
};

export type SignedLicense = {
  claims: LicenseClaims;
  signature: string;
  keyId: string;
};
