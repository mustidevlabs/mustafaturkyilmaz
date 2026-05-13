/**
 * ledgeria-issue controller — REST not exposed publicly; ingestion uses POST /ledgeria/v1/issues in src/index.ts
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::ledgeria-issue.ledgeria-issue');
