/**
 * Mirrored from Ledgeria desktop `packages/shared/src/types/capability.ts`
 * (`LEDGERIA_CAPABILITY_CATALOG` / `listCapabilityCatalogEntries`).
 * Keep ids byte-stable — they are persisted inside signed licenses.
 */

export type LedgeriaCapabilityKind = "module" | "feature";

export type LedgeriaCapabilityNode = {
  id: string;
  /** TR label for admin / docs. */
  labelTr: string;
  /** EN label for admin / docs. */
  labelEn: string;
  kind: LedgeriaCapabilityKind;
  children?: readonly LedgeriaCapabilityNode[];
};

/**
 * Canonical catalog for admin checkbox UI and desktop validation.
 */
export const LEDGERIA_CAPABILITY_CATALOG: readonly LedgeriaCapabilityNode[] = [
  {
    id: "accounts",
    labelTr: "Hesaplar",
    labelEn: "Accounts",
    kind: "module",
    children: [
      {
        id: "accounts.export",
        labelTr: "Hesap dışa aktarım",
        labelEn: "Account export",
        kind: "feature",
      },
    ],
  },
  {
    id: "transactions",
    labelTr: "İşlemler",
    labelEn: "Transactions",
    kind: "module",
    children: [
      {
        id: "transactions.recurring",
        labelTr: "Tekrarlayan işlemler",
        labelEn: "Recurring transactions",
        kind: "feature",
      },
      {
        id: "transactions.export",
        labelTr: "İşlem dışa aktarım",
        labelEn: "Transaction export",
        kind: "feature",
      },
    ],
  },
  {
    id: "payments",
    labelTr: "Ödemeler",
    labelEn: "Payments",
    kind: "module",
    children: [
      {
        id: "payments.export",
        labelTr: "Ödeme dışa aktarım",
        labelEn: "Payment export",
        kind: "feature",
      },
    ],
  },
  {
    id: "pledges",
    labelTr: "Taahhütler",
    labelEn: "Pledges",
    kind: "module",
    children: [
      {
        id: "pledges.installments",
        labelTr: "Taksitler",
        labelEn: "Installments",
        kind: "feature",
      },
      {
        id: "pledges.recurring",
        labelTr: "Tekrarlayan taahhütler",
        labelEn: "Recurring pledges",
        kind: "feature",
      },
      {
        id: "pledges.export",
        labelTr: "Taahhüt dışa aktarım",
        labelEn: "Pledge export",
        kind: "feature",
      },
    ],
  },
  {
    id: "assessments",
    labelTr: "Tahakkuklar",
    labelEn: "Assessments",
    kind: "module",
    children: [
      {
        id: "assessments.export",
        labelTr: "Tahakkuk dışa aktarım",
        labelEn: "Assessment export",
        kind: "feature",
      },
    ],
  },
  {
    id: "budgets",
    labelTr: "Bütçeler",
    labelEn: "Budgets",
    kind: "module",
    children: [
      {
        id: "budgets.export",
        labelTr: "Bütçe dışa aktarım",
        labelEn: "Budget export",
        kind: "feature",
      },
    ],
  },
  {
    id: "projects",
    labelTr: "Projeler",
    labelEn: "Projects",
    kind: "module",
  },
  {
    id: "events",
    labelTr: "Etkinlikler",
    labelEn: "Events",
    kind: "module",
  },
  {
    id: "departments",
    labelTr: "Üniteler",
    labelEn: "Departments",
    kind: "module",
  },
  {
    id: "users",
    labelTr: "Kullanıcılar",
    labelEn: "Users",
    kind: "module",
  },
  {
    id: "settings",
    labelTr: "Ayarlar",
    labelEn: "Settings",
    kind: "module",
  },
  {
    id: "sync",
    labelTr: "Senkronizasyon",
    labelEn: "Sync",
    kind: "module",
    children: [
      {
        id: "sync.field-kit",
        labelTr: "Field kit hazırlama",
        labelEn: "Prepare field kit",
        kind: "feature",
      },
    ],
  },
  {
    id: "audit",
    labelTr: "Denetim günlüğü",
    labelEn: "Audit log",
    kind: "module",
  },
  {
    id: "dynamic-pages",
    labelTr: "Dinamik sayfalar",
    labelEn: "Dynamic pages",
    kind: "module",
    children: [
      {
        id: "dynamic-pages.finance-plugin",
        labelTr: "Sayfa finans eklentisi",
        labelEn: "Page finance plugin",
        kind: "feature",
      },
    ],
  },
  {
    id: "page-editor",
    labelTr: "Sayfa editörü",
    labelEn: "Page editor",
    kind: "module",
  },
  {
    id: "field-kit",
    labelTr: "Field kit (kurulum rolü)",
    labelEn: "Field kit install role",
    kind: "module",
  },
] as const;

