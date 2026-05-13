/**
 * ledgeria-issue router — default Strapi REST lives under /api/ledgeria-issues (keep Public role closed for this type).
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::ledgeria-issue.ledgeria-issue');
