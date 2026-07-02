#!/usr/bin/env bash
# Copy marketing agent skills into the webui data directory for import via Skills Hub
set -euo pipefail

INSTALL_DIR="${SUPERNODES_INSTALL_DIR:-/opt/supernodes}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/supernodes-deploy}"
DATA_DIR="${AIONUI_DATA_DIR:-$INSTALL_DIR/data/demo}"
AGENTS_SRC="$DEPLOY_DIR/agents"
STAGING_DIR="$DATA_DIR/staged-agents"

mkdir -p "$STAGING_DIR"

echo "==> Staging agent skills in $STAGING_DIR"
for agent_dir in "$AGENTS_SRC"/*/; do
  name="$(basename "$agent_dir")"
  target="$STAGING_DIR/$name"
  rm -rf "$target"
  mkdir -p "$target"
  cp "$agent_dir/SKILL.md" "$target/SKILL.md"
  echo "  staged: $name"
done

cat <<EOF

Agent skills staged at: $STAGING_DIR

Import each agent in the Supernodes UI:
  Settings → Capabilities → Skills → Import from folder

Or use the API after login:
  POST /api/skills/import-symlink
  body: { "skillPath": "$STAGING_DIR/lead-gen-agent" }

Repeat for outreach-agent, follow-up-agent, research-agent.

EOF
