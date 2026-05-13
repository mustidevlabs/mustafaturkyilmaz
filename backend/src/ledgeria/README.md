# Ledgeria (in this repo)

Product-specific code for the **Ledgeria** desktop app integration. The rest of this Strapi app is the **portfolio** CMS (projects, skills, about).

| Location | Role |
|----------|------|
| `src/ledgeria/` | Custom HTTP handlers and Ledgeria-only logic (this folder). |
| `src/api/ledgeria-issue/` | Strapi **content type** required by the framework (`ledgeria-issues` REST). Ingestion writes here. |

Public HTTP contract: `POST /ledgeria/v1/issues` (and optional `POST /api/ledgeria/v1/issues` alias).

Full payload contract (including `screenshotPins`): **`docs/ledgeria-issues-api-v1-contract.md`** (repo root).

**Issue `logs` text:** The admin UI summarizes common dev noise (Vite HMR, React DevTools / i18next promos, Electron CSP boilerplate, repeated Radix `DialogContent` a11y warnings) and surfaces lines that look like real signal (`issues-sink`, `issues-http`, HTTP status, `DB path:`). For clearer triage from the desktop app, prefer sending a short **human summary** plus a filtered tail of logs, or structured JSON in `description` / a future custom field.
