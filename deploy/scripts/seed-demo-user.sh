#!/usr/bin/env bash
# Seed demo credentials for the public demo instance
set -euo pipefail

PORT="${AIONUI_PORT:-3000}"
DEMO_USERNAME="${DEMO_USERNAME:-demo@supernodes.ai}"
DEMO_PASSWORD="${DEMO_PASSWORD:-TrySupernodes2026}"
BASE_URL="http://127.0.0.1:$PORT"

echo "==> Checking auth status at $BASE_URL"
STATUS=$(curl -sf "$BASE_URL/api/auth/status" || echo '{}')

if echo "$STATUS" | grep -q '"needs_setup":true'; then
  echo "==> Fresh install — generating initial admin password"
  RESET=$(curl -sf -X POST "$BASE_URL/api/webui/reset-password")
  INITIAL_PASSWORD=$(echo "$RESET" | grep -o '"new_password":"[^"]*"' | cut -d'"' -f4)
  echo ""
  echo "Initial admin password: $INITIAL_PASSWORD"
  echo "Log in, then change username to: $DEMO_USERNAME"
  echo "Set password to: $DEMO_PASSWORD"
  echo "(Settings → System → change credentials)"
else
  echo "==> Auth already configured"
  echo "To reset password: cd /opt/supernodes && bun run resetpass"
  echo ""
  echo "Target demo credentials:"
  echo "  Username: $DEMO_USERNAME"
  echo "  Password: $DEMO_PASSWORD"
fi

echo ""
echo "Demo URL: https://${SUPERNODES_DEMO_HOST:-agents.supernodes.ai}"
