# Ledgeria in this monorepo

**Ledgeria** (desktop app feedback) uses the **same Strapi backend** as the portfolio (`backend/`, workspace **`ledgeria-api`**). The public portfolio site does not host Ledgeria admin UI; triage lives in **admin-web**.

| Area | Path |
|------|------|
| Strapi (shared backend + CMS) | `backend/` — workspace **`ledgeria-api`** |
| Public portfolio | `apps/portfolio-web/` — workspace **`portfolio-web`** |
| Internal issues UI | `apps/admin-web/` — workspace **`admin-web`** (e.g. **http://localhost:3002**) |
| Cross-app notes | This folder (`ledgeria/README.md`) |

See the root **README.md** for install and scripts.
