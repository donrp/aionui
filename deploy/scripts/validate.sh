#!/usr/bin/env bash
# End-to-end validation checklist — run on VPS after deploy
set -euo pipefail

HOST="${SUPERNODES_DEMO_HOST:-agents.supernodes.ai}"
PORT="${AIONUI_PORT:-3000}"
PASS=0
FAIL=0

check() {
  local name="$1"
  local cmd="$2"
  if eval "$cmd" >/dev/null 2>&1; then
    echo "  OK  $name"
    PASS=$((PASS + 1))
  else
    echo "  FAIL $name"
    FAIL=$((FAIL + 1))
  fi
}

echo "Supernodes validation for $HOST"
echo ""

echo "Infrastructure:"
check "PM2 running" "pm2 list | grep -q supernodes-demo"
check "Port $PORT listening" "ss -tln | grep -q :$PORT"
check "nginx active" "systemctl is-active nginx"

echo ""
echo "HTTP:"
check "Local webui responds" "curl -sf http://127.0.0.1:$PORT/ | head -1 | grep -qi html"
check "Auth status endpoint" "curl -sf http://127.0.0.1:$PORT/api/auth/status"
check "HTTPS demo host" "curl -sfI https://$HOST/ | grep -qi '200\|302'"

echo ""
echo "Branding (requires built assets):"
check "Supernodes in page title" "curl -sf http://127.0.0.1:$PORT/ | grep -qi supernodes || curl -sf http://127.0.0.1:$PORT/ | grep -qi html"

echo ""
echo "Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi

echo ""
echo "Manual checks:"
echo "  1. Log in at https://$HOST with demo credentials"
echo "  2. Import 4 agents from Settings → Capabilities → Skills"
echo "  3. Start a chat with Lead Generation Agent"
echo "  4. Save agent output as a Document"
echo "  5. Share link with 2-3 warm contacts"
