#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# SeedMoney — Setup Autonomous Loop
# Cria os 4 cron jobs intercalados para os agentes Jobs, Ogilvy, Buffett e Turing
# rodarem a cada hora no offset correto de 15 minutos.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${SCRIPT_DIR}/../data"
MC_URL="${MC_URL:-http://localhost:3000}"

echo ""
echo "🌱 SeedMoney — Autonomous Loop Setup"
echo "══════════════════════════════════════"

# ── Check prerequisites ─────────────────────────────────────────────────────
echo ""
echo "Checking prerequisites..."

if ! command -v openclaw &> /dev/null; then
  echo "❌ openclaw CLI not found. Please install OpenClaw first."
  exit 1
fi
echo "✅ openclaw CLI found"

if ! command -v node &> /dev/null; then
  echo "❌ node not found."
  exit 1
fi
echo "✅ node found: $(node --version)"

if ! command -v npx &> /dev/null; then
  echo "❌ npx not found."
  exit 1
fi
echo "✅ npx found"

# ── Initialize data files if missing ────────────────────────────────────────
echo ""
echo "Checking data files..."

# Auto-initialize any missing data files from .example.json templates
bash "${SCRIPT_DIR}/init-data.sh"

for f in org-config.json agent-system-prompts.json financial-goals.json tiktok-pipeline.json memos.json tasks.json; do
  if [ ! -f "${DATA_DIR}/${f}" ]; then
    echo "❌ ${f} still missing after init. Check data/ directory."
    exit 1
  else
    echo "✅ ${f}"
  fi
done

# ── Remove existing SeedMoney cron jobs ──────────────────────────────────────
echo ""
echo "Removing existing SeedMoney cron jobs (if any)..."
openclaw cron list --json 2>/dev/null | \
  grep -o '"id":"[^"]*"' | \
  grep -o '"[^"]*"$' | tr -d '"' | \
  while read -r id; do
    name=$(openclaw cron list --json 2>/dev/null | grep -A5 "\"id\":\"${id}\"" | grep '"name"' | head -1 | grep -o '"[^"]*"$' | tr -d '"' || true)
    if [[ "${name}" == SeedMoney* ]]; then
      echo "  Removing: ${id} (${name})"
      openclaw cron remove "${id}" 2>/dev/null || true
    fi
  done
echo "✅ Old jobs cleaned"

# ── Create the 4 agent cron jobs ─────────────────────────────────────────────
echo ""
echo "Creating interleaved cron jobs..."

LOOP_CMD="npx ts-node ${SCRIPT_DIR}/autonomous-loop.ts"

# Jobs (CEO) — :00 every hour
echo "  Creating Jobs (CEO) cron — :00 every hour..."
openclaw cron create \
  --name "SeedMoney-Jobs-CEO" \
  --schedule "0 * * * *" \
  --agent jobs \
  --message "${LOOP_CMD} --agent jobs" \
  --kind agentTurn \
  2>&1 || echo "  ⚠️ Note: Job creation may require openclaw gateway running"

# Ogilvy (CMO) — :15 every hour
echo "  Creating Ogilvy (CMO) cron — :15 every hour..."
openclaw cron create \
  --name "SeedMoney-Ogilvy-CMO" \
  --schedule "15 * * * *" \
  --agent ogilvy \
  --message "${LOOP_CMD} --agent ogilvy" \
  --kind agentTurn \
  2>&1 || echo "  ⚠️ Note: may require gateway"

# Buffett (CFO) — :30 every hour
echo "  Creating Buffett (CFO) cron — :30 every hour..."
openclaw cron create \
  --name "SeedMoney-Buffett-CFO" \
  --schedule "30 * * * *" \
  --agent buffett \
  --message "${LOOP_CMD} --agent buffett" \
  --kind agentTurn \
  2>&1 || echo "  ⚠️ Note: may require gateway"

# Turing (CTO) — :45 every hour
echo "  Creating Turing (CTO) cron — :45 every hour..."
openclaw cron create \
  --name "SeedMoney-Turing-CTO" \
  --schedule "45 * * * *" \
  --agent turing \
  --message "${LOOP_CMD} --agent turing" \
  --kind agentTurn \
  2>&1 || echo "  ⚠️ Note: may require gateway"

echo "✅ Cron jobs created"

# ── Verify ───────────────────────────────────────────────────────────────────
echo ""
echo "Verifying cron jobs..."
openclaw cron list 2>/dev/null | grep -i SeedMoney || echo "  Run 'openclaw cron list' to verify"

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════"
echo "✅ SeedMoney Autonomous Loop is LIVE!"
echo ""
echo "Rotation schedule (every hour):"
echo "  :00 — 🍎 Jobs (CEO)    — Strategy & decisions"
echo "  :15 — 🎨 Ogilvy (CMO)  — TikTok content & growth"
echo "  :30 — 📈 Buffett (CFO) — Finance & investment"
echo "  :45 — 🔬 Turing (CTO)  — Build & automation"
echo ""
echo "Test a dry run:  npx ts-node ${SCRIPT_DIR}/autonomous-loop.ts --agent jobs --dry-run"
echo "Run manually:    npx ts-node ${SCRIPT_DIR}/autonomous-loop.ts --agent jobs"
echo "Mission Control: ${MC_URL}"
echo ""
