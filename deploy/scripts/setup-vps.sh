#!/usr/bin/env bash
# Supernodes VPS initial setup — run as root on Ubuntu 24.04 (Hetzner CAX11)
set -euo pipefail

SUPERNODES_DOMAIN="${SUPERNODES_DOMAIN:-supernodes.ai}"
SUPERNODES_DEMO_HOST="${SUPERNODES_DEMO_HOST:-agents.supernodes.ai}"
GITHUB_FORK_URL="${GITHUB_FORK_URL:-https://github.com/iOfficeAI/AionUi}"
INSTALL_DIR="${SUPERNODES_INSTALL_DIR:-/opt/supernodes}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

echo "==> Updating system"
apt update && apt upgrade -y

echo "==> Installing Node.js 24"
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs git nginx certbot python3-certbot-nginx sqlite3

echo "==> Installing Bun (AionUI build runtime)"
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="${BUN_INSTALL:-/root/.bun}"
export PATH="$BUN_INSTALL/bin:$PATH"
ln -sf "$BUN_INSTALL/bin/bun" /usr/local/bin/bun

echo "==> Installing PM2"
npm install -g pm2 tsx

echo "==> Cloning Supernodes fork"
if [ ! -d "$INSTALL_DIR/.git" ]; then
  git clone --depth 1 "$GITHUB_FORK_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

echo "==> Installing dependencies"
if command -v bun >/dev/null 2>&1; then
  bun install
else
  npm install
fi

echo "==> Downloading aioncore backend (linux-arm64 for CAX11)"
node packages/shared-scripts/src/prepare-aioncore.js

echo "==> Building renderer"
if command -v bun >/dev/null 2>&1; then
  bun run package
else
  npm run package
fi

echo "==> Creating data directory"
mkdir -p "$INSTALL_DIR/data/demo"

echo "==> Configuring nginx"
rm -f /etc/nginx/sites-enabled/default
cp "${DEPLOY_DIR:-/opt/supernodes-deploy}/nginx/supernodes.conf" /etc/nginx/sites-available/supernodes
ln -sf /etc/nginx/sites-available/supernodes /etc/nginx/sites-enabled/supernodes
nginx -t
systemctl reload nginx

echo "==> Starting PM2"
cp "${DEPLOY_DIR:-/opt/supernodes-deploy}/ecosystem.config.js" "$INSTALL_DIR/ecosystem.config.js"
pm2 start "$INSTALL_DIR/ecosystem.config.js"
pm2 save
pm2 startup systemd -u root --hp /root

if [ -n "$CERTBOT_EMAIL" ] && [ "${CLOUDFLARE_PROXY:-0}" != "1" ]; then
  echo "==> Obtaining SSL certificate"
  certbot --nginx -d "$SUPERNODES_DEMO_HOST" --non-interactive --agree-tos -m "$CERTBOT_EMAIL"
  certbot renew --dry-run
elif [ "${CLOUDFLARE_PROXY:-0}" = "1" ]; then
  echo "==> Cloudflare proxy mode — skipping certbot (use SSL/TLS Full or Flexible in Cloudflare)"
else
  echo "WARN: Set CERTBOT_EMAIL or CLOUDFLARE_PROXY=1"
fi

echo ""
echo "============================================"
echo "VPS setup complete!"
echo "  URL: https://$SUPERNODES_DEMO_HOST"
echo "  Install: $INSTALL_DIR"
echo "  Next: run scripts/seed-demo-user.sh and scripts/install-agents.sh"
echo "============================================"
