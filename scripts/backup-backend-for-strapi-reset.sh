#!/usr/bin/env bash
# Archive backend/ source (excludes node_modules and build artifacts).
# Run from repo root: bash scripts/backup-backend-for-strapi-reset.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
OUT_DIR="${ROOT}/backups"
ARCHIVE="${OUT_DIR}/backend-src-${STAMP}.tar.gz"

mkdir -p "${OUT_DIR}"

echo "→ Archive: ${ARCHIVE}"

tar -czf "${ARCHIVE}" \
  --exclude='backend/node_modules' \
  --exclude='backend/.cache' \
  --exclude='backend/build' \
  --exclude='backend/dist' \
  --exclude='backend/.tmp' \
  --exclude='backend/.strapi' \
  --exclude='backend/.strapi-updater.json' \
  --exclude='backend/exports' \
  --exclude='backend/public/uploads' \
  --exclude='backend/.env' \
  --exclude='backend/.env.*' \
  -C "${ROOT}" \
  backend

echo "→ Done. Size:"
ls -lh "${ARCHIVE}"
