#!/usr/bin/env bash
# Phase 2: switch nginx to wildcard routing for *.supernodes.ai
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/opt/supernodes-deploy}"

echo "==> Installing wildcard nginx config"
cp "$DEPLOY_DIR/nginx/supernodes-wildcard.conf" /etc/nginx/sites-available/supernodes
ln -sf /etc/nginx/sites-available/supernodes /etc/nginx/sites-enabled/supernodes
nginx -t && systemctl reload nginx

echo ""
echo "Phase 2 nginx enabled."
echo ""
echo "Cloudflare: add wildcard A record"
echo "  Type: A | Name: * | Content: YOUR_VPS_IP | Proxied: Yes"
echo ""
echo "Add client port mappings to $DEPLOY_DIR/nginx/supernodes-wildcard.conf"
echo "Then provision clients: bash $DEPLOY_DIR/scripts/create-client.sh clientname 3001"
