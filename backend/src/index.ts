import type { Core } from '@strapi/strapi';

import { registerAdminInviteRoute } from './admin-auth/invite-register-route';
import { registerLedgeriaIssueIngestion } from './ledgeria/issue-ingestion';
import { seedLedgeriaEditions } from './ledgeria/seed-editions';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    registerLedgeriaIssueIngestion(strapi);
    registerAdminInviteRoute(strapi);
    try {
      await seedLedgeriaEditions(strapi);
    } catch (err) {
      strapi.log.warn(
        `[ledgeria] edition seed skipped: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  },
};
