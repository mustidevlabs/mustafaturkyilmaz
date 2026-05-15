#!/usr/bin/env bash
# Strapi 5: full export from the database wired in backend/.env (content + files + config).
# Ensure backend/.env has the correct DATABASE_* and Strapi env vars before running.
#
# Run from repo root:
#   bash scripts/strapi-export-to-backups.sh
#
# For encrypted archives: drop --no-encrypt and pass -k <key> (see strapi export --help).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
OUT_DIR="${ROOT}/backups"
BASE="${OUT_DIR}/strapi-export-${STAMP}"

mkdir -p "${OUT_DIR}"

cd "${ROOT}/backend"

echo "→ strapi export (unencrypted .tar.gz) → ${BASE}.tar.gz"
echo "→ WARNING: exports the database currently configured in backend/.env"

npx strapi export --no-encrypt --format tar -f "${BASE}"

echo "→ Done:"
ls -lh "${BASE}"*.tar.gz 2>/dev/null || ls -lh "${BASE}"*
