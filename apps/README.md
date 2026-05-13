# Apps

**Backend:** a single Strapi app in **`backend/`** (npm workspace **`ledgeria-api`**) — portfolio CMS data, Ledgeria issues, and custom ingestion routes. **`portfolio-web`** and **`admin-web`** are frontends that call the same Strapi URL.

| Workspace | Role | Run alone |
|-----------|------|-----------|
| **`ledgeria-api`** | Strapi 5 — shared API: portfolio (`Project`, `Skill`, `About`), `ledgeria-issue`, `POST /ledgeria/v1/issues` | `npm run dev` from **`backend/`**, or `npm run dev:ledgeria-api` from repo root |
| **`portfolio-web`** | Next.js 16 — public portfolio (SSR/SSG reads Strapi) | `npm run dev` from this folder, or `npm run dev:portfolio` from repo root (port **3000**) |
| **`admin-web`** | Next.js 16 — internal admin (e.g. Ledgeria issues); reads/writes Strapi with a token | `npm run dev` from this folder, or `npm run dev:admin` from repo root (port **3002**) |

From repository root, `npm install` installs all workspaces. Then `npm run dev` runs Strapi, portfolio, and admin together.
