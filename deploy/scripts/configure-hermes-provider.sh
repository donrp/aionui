#!/usr/bin/env bash
# Configure API keys and default model for an isolated Hermes instance.
# AionUI Settings → Providers does NOT feed Hermes — use this script instead.
#
# Usage (on VPS):
#   OPENROUTER_API_KEY=sk-or-... \
#   HERMES_MODEL=openrouter/anthropic/claude-sonnet-4 \
#   bash /opt/supernodes-deploy/scripts/configure-hermes-provider.sh demo
#
# Or interactive:
#   bash /opt/supernodes-deploy/scripts/configure-hermes-provider.sh demo
set -euo pipefail

CLIENT="${1:-}"
INSTALL_DIR="${SUPERNODES_INSTALL_DIR:-/opt/supernodes}"
DATA_DIR="${AIONUI_DATA_DIR:-$INSTALL_DIR/data/$CLIENT}"
HERMES_HOME="${HERMES_HOME:-$DATA_DIR/hermes}"
PM2_NAME="${PM2_NAME:-supernodes-$CLIENT}"

if [ -z "$CLIENT" ]; then
  echo "Usage: $0 CLIENT"
  echo ""
  echo "Environment variables (optional):"
  echo "  OPENROUTER_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, DEEPSEEK_API_KEY"
  echo "  HERMES_MODEL  e.g. openrouter/anthropic/claude-sonnet-4"
  exit 1
fi

if [ ! -d "$HERMES_HOME" ]; then
  echo "ERROR: HERMES_HOME not found: $HERMES_HOME"
  echo "Run: bash /opt/supernodes-deploy/scripts/provision-hermes-instance.sh $CLIENT"
  exit 1
fi

export HERMES_HOME
export PATH="/usr/local/bin:/root/.local/bin:$PATH"

echo "==> Configuring Hermes for client: $CLIENT"
echo "    HERMES_HOME=$HERMES_HOME"

set_key() {
  local var_name="$1"
  local label="$2"
  local value="${!var_name:-}"
  if [ -n "$value" ]; then
    hermes config set "$var_name" "$value"
    echo "  set $label"
  fi
}

if [ -z "${OPENROUTER_API_KEY:-}${OPENAI_API_KEY:-}${ANTHROPIC_API_KEY:-}${DEEPSEEK_API_KEY:-}" ]; then
  echo ""
  echo "No API keys in environment. Enter one provider key (input hidden):"
  echo "  1) OpenRouter (recommended — many models)"
  echo "  2) OpenAI"
  echo "  3) Anthropic"
  echo "  4) DeepSeek"
  read -r -p "Choice [1-4]: " choice
  case "$choice" in
    1)
      read -r -s -p "OPENROUTER_API_KEY: " OPENROUTER_API_KEY
      echo ""
      export OPENROUTER_API_KEY
      ;;
    2)
      read -r -s -p "OPENAI_API_KEY: " OPENAI_API_KEY
      echo ""
      export OPENAI_API_KEY
      ;;
    3)
      read -r -s -p "ANTHROPIC_API_KEY: " ANTHROPIC_API_KEY
      echo ""
      export ANTHROPIC_API_KEY
      ;;
    4)
      read -r -s -p "DEEPSEEK_API_KEY: " DEEPSEEK_API_KEY
      echo ""
      export DEEPSEEK_API_KEY
      ;;
    *)
      echo "Invalid choice"
      exit 1
      ;;
  esac
fi

set_key OPENROUTER_API_KEY "OpenRouter"
set_key OPENAI_API_KEY "OpenAI"
set_key ANTHROPIC_API_KEY "Anthropic"
set_key DEEPSEEK_API_KEY "DeepSeek"

MODEL="${HERMES_MODEL:-}"
if [ -z "$MODEL" ]; then
  if [ -n "${OPENROUTER_API_KEY:-}" ]; then
    MODEL="${HERMES_MODEL:-openrouter/anthropic/claude-sonnet-4}"
  elif [ -n "${ANTHROPIC_API_KEY:-}" ]; then
    MODEL="anthropic/claude-sonnet-4-20250514"
  elif [ -n "${OPENAI_API_KEY:-}" ]; then
    MODEL="openai/gpt-4.1"
  elif [ -n "${DEEPSEEK_API_KEY:-}" ]; then
    MODEL="deepseek/deepseek-chat"
  fi
  read -r -p "Default model [$MODEL]: " input
  MODEL="${input:-$MODEL}"
fi

if [ -n "$MODEL" ]; then
  hermes config set model "$MODEL"
  echo "  model: $MODEL"
fi

DB_PATH="$DATA_DIR/aionui-backend.db"
if [ -f "$DB_PATH" ]; then
  python3 << PY
import json, sqlite3, time
model = "$MODEL"
db = "$DB_PATH"
now = int(time.time() * 1000)
# Minimal model entry for AionUI model switcher
models = json.dumps([{"id": model, "name": model.split("/")[-1], "provider": model.split("/")[0] if "/" in model else "custom"}])
conn = sqlite3.connect(db)
cur = conn.cursor()
cur.execute(
    "UPDATE agent_metadata SET available_models = ?, updated_at = ? WHERE name = 'Hermes'",
    (models, now),
)
conn.commit()
conn.close()
print("  updated agent_metadata.available_models")
PY
fi

echo ""
hermes status 2>&1 | head -20

echo ""
echo "Restarting $PM2_NAME so AionUI picks up agent metadata..."
pm2 restart "$PM2_NAME" 2>/dev/null || true

echo ""
echo "Done. In AionUI: start a new chat with agent Hermes (not the built-in agent)."