function flattenCatalog(nodes: readonly LedgeriaCapabilityNode[]): string[] {
  const out: string[] = [];
  for (const node of nodes) {
    out.push(node.id);
    if (node.children?.length) {
      out.push(...flattenCatalog(node.children));
    }
  }
  return out;
}

/** Flat list of every catalog id (modules + features). */
export const LEDGERIA_CAPABILITIES: readonly string[] = flattenCatalog(
  LEDGERIA_CAPABILITY_CATALOG
);

/** Capability id from the catalog (module or nested feature). */
export type LedgeriaCapabilityId = string;
/** @deprecated prefer LedgeriaCapabilityId */
export type LedgeriaCapability = LedgeriaCapabilityId;

export const LEDGERIA_CAPABILITY_SET = new Set<string>(LEDGERIA_CAPABILITIES);

export function isLedgeriaCapability(
  value: string
): value is LedgeriaCapabilityId {
  return LEDGERIA_CAPABILITY_SET.has(value);
}

/** Parent module id for a nested feature (`pledges.installments` → `pledges`). */
export function parentCapabilityId(id: string): LedgeriaCapabilityId | null {
  const dot = id.indexOf(".");
  if (dot <= 0) return null;
  const parent = id.slice(0, dot);
  return isLedgeriaCapability(parent) ? parent : null;
}

/** When a child is granted, ensure its parent module is also present. */
export function ensureParentCapabilities(
  ids: readonly LedgeriaCapabilityId[]
): LedgeriaCapabilityId[] {
  const out: LedgeriaCapabilityId[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    const parent = parentCapabilityId(id);
    if (parent && !seen.has(parent)) {
      seen.add(parent);
      out.push(parent);
    }
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

export function normalizeCapabilities(input: unknown): LedgeriaCapabilityId[] {
  if (!Array.isArray(input)) return [];
  const raw: LedgeriaCapabilityId[] = [];
  for (const item of input) {
    if (typeof item !== "string") continue;
    const id = item.trim();
    if (!isLedgeriaCapability(id)) continue;
    if (!raw.includes(id)) raw.push(id);
  }
  return ensureParentCapabilities(raw);
}

/** Flat catalog rows for admin checkbox trees. */
export function listCapabilityCatalogEntries(): Array<{
  id: LedgeriaCapabilityId;
  parentId: LedgeriaCapabilityId | null;
  kind: LedgeriaCapabilityKind;
  labelTr: string;
  labelEn: string;
}> {
  const out: Array<{
    id: LedgeriaCapabilityId;
    parentId: LedgeriaCapabilityId | null;
    kind: LedgeriaCapabilityKind;
    labelTr: string;
    labelEn: string;
  }> = [];

  const walk = (
    nodes: readonly LedgeriaCapabilityNode[],
    parentId: LedgeriaCapabilityId | null
  ) => {
    for (const node of nodes) {
      const id = node.id as LedgeriaCapabilityId;
      out.push({
        id,
        parentId,
        kind: node.kind,
        labelTr: node.labelTr,
        labelEn: node.labelEn,
      });
      if (node.children?.length) walk(node.children, id);
    }
  };
  walk(LEDGERIA_CAPABILITY_CATALOG, null);
  return out;
}

/** All module-level capability ids (no dots). */
export function listModuleCapabilityIds(): LedgeriaCapabilityId[] {
  return LEDGERIA_CAPABILITY_CATALOG.map((n) => n.id as LedgeriaCapabilityId);
}

/** Toggle helpers for the admin checkbox tree (client + server safe). */
export function applyCapabilityToggle(
  current: readonly string[],
  id: string,
  checked: boolean
): LedgeriaCapabilityId[] {
  const node = findCatalogNode(id);
  if (!node) return normalizeCapabilities(current);

  const set = new Set(current);
  if (checked) {
    set.add(id);
    const parent = parentCapabilityId(id);
    if (parent) set.add(parent);
  } else {
    set.delete(id);
    if (node.children?.length) {
      for (const child of flattenCatalog(node.children)) {
        set.delete(child);
      }
    }
  }
  return normalizeCapabilities([...set]);
}

function findCatalogNode(
  id: string,
  nodes: readonly LedgeriaCapabilityNode[] = LEDGERIA_CAPABILITY_CATALOG
): LedgeriaCapabilityNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findCatalogNode(id, node.children);
      if (found) return found;
    }
  }
  return null;
}

export function capabilityLabelTr(id: string): string {
  return findCatalogNode(id)?.labelTr ?? id;
}
