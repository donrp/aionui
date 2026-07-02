#!/usr/bin/env bash
# Remove a client instance
# Usage: ./delete-client.sh clientname
set -euo pipefail

CLIENT="${1:-}"
INSTALL_DIR="${SUPERNODES_INSTALL_DIR:-/opt/supernodes}"

if [ -z "$CLIENT" ]; then
  echo "Usage: $0 clientname"
  exit 1
fi

pm2 delete "supernodes-$CLIENT" 2>/dev/null || true
rm -rf "$INSTALL_DIR/clients/$CLIENT"
rm -f "/etc/nginx/sites-enabled/supernodes-$CLIENT"
rm -f "/etc/nginx/sites-available/supernodes-$CLIENT"
nginx -t && systemctl reload nginx
pm2 save

echo "Client '$CLIENT' removed."
