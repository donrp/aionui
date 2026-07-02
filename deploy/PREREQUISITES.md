# Supernodes Platform — Prerequisites Checklist

Complete these before running `scripts/setup-vps.sh` on your Hetzner VPS.

## Accounts and access

- [ ] **Hetzner account** — [hetzner.com](https://hetzner.com)
- [ ] **Domain DNS access** for `supernodes.ai` (or your chosen domain)
- [ ] **GitHub account** with a fork of [iOfficeAI/AionUi](https://github.com/iOfficeAI/AionUi)
- [ ] **LLM API key** (OpenAI, Anthropic, etc.) — added in Settings after first login

## SSH key

Generate if you do not have one:

```bash
ssh-keygen -t ed25519 -C "supernodes-vps" -f ~/.ssh/supernodes_ed25519
cat ~/.ssh/supernodes_ed25519.pub
```

Add the public key when creating the Hetzner CAX11 server.

## Brand assets

Included in this repo under `branding/`:

- `branding/favicon.png` — from supernodes.ai site
- `branding/logo.svg` — Supernodes wordmark

These are applied to the AionUI fork during deploy (`scripts/deploy.sh`).

## DNS records

**Provider:** Cloudflare ([DNS.md](DNS.md))

| Record | Status |
|--------|--------|
| `supernodes.ai` → 104.21.32.229 | Already set (marketing site) |
| `agents.supernodes.ai` → VPS IP | **Add after renting Hetzner CAX11** |

Nameservers: `erin.ns.cloudflare.com`, `anton.ns.cloudflare.com`

## Fork workflow

1. Fork AionUI on GitHub
2. Push Supernodes branding branch from your local fork
3. On VPS, clone your fork into `/opt/supernodes`

Or use the bundled fork at `../supernodes-source` and push branding changes to your remote.

## Estimated cost

| Item | Cost |
|------|------|
| Hetzner CAX11 | ~€4/mo |
| Domain | ~€15/year |
| LLM usage | Pay-as-you-go |
