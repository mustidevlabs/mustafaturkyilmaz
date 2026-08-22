# Ledgeria in this monorepo

**Ledgeria** (desktop app feedback) uses the **same Strapi backend** as the portfolio (`backend/`, workspace **`ledgeria-api`**). The public portfolio site does not host Ledgeria admin UI; triage lives in **admin-web**.

| Area | Path |
|------|------|
| Strapi (shared backend + CMS) | `backend/` — workspace **`ledgeria-api`** |
| Public portfolio | `apps/portfolio-web/` — workspace **`portfolio-web`** |
| Internal admin (issues + licensing) | `apps/admin-web/` — workspace **`admin-web`** (e.g. **http://localhost:3002**) |
| Cross-app notes | This folder (`ledgeria/README.md`) |

### Licensing (vendor control plane)

Admin-web signs `SignedLicense` JSON (Ed25519) for the desktop app (`feat/customer-licensing`). Strapi stores customers, edition templates, and license history. Keys: UI at `/ledgeria/settings/license-keys` (encrypted `.data/`) or `LEDGERIA_LICENSE_PRIVATE_KEY_PKCS8_B64` in `apps/admin-web/.env.local` only.

See root **README.md**, `apps/admin-web/README.md`, and [`CUSTOMER-LICENSING.md`](./CUSTOMER-LICENSING.md) (masaüstü sözleşme: sibling Ledgeria `docs/product/tr/CUSTOMER-LICENSING.md`).
