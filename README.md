# Mustafa Turkyilmaz — Portfolio (Strapi + Next.js)

Personal portfolio app. Monorepo layout:

```
mustafaturkyilmaz/
├── backend/    # Strapi 5 CMS (TypeScript + SQLite)
├── frontend/   # Next.js 16 (App Router + TypeScript + Tailwind v4)
└── package.json # run both apps with one command
```

## Quick start

Use **Node 20+** (required for Strapi 5).

```bash
# 1) Install dependencies (from repo root)
npm install                # root: concurrently, etc.
npm run install:all        # backend + frontend node_modules

# 2) Run both apps in parallel
npm run dev
```

This starts:

- Strapi: http://localhost:1337 (admin: http://localhost:1337/admin)
- Next.js: http://localhost:3000

> On first launch, Strapi will prompt you to create an admin user.

## After first setup

1. Open the Strapi admin → **Settings → Users & Permissions Plugin → Roles → Public**.
2. Enable `find` and `findOne` for these content types:
   - Project
   - Skill
   - About
3. Open **Content Manager**, fill **About**, then add some **Projects** and **Skills**. Do not forget **Save** and **Publish**.
4. Refresh the frontend → `http://localhost:3000` should show live data.

Instead of opening public permissions, you can create a read-only token under **Settings → API Tokens → Create new** and set `STRAPI_API_TOKEN=...` in `frontend/.env.local`.

## Content types

| Type | Kind | Description |
|---|---|---|
| `Project` | collection | Portfolio projects — title, slug, summary, description, cover, gallery, technologies (JSON), liveUrl, repoUrl, featured, order |
| `Skill` | collection | Skills — name, category (Frontend/Backend/Database/DevOps/Tooling/Other), level (0-100), icon, order |
| `About` | single type | Profile — fullName, headline, bio, email, location, avatar, resume, GitHub/LinkedIn/Twitter/website URLs |

Schemas live under `backend/src/api/<name>/content-types/<name>/schema.json`. Strapi picks them up on boot; you can also edit fields in the admin UI.

## Ledgeria issue ingestion (optional)

The backend exposes **`POST /ledgeria/v1/issues`** at the **root** URL (not under `/api`), for the Ledgeria desktop client contract. Issues are stored in the **Ledgeria Issue** collection type.

- Optional auth: set **`LEDGERIA_ISSUES_API_KEY`** in `backend/.env` and send `Authorization: Bearer <key>` or `X-API-Key: <key>`.
- In production (`api.mustidev.com`), route this path to the same Strapi process (or proxy) as in the client.

## Frontend layout

- `frontend/src/lib/strapi.ts` — Strapi REST helpers: `fetchStrapi<T>()`, `strapiMedia()`.
- `frontend/src/types/strapi.ts` — Types for Project / Skill / About / `StrapiResponse`.
- `frontend/src/app/page.tsx` — Home: loads About, Projects, Skills; shows a friendly message if Strapi is down.
- `frontend/next.config.ts` — `next/image` allows Strapi `localhost:1337/uploads/**`.

## Production notes

- Prefer **PostgreSQL** over SQLite for Strapi (`backend/config/database.ts` and env).
- Host the frontend on Vercel (or similar) and Strapi on a VPS, **Strapi Cloud**, Render, Railway, etc.
- Set `NEXT_PUBLIC_STRAPI_URL` in `frontend/.env.local` to the production Strapi URL.
- Update `next.config.ts` `image.remotePatterns` to include your production Strapi hostname.

## Why this stack?

- **Strapi 5**: TypeScript-first headless CMS with a built-in admin.
- **Next.js 16** App Router + Server Components: server-side fetch for SEO and performance.
- **Tailwind v4**: low-config styling.
- **One monorepo**: simple backups and a single `npm run dev`.
