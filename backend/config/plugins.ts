import type { Core } from '@strapi/strapi';

/**
 * Keep Users & Permissions explicit so Cloud/subdirectory builds never rely on implicit defaults.
 * JWT for end-users (Content API / auth/local), not the admin panel secret.
 */
const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'),
    },
  },
});

export default config;
