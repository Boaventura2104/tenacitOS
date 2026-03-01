#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# SeedMoney — Initialize Data Files
# Copia .example.json → .json se o arquivo não existir e aplica chmod 600.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$(cd "${SCRIPT_DIR}/../data" && pwd)"

echo ""
echo "🌱 SeedMoney — Initializing data files"
echo "══════════════════════════════════════"

# Copy .example.json → .json for config files
for f in org-config financial-goals tiktok-pipeline agent-system-prompts; do
  if [ ! -f "${DATA_DIR}/${f}.json" ]; then
    if [ -f "${DATA_DIR}/${f}.example.json" ]; then
      cp "${DATA_DIR}/${f}.example.json" "${DATA_DIR}/${f}.json"
      echo "✅ ${f}.json (copied from example)"
    else
      echo "⚠️  ${f}.example.json not found — skipping"
    fi
  else
    echo "✓  ${f}.json already exists"
  fi
done

# Initialize empty arrays for runtime data files
for f in tasks memos; do
  if [ ! -f "${DATA_DIR}/${f}.json" ]; then
    echo "[]" > "${DATA_DIR}/${f}.json"
    echo "✅ ${f}.json (initialized empty)"
  else
    echo "✓  ${f}.json already exists"
  fi
done

# Apply secure permissions
chmod 600 "${DATA_DIR}"/*.json
echo ""
echo "✅ Permissions 600 applied to all data files"
echo "✅ SeedMoney data ready. Run: npm run agent:dry-run"
echo ""
