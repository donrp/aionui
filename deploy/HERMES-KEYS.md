# Hermes API keys on Supernodes VPS

## Important: AionUI Settings ≠ Hermes keys

| Where you configure | What it powers |
|---------------------|----------------|
| **AionUI Settings → Providers** | Built-in **aioncore** agent only |
| **`$HERMES_HOME/.env` + `config.yaml`** | **Hermes** agent (via `hermes acp`) |

If you chat with **Hermes** selected, keys added in the AionUI UI are **ignored**. That is why the model list stays empty.

Each client instance has its own isolated brain:

```
/opt/supernodes/data/demo/hermes/     ← agents.supernodes.ai
/opt/supernodes/data/<client>/hermes/ ← future clients
```

## Configure keys on the VPS (one-time per instance)

SSH to the server, then either:

### Option A — script with env vars (non-interactive)

```bash
OPENROUTER_API_KEY='sk-or-...' \
HERMES_MODEL='openrouter/anthropic/claude-sonnet-4' \
bash /opt/supernodes-deploy/scripts/configure-hermes-provider.sh demo
```

### Option B — interactive

```bash
bash /opt/supernodes-deploy/scripts/configure-hermes-provider.sh demo
```

### Option C — manual (same as your Mac terminal flow)

```bash
export HERMES_HOME=/opt/supernodes/data/demo/hermes
hermes config set OPENROUTER_API_KEY 'sk-or-...'
hermes config set model 'openrouter/anthropic/claude-sonnet-4'
pm2 restart supernodes-demo
```

Verify:

```bash
HERMES_HOME=/opt/supernodes/data/demo/hermes hermes status
```

You should see the provider key as ✓ and a model name set.

## In the browser

1. Log in at https://agents.supernodes.ai
2. **New chat → select agent Hermes** (not “Built-in” / aioncore)
3. Pick the model in the chat header if shown
4. Send a message

If an old conversation was created before keys were set, start a **new** conversation.

## Your Mac instance (later)

Your laptop uses `~/.hermes/` — completely separate from the demo VPS instance. When you create a personal `ruggero.*` subdomain, it will get its own `HERMES_HOME` and you can sync keys selectively (never copy the whole Mac `.hermes` to a client demo).
