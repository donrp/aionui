#!/usr/bin/env bash
# Harden Supernodes VPS — run as root once after initial deploy.
# Fixes: firewall, localhost-only app bind, origin TLS, non-root PM2, CF Full Strict.
#
# Required env (export before running):
#   CF_API_TOKEN   — Cloudflare API token with Zone:SSL and Zone:DNS edit for supernodes.ai
#   CERTBOT_EMAIL  — email for cert notices (optional if using CF origin cert only)
set -euo pipefail

INSTALL_DIR="${SUPERNODES_INSTALL_DIR:-/opt/supernodes}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/supernodes-deploy}"
DEMO_HOST="${SUPERNODES_DEMO_HOST:-agents.supernodes.ai}"
DOMAIN="${SUPERNODES_DOMAIN:-supernodes.ai}"
APP_USER="${SUPERNODES_APP_USER:-supernodes}"
APP_PORT="${SUPERNODES_PORT:-3000}"
SSL_DIR="/etc/ssl/supernodes"
NGINX_SITE="/etc/nginx/sites-available/supernodes"

echo "==> [1/5] Create dedicated app user: $APP_USER"
if ! id "$APP_USER" &>/dev/null; then
  useradd -r -d "$INSTALL_DIR" -s /usr/sbin/nologin "$APP_USER"
fi
mkdir -p "$INSTALL_DIR/.pm2" "$INSTALL_DIR/data/demo/workspace"
chown -R "$APP_USER:$APP_USER" "$INSTALL_DIR/data"
chmod 700 "$INSTALL_DIR/data/demo"
chmod 700 "$INSTALL_DIR/data/demo/hermes" 2>/dev/null || true
chmod 600 "$INSTALL_DIR/data/demo/hermes/.env" 2>/dev/null || true

# App code: root-owned, group-readable; data + PM2 home owned by app user
chown -R "$APP_USER:$APP_USER" "$INSTALL_DIR/data" "$INSTALL_DIR/.pm2" 2>/dev/null || mkdir -p "$INSTALL_DIR/.pm2" && chown -R "$APP_USER:$APP_USER" "$INSTALL_DIR/.pm2"
chmod 700 "$INSTALL_DIR/data/demo"
chmod 700 "$INSTALL_DIR/data/demo/hermes" 2>/dev/null || true
chmod 600 "$INSTALL_DIR/data/demo/hermes/.env" 2>/dev/null || true
chmod -R g+rX "$INSTALL_DIR"

# Hermes global install must be executable by app user
chmod -R o+rX /usr/local/lib/hermes-agent 2>/dev/null || true
chmod o+x /usr/local/bin/hermes /usr/local/bin/hermes-acp 2>/dev/null || true

echo "==> [2/5] Bind app to localhost only (nginx handles public traffic)"
cp "$DEPLOY_DIR/ecosystem.config.js" "$INSTALL_DIR/ecosystem.config.js"

echo "==> [3/5] Cloudflare IP lists for nginx real_ip + origin firewall"
CF_IPS="/etc/nginx/cloudflare-ips.conf"
CF_GEO="/etc/nginx/cloudflare-geo.conf"
: > "$CF_IPS"
: > "$CF_GEO"
for ip in $(curl -fsSL https://www.cloudflare.com/ips-v4); do
  echo "set_real_ip_from $ip;" >> "$CF_IPS"
  echo "$ip 1;" >> "$CF_GEO"
done
for ip in $(curl -fsSL https://www.cloudflare.com/ips-v6); do
  echo "set_real_ip_from $ip;" >> "$CF_IPS"
  echo "$ip 1;" >> "$CF_GEO"
done

echo "==> [4/5] Origin TLS certificate"
mkdir -p "$SSL_DIR"
chmod 700 "$SSL_DIR"

if [ -n "${CF_API_TOKEN:-}" ]; then
  echo "    Requesting Cloudflare Origin Certificate for $DEMO_HOST"
  openssl genrsa -out "$SSL_DIR/origin.key" 2048 2>/dev/null
  chmod 600 "$SSL_DIR/origin.key"
  openssl req -new -key "$SSL_DIR/origin.key" -out /tmp/supernodes.csr \
    -subj "/CN=$DEMO_HOST/O=Supernodes/C=AU"

  CSR_JSON=$(python3 -c "
import json, pathlib
csr = pathlib.Path('/tmp/supernodes.csr').read_text()
print(json.dumps({
  'hostnames': ['$DEMO_HOST', '*.$DOMAIN'],
  'requested_validity': 5475,
  'request_type': 'origin-rsa',
  'csr': csr,
}))
")

  RESP=$(curl -fsSL -X POST "https://api.cloudflare.com/client/v4/certificates" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "$CSR_JSON")
  echo "$RESP" > /tmp/cf-cert-response.json

  python3 << 'PY'
import json, sys
data = json.load(open("/tmp/cf-cert-response.json"))
if not data.get("success"):
    print("CF cert error:", data.get("errors"), file=sys.stderr)
    sys.exit(1)
cert = data["result"]["certificate"]
open("/etc/ssl/supernodes/origin.pem", "w").write(cert)
print("    Origin cert saved to /etc/ssl/supernodes/origin.pem")
PY

  # Switch Cloudflare SSL mode to strict
  ZONE_ID=$(curl -fsSL -H "Authorization: Bearer $CF_API_TOKEN" \
    "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" | \
    python3 -c "import json,sys; d=json.load(sys.stdin); print(d['result'][0]['id'])")

  curl -fsSL -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/ssl" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{"value":"strict"}' >/dev/null
  echo "    Cloudflare SSL mode set to strict"
else
  echo "WARN: CF_API_TOKEN not set — skipping origin cert (keep Flexible or run certbot manually)"
fi

echo "==> [5/5] nginx HTTPS + Cloudflare-only origin"
cp "$DEPLOY_DIR/nginx/supernodes.conf" "$NGINX_SITE"
ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/supernodes
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

echo "==> Restart PM2 (app runs as $APP_USER via ecosystem user: field)"
pm2 delete all 2>/dev/null || true
pm2 start "$INSTALL_DIR/ecosystem.config.js"
pm2 save
env PATH="$PATH:/usr/local/bin" pm2 startup systemd -u root --hp /root 2>&1 | grep -E 'sudo env' | bash || true

echo "==> Enable firewall"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP via Cloudflare'
ufw allow 443/tcp comment 'HTTPS via Cloudflare'
ufw --force enable

echo ""
echo "============================================"
echo "Hardening complete"
echo "  App user:     $APP_USER"
echo "  App bind:     127.0.0.1:$APP_PORT"
echo "  Firewall:     ufw active (22, 80, 443)"
echo "  TLS:          $([ -f $SSL_DIR/origin.pem ] && echo 'Cloudflare origin cert' || echo 'not configured')"
echo "  CF SSL mode:  $([ -n \"${CF_API_TOKEN:-}\" ] && echo 'strict' || echo 'unchanged')"
echo "============================================"
