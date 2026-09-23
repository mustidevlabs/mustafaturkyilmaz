# Ledgeria in this monorepo

**Ledgeria** product code and admin have moved to the **Mustidev** monorepo. This folder keeps cross-repo notes and licensing docs.

| Area | Path |
|------|------|
| Strapi API (issues, licensing) | `mustidev/apps/ledgeria-api` |
| Admin dashboard | `mustidev/apps/dashboard` (port **3002**) |
| Public portfolio | `apps/portfolio-web/` (this repo) |
| Portfolio CMS Strapi | `backend/` (this repo) |

### Licensing

Dashboard signs `SignedLicense` JSON (Ed25519) for the desktop app. Strapi stores customers, editions, and license history. Keys: UI at `/ledgeria/settings/license-keys` or env in `mustidev/apps/dashboard/.env.local`.

See [`CUSTOMER-LICENSING.md`](./CUSTOMER-LICENSING.md) and `mustidev/apps/dashboard/README.md`.
