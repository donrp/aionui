# Supernodes DNS — Cloudflare setup

Domain: **supernodes.ai**  
DNS provider: **Cloudflare** ([cloudflare.com](https://dash.cloudflare.com))  
Nameservers: `erin.ns.cloudflare.com`, `anton.ns.cloudflare.com`

## Current records

| Record | Type | Value | Proxy | Purpose |
|--------|------|-------|-------|---------|
| `supernodes.ai` | A | 104.21.32.229 | Proxied (orange) | Main marketing site |
| `www.supernodes.ai` | A | 104.21.32.229 | Proxied | WWW |
| `agents.supernodes.ai` | A | **YOUR_VPS_IP** | Proxied (recommended) | Supernodes demo platform |

## Step 1 — Add agents subdomain (after Hetzner CAX11 is ready)

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) → **supernodes.ai** → **DNS** → **Records**
2. Click **Add record**
3. Configure:

| Field | Value |
|-------|-------|
| Type | A |
| Name | `agents` |
| IPv4 address | Your Hetzner VPS IP (e.g. `95.xxx.xxx.xxx`) |
| Proxy status | **Proxied** (orange cloud) |

4. Save

Verify propagation:

```bash
dig agents.supernodes.ai +short
# Should return Cloudflare IPs (104.x / 172.x) when proxied
```

## Step 2 — Cloudflare SSL mode

With **Proxied** DNS, Cloudflare terminates HTTPS for visitors.

In Cloudflare → **SSL/TLS** → **Overview**, set mode to:

- **Full** — Cloudflare → VPS over HTTPS (requires cert on VPS via certbot), or
- **Flexible** — Cloudflare → VPS over HTTP (simpler MVP; nginx listens on port 80 only)

**Recommended for MVP:** Flexible until certbot is working, then switch to Full.

## Step 3 — Phase 2 wildcard (per-client subdomains)

Add a wildcard A record when you need `clientname.supernodes.ai`:

| Field | Value |
|-------|-------|
| Type | A |
| Name | `*` |
| IPv4 address | Same VPS IP |
| Proxy status | Proxied |

Then run on VPS:

```bash
cp /opt/supernodes-deploy/nginx/supernodes-wildcard.conf /etc/nginx/sites-available/supernodes
nginx -t && systemctl reload nginx
```

Add each client port to the `map` block in `supernodes-wildcard.conf`, or use per-client nginx configs from `create-client.sh`.

## WebSockets

Supernodes uses WebSockets for chat. In Cloudflare → **Network**, ensure **WebSockets** is **On** (default).

## Notes

- Main site (`supernodes.ai`) stays on Cloudflare Pages/hosting at `104.21.32.229` — do not change that record.
- Only `agents` (and later `*`) point to the Hetzner VPS.
- If certbot fails behind Cloudflare proxy, either use Flexible SSL or temporarily set the record to **DNS only** (grey cloud) while obtaining the certificate.
