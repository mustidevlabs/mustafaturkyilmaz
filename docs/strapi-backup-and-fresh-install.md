# Strapi: backup and fresh install (Cloud / Postgres)

Use this when you need to **rebuild Strapi without losing data or code**. Steps are **manual**; there is no automated script that drops production databases.

## 1. Code backup (Git + archive)

```bash
# Recommended: create and push a branch
git checkout -b backup/strapi-pre-reset-$(date -u +%Y%m%d)
git push -u origin backup/strapi-pre-reset-$(date -u +%Y%m%d)

# Tarball backend/ sources (excluding node_modules)
bash scripts/backup-backend-for-strapi-reset.sh
```

Output: `backups/backend-src-<UTC-stamp>.tar.gz`

## 2. Content backup (Ledgeria Issue, Project, Skill, About, media)

Two practical options with Strapi 5:

### A) `strapi export` (file)

Exports the database **currently connected via `backend/.env`** (content, uploads, configuration).

- **Strapi Cloud** Postgres is often **not reachable** from your laptop; this path usually works with **local Postgres** or any connection string Strapi Cloud exposes to you.
- When a DB connection is available:

```bash
bash scripts/strapi-export-to-backups.sh
```

Output: `backups/strapi-export-<UTC-stamp>.tar.gz` (or extensions Strapi adds).

Content + media only (no config): add `--exclude config` to the `strapi export` invocation as needed.

### B) `strapi transfer` (Cloud ↔ local or Cloud ↔ Cloud)

Requires two running Strapi URLs and a **Transfer Token** (admin: **Settings → Transfer Tokens**).

- **Pull** (e.g. Cloud → empty/local Strapi in this repo):

```bash
cd backend
npx strapi transfer --from "https://<project>.strapiapp.com" --from-token "<TRANSFER_TOKEN>"
```

- **Push** (e.g. local → new Cloud): follow official docs for `--to` and `--to-token`.

Official: [Data management](https://docs.strapi.io/cms/data-management) (export / import / transfer).

## 3. What “fresh install” means

| Scenario | Summary |
|----------|---------|
| **New Strapi Cloud project** | Create project, connect the same Git repo with `backend` root, deploy, then **import** or **transfer** data back. |
| **Same project, empty DB** | DB reset / env delete on Strapi Cloud is **hard to undo**; always take an **export** or **transfer** first. |

Content-type schemas live in `backend/src/api/**/schema.json`. After deploy on a clean database, Strapi recreates tables; **import** fills rows again.

## 4. Restore

Target Strapi must be running with the **same or compatible** schema deployed.

```bash
cd backend
npx strapi import --file "../backups/strapi-export-....tar.gz" --force
```

`--force` auto-accepts prompts; use carefully in production.

Large media sets make imports slow.

## 5. Application users (Users & Permissions)

`strapi export` / `import` usually covers **content + configuration + files**; **Users & Permissions** rows may not round-trip the same on every version. After restore:

- Recreate users under **Settings → Users & Permissions → Users**, or  
- Temporarily use **`POST /api/admin-auth/register`** with `ADMIN_WEB_INVITE_SECRET` on Strapi (secure secret).

## 6. Checklist

1. Git branch + `backup-backend-for-strapi-reset.sh` run?  
2. Content backup via `strapi export` or `strapi transfer`?  
3. Strapi Cloud **new project / empty DB** decision made consciously?  
4. Same repo deployed with **`backend`** root?  
5. `strapi import` or `transfer` restore completed?  
6. **Public / Authenticated** permissions for the portfolio API re-checked?

## Strapi version (admin / Users & Permissions issues)

This repo tracks **Strapi 5.x** in `backend/package.json` and root `overrides`. After odd Cloud admin behaviour, deploy the latest pinned minor (see changelog: [Strapi releases](https://github.com/strapi/strapi/releases)) and ensure `config/plugins.ts` keeps **`users-permissions`** `jwtSecret` wired to `JWT_SECRET` in the environment.

## Repo scripts

| Script | Purpose |
|--------|---------|
| `scripts/backup-backend-for-strapi-reset.sh` | `backend/` source tarball → `backups/` |
| `scripts/strapi-export-to-backups.sh` | `strapi export` → `backups/` (uses `.env` DB) |

Root `package.json`: `npm run backup:strapi-code`, `npm run backup:strapi-export`
