# Supernodes — Live Deploy (ExtraVM Sydney)

**VPS IP:** `206.245.167.52`  
**Demo URL:** https://agents.supernodes.ai

## Cloudflare DNS (do this in dashboard if not done yet)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **supernodes.ai** → **DNS** → **Add record**
2. Type **A**, Name **agents**, Content **206.245.167.52**, Proxy **Proxied** (orange)
3. **SSL/TLS** → **Flexible**
4. **Network** → **WebSockets** → On

## SSH from your Mac

```bash
ssh -i ~/.ssh/extravm_supernodes root@206.245.167.52
```

## Demo login (after deploy)

- Username: `demo@supernodes.ai`
- Password: `TrySupernodes2026`
