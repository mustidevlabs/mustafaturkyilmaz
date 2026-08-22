export type AllocateLicenseSeatResult =
  | { ok: true; clientIds: string[]; reused: boolean }
  | { ok: false; code: "device_limit" | "missing_client_id" };

function normalizeId(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Same contract as Ledgeria `allocateLicenseSeat`. */
export function allocateLicenseSeat(
  occupiedClientIds: readonly string[],
  maxDevices: number | null | undefined,
  clientId: string | null | undefined
): AllocateLicenseSeatResult {
  const id = normalizeId(clientId);
  if (!id) return { ok: false, code: "missing_client_id" };

  const occupied = [
    ...new Set(
      occupiedClientIds.map((item) => normalizeId(item)).filter(Boolean)
    ),
  ];
  if (occupied.includes(id)) {
    return { ok: true, clientIds: occupied, reused: true };
  }

  const cap =
    maxDevices == null || maxDevices <= 0
      ? Number.POSITIVE_INFINITY
      : Math.floor(maxDevices);
  if (occupied.length >= cap) {
    return { ok: false, code: "device_limit" };
  }
  return { ok: true, clientIds: [...occupied, id], reused: false };
}

export function parseOccupiedClientIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ];
}
