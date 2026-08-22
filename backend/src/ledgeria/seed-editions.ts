/** Mirrors Ledgeria desktop `editions/*.json` — seed on bootstrap if missing. */
import type { Core } from '@strapi/strapi';

const EDITION_UID = 'api::ledgeria-edition.ledgeria-edition' as const;

const SEED_EDITIONS = [
  {
    editionKey: 'ngo-full',
    displayName: 'NGO Full',
    description:
      'Full association / foundation feature set (modules + common nested features).',
    capabilities: [
      'accounts',
      'accounts.export',
      'transactions',
      'transactions.recurring',
      'transactions.export',
      'payments',
      'payments.export',
      'pledges',
      'pledges.installments',
      'pledges.recurring',
      'pledges.export',
      'assessments',
      'assessments.export',
      'budgets',
      'budgets.export',
      'projects',
      'events',
      'departments',
      'users',
      'settings',
      'sync',
      'sync.field-kit',
      'audit',
      'dynamic-pages',
      'dynamic-pages.finance-plugin',
      'page-editor',
      'field-kit',
    ],
    defaultUpdateChannel: 'editions/ngo-full',
  },
  {
    editionKey: 'municipality-lite',
    displayName: 'Municipality Lite',
    description: 'Lean edition without pledges/assessments/page editor.',
    capabilities: [
      'accounts',
      'transactions',
      'payments',
      'budgets',
      'projects',
      'events',
      'departments',
      'users',
      'settings',
      'sync',
      'audit',
      'field-kit',
    ],
    defaultUpdateChannel: 'editions/municipality-lite',
  },
] as const;

function looksLikeLegacyModuleOnly(capabilities: unknown): boolean {
  if (!Array.isArray(capabilities)) return false;
  const caps = capabilities.filter((c): c is string => typeof c === 'string');
  if (caps.length === 0) return false;
  return caps.every((c) => !c.includes('.'));
}

export async function seedLedgeriaEditions(strapi: Core.Strapi): Promise<void> {
  for (const edition of SEED_EDITIONS) {
    const existing = await strapi.db.query(EDITION_UID).findOne({
      where: { editionKey: edition.editionKey },
    });

    if (existing) {
      // One-time migrate: old seeds were module-only (no nested feature ids).
      if (
        edition.editionKey === 'ngo-full' &&
        looksLikeLegacyModuleOnly(existing.capabilities)
      ) {
        const documentId = String(
          (existing as { documentId?: string }).documentId ?? '',
        );
        if (!documentId) {
          strapi.log.warn(
            `[ledgeria] skip migrate ${edition.editionKey}: missing documentId`,
          );
          continue;
        }
        await strapi.documents(EDITION_UID).update({
          documentId,
          data: {
            description: edition.description,
            capabilities: [...edition.capabilities],
          },
        });
        strapi.log.info(
          `[ledgeria] migrated edition ${edition.editionKey} capabilities (nested features)`,
        );
      }
      continue;
    }

    await strapi.documents(EDITION_UID).create({
      data: {
        editionKey: edition.editionKey,
        displayName: edition.displayName,
        description: edition.description,
        capabilities: [...edition.capabilities],
        defaultUpdateChannel: edition.defaultUpdateChannel,
      },
    });
    strapi.log.info(`[ledgeria] seeded edition ${edition.editionKey}`);
  }
}
