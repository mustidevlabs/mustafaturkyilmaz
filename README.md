# Mustafa Turkyilmaz — Monorepo

**npm workspaces:** `apps/*` (Next frontends) and **`backend/`** (Strapi). **One Strapi app** (workspace `ledgeria-api` in folder **`backend/`**) serves the **portfolio** site, **admin** console, and **Ledgeria** issue ingestion. Strapi Cloud: set the repo **base directory** to **`backend`**.

```
mustafaturkyilmaz/
├── apps/
│   ├── portfolio-web/   # Next.js 16 — public portfolio (reads Strapi)
│   ├── admin-web/       # Next.js 16 — internal admin
│   └── README.md
├── backend/             # Strapi 5 — shared API (portfolio CMS + Ledgeria + REST)
├── ledgeria/            # Ledgeria product notes (cross-app)
├── packages/            # Reserved for future shared packages (not a workspace yet)
└── package.json         # workspaces: ["apps/*", "backend"]
```

## Architecture (single backend)

| Layer | Location | Role |
|-------|----------|------|
| Backend | **`backend/`** (`ledgeria-api`) | Strapi: portfolio content types, media, `ledgeria-issue`, custom HTTP for Ledgeria client. |
| Frontends | **`apps/portfolio-web`**, **`apps/admin-web`** | Next.js; both use `NEXT_PUBLIC_STRAPI_URL` → the same Strapi instance. |

Future shared TypeScript (e.g. API types) can live under `packages/` when needed; data stays in one Strapi project.

## Install

From the **repository root**:

```bash
npm install
```

## Run

| Command | What it does |
|---------|----------------|
| `npm run dev` | Strapi + portfolio + admin together |
| `npm run dev:ledgeria-api` | Only Strapi (`backend/`, workspace `ledgeria-api`) |
| `npm run dev:backend` | Same as `dev:ledgeria-api` (Strapi in `backend/`) |
| `npm run dev:portfolio` | Only portfolio (`apps/portfolio-web`, port **3000**) |
| `npm run dev:admin` | Only admin (`apps/admin-web`, port **3002**) |

You can also `cd backend && npm run develop` or `cd apps/portfolio-web && npm run dev`.

Default URLs: Strapi API **https://timely-spirit-9e046731e1.strapiapp.com** (override with `NEXT_PUBLIC_STRAPI_URL`), portfolio **http://localhost:3000**, admin **http://localhost:3002**. Local Strapi in `backend/` is optional.

---

## Portfolio (public site)

Content lives in Strapi; the Next app is the renderer (`src/lib/strapi.ts` → `backend/`).

### After first Strapi setup

1. Strapi admin → **Settings → Users & Permissions → Roles → Public**.
2. Enable `find` and `findOne` for **Project**, **Skill**, **About**.
3. **Content Manager**: fill **About**, add **Projects** and **Skills**; **Save** + **Publish**.
4. Reload http://localhost:3000

Optional: **Settings → API Tokens** → read-only token → `apps/portfolio-web/.env.local` as `STRAPI_API_TOKEN=...`.

### Portfolio content types

| Type | Kind | Description |
|---|---|---|
| `Project` | collection | Portfolio projects |
| `Skill` | collection | Skills |
| `About` | single type | Profile |

Schemas: `backend/src/api/<name>/content-types/<name>/schema.json`.

### Next.js (portfolio)

- `apps/portfolio-web/src/lib/strapi.ts` — `fetchStrapi<T>()`, `strapiMedia()` (Strapi = `backend/`)
- `apps/portfolio-web/src/app/page.tsx` — home
- `apps/portfolio-web/next.config.ts` — Strapi image `remotePatterns`

---

## Ledgeria (desktop product slice)

| Piece | Location |
|-------|----------|
| HTTP ingestion | `backend/src/ledgeria/issue-ingestion.ts` |
| Strapi collection | `backend/src/api/ledgeria-issue/` |
| Issues inbox (internal UI) | **http://localhost:3002** — `apps/admin-web` |

More: **`ledgeria/README.md`**, **`backend/src/ledgeria/README.md`**.

- Optional: **`LEDGERIA_ISSUES_API_KEY`** in `backend/.env`.
- Admin issues UI: **`STRAPI_API_TOKEN`** + **`NEXT_PUBLIC_STRAPI_URL`** in `apps/admin-web/.env.local`.

---

## Strapi Cloud

**Base directory:** **`backend`** (this folder in the Git repo; matches Strapi Cloud “root directory” for the backend app).

**Production API (default):** `https://timely-spirit-9e046731e1.strapiapp.com` — `portfolio-web` and `admin-web` use this URL in code; override with `NEXT_PUBLIC_STRAPI_URL` for other environments.

---

## Production

- Strapi: PostgreSQL in production; set env on host.
- Next apps: `NEXT_PUBLIC_STRAPI_URL` and image `remotePatterns` for your Strapi host.

---

## Stack

Strapi 5 + Next.js 16 + Tailwind v4; workspaces keep **ledgeria-api** (`backend/`), **portfolio-web**, and **admin-web** runnable on their own.
