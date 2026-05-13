# admin-web

Internal **admin** UI (not the public portfolio). First screen: **Ledgeria issues** from Strapi.

Uses the **same Strapi instance** as the portfolio: npm workspace **`ledgeria-api`** in repo folder **`backend/`**. One backend, multiple frontends.

- **Dev:** `npm run dev` (port **3002**) from this folder, or `npm run dev:admin` from repo root.
- **Env:** copy `.env.example` → `.env.local` — `STRAPI_API_TOKEN`, `NEXT_PUBLIC_STRAPI_URL`, optional `NEXT_PUBLIC_PORTFOLIO_URL` (default `http://localhost:3000`).

Future: portfolio CMS controls, other products — same app, new routes.
