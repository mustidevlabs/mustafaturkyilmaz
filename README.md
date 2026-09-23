# Mustafa Turkyilmaz — Monorepo

**npm workspaces:** `apps/portfolio-web` and **`backend/`** (portfolio Strapi). **Ledgeria API + admin dashboard** live in the sibling **mustidev** monorepo (`apps/ledgeria-api`, `apps/dashboard`). Strapi Cloud (legacy shared instance): base directory **`backend`** until Ledgeria is deployed separately.

```
mustafaturkyilmaz/
├── apps/
│   ├── portfolio-web/   # Next.js 16 — public portfolio (reads Strapi)
│   ├── admin-web/       # Pointer → mustidev/apps/dashboard
│   └── README.md
├── backend/             # Strapi 5 — portfolio CMS only
├── ledgeria/            # Ledgeria product notes (cross-app)
├── packages/            # Reserved for future shared packages (not a workspace yet)
└── package.json         # workspaces: ["apps/*", "backend"]
```

## Architecture

| Layer | Location | Role |
|-------|----------|------|
| Portfolio backend | **`backend/`** (`ledgeria-api` workspace name) | Strapi: About, Project, Skill |
| Portfolio site | **`apps/portfolio-web`** | Next.js public site |
| Ledgeria API | **`mustidev/apps/ledgeria-api`** | Issues, licensing, customers |
| Product dashboard | **`mustidev/apps/dashboard`** | Ledgeria admin UI (port 3002) |

## Install

From the **repository root**:

```bash
npm install
```

## Run

| Command | What it does |
|---------|----------------|
| `npm run dev` | Strapi + portfolio together |
| `npm run dev:ledgeria-api` | Only portfolio Strapi (`backend/`) |
| `npm run dev:backend` | Same as `dev:ledgeria-api` |
| `npm run dev:portfolio` | Only portfolio (`apps/portfolio-web`, port **3000**) |

You can also `cd backend && npm run develop` or `cd apps/portfolio-web && npm run dev`.

Default URLs: Strapi API **https://timely-spirit-9e046731e1.strapiapp.com** (override with `NEXT_PUBLIC_STRAPI_URL`), portfolio **http://localhost:3000**. Ledgeria admin: `cd ../mustidev && npm run dashboard:dev` (**http://localhost:3002**).

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

## Ledgeria (moved to Mustidev)

| Piece | Location |
|-------|----------|
| Strapi API | **`mustidev/apps/ledgeria-api`** |
| Admin dashboard | **`mustidev/apps/dashboard`** |
| Product notes | **`ledgeria/README.md`** (this repo) |

More: **`ledgeria/CUSTOMER-LICENSING.md`**, **`mustidev/apps/dashboard/README.md`**.

---

## Mobile app development (GitHub)

This monorepo hosts **Strapi** (`backend/`) and **Next.js** apps (`apps/*`). **Native or hybrid mobile clients** are not under `apps/` here; GitHub’s repository profile still benefits from an explicit pointer so people know where mobile work lives.

| Topic | Where it lives |
|--------|----------------|
| Shared API, CMS, Ledgeria ingestion | **`backend/`** (Strapi + `src/ledgeria/`) — same endpoints mobile clients would call. |
| API / product contracts | **`ledgeria/README.md`**, **`backend/src/ledgeria/README.md`**, and repo `docs/` when present. |
| Dedicated mobile source (Expo, RN, Flutter, etc.) | **Separate GitHub repo** (typical); add the canonical URL below when it exists. |

**Mobile app repository:** _Not published in this monorepo — when you have a public app repo (e.g. under `https://github.com/mustidevlabs/...`), replace this line with a markdown link._

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
