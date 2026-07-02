#!/usr/bin/env bash
# Pull latest, rebuild, and restart Supernodes on the VPS
set -euo pipefail

INSTALL_DIR="${SUPERNODES_INSTALL_DIR:-/opt/supernodes}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/supernodes-deploy}"
BRAND_DIR="$DEPLOY_DIR/branding"

cd "$INSTALL_DIR"

echo "==> Applying branding assets"
if [ -d "$BRAND_DIR" ]; then
  cp "$BRAND_DIR/favicon.png" packages/desktop/src/renderer/assets/logos/brand/app.png
fi

echo "==> Installing dependencies"
if command -v bun >/dev/null 2>&1; then
  bun install
else
  npm install
fi

echo "==> Ensuring aioncore backend is present"
node packages/shared-scripts/src/prepare-aioncore.js

echo "==> Building renderer"
if command -v bun >/dev/null 2>&1; then
  bun run package
else
  npm run package
fi

echo "==> Restarting PM2"
pm2 restart supernodes-demo || pm2 start "$INSTALL_DIR/ecosystem.config.js"
pm2 save

echo "Deploy complete — visit https://${SUPERNODES_DEMO_HOST:-agents.supernodes.ai}"
