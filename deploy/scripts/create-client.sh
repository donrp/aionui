#!/usr/bin/env bash
# Provision an isolated Supernodes client instance on a subdomain
# Usage: ./create-client.sh clientname port
# Example: ./create-client.sh playitforward 3001
set -euo pipefail

CLIENT="${1:-}"
PORT="${2:-}"
INSTALL_DIR="${SUPERNODES_INSTALL_DIR:-/opt/supernodes}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/supernodes-deploy}"
DOMAIN="${SUPERNODES_DOMAIN:-supernodes.ai}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-your@email.com}"
DATA_DIR="$INSTALL_DIR/data/$CLIENT"

if [ -z "$CLIENT" ] || [ -z "$PORT" ]; then
  echo "Usage: $0 clientname port"
  exit 1
fi

echo "Creating client: $CLIENT on port $PORT"

mkdir -p "$DATA_DIR"

AIONUI_DATA_DIR="$DATA_DIR" bash "$DEPLOY_DIR/scripts/install-agents.sh"
bash "$DEPLOY_DIR/scripts/provision-hermes-instance.sh" "$CLIENT"

pm2 delete "supernodes-$CLIENT" 2>/dev/null || true
cat > "/tmp/ecosystem-$CLIENT.js" <<EOF
module.exports = {
  apps: [{
    name: 'supernodes-$CLIENT',
    cwd: '$INSTALL_DIR',
    script: 'node_modules/.bin/tsx',
    user: 'supernodes',
    args: 'scripts/webui.ts --no-build',
    env: {
      NODE_ENV: 'production',
      AIONUI_PORT: $PORT,
      AIONUI_DATA_DIR: '$DATA_DIR',
      HERMES_HOME: '$DATA_DIR/hermes',
      AIONUI_NO_BUILD: '1',
    },
    max_memory_restart: '500M',
  }],
};
EOF
pm2 start "/tmp/ecosystem-$CLIENT.js"
pm2 save

NGINX_CONF="/etc/nginx/sites-available/supernodes-$CLIENT"
sed "s/CLIENT_NAME/$CLIENT/g; s/CLIENT_PORT/$PORT/g" \
  "$DEPLOY_DIR/nginx/supernodes-client.conf.template" > "$NGINX_CONF"
ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/supernodes-$CLIENT"

echo "Add to nginx/supernodes-wildcard.conf map: $CLIENT.$DOMAIN $PORT;"

nginx -t && systemctl reload nginx

if [ "${CLOUDFLARE_PROXY:-0}" != "1" ]; then
  certbot --nginx -d "$CLIENT.$DOMAIN" --non-interactive --agree-tos -m "$CERTBOT_EMAIL" || true
fi

echo ""
echo "============================================"
echo "Client '$CLIENT' is ready!"
echo "  URL: https://$CLIENT.$DOMAIN"
echo "  Port: $PORT"
echo "  PM2: supernodes-$CLIENT"
echo "============================================"
