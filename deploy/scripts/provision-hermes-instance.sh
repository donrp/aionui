#!/usr/bin/env bash
# Provision an isolated fresh Hermes brain for one Supernodes AionUI instance.
# Does NOT copy operator Mac ~/.hermes data.
#
# Usage: provision-hermes-instance.sh CLIENT
# Example: provision-hermes-instance.sh demo
set -euo pipefail

CLIENT="${1:-}"
INSTALL_DIR="${SUPERNODES_INSTALL_DIR:-/opt/supernodes}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/supernodes-deploy}"
DATA_DIR="${AIONUI_DATA_DIR:-$INSTALL_DIR/data/$CLIENT}"
HERMES_HOME="${HERMES_HOME:-$DATA_DIR/hermes}"

if [ -z "$CLIENT" ]; then
  echo "Usage: $0 CLIENT"
  exit 1
fi

echo "==> Provisioning fresh Hermes for client: $CLIENT"
echo "    HERMES_HOME=$HERMES_HOME"
echo "    AIONUI_DATA_DIR=$DATA_DIR"

mkdir -p "$HERMES_HOME/skills" "$HERMES_HOME/data/workspaces" "$HERMES_HOME/scripts" "$HERMES_HOME/logs"

# Fresh identity — never copy from operator Mac
if [ ! -f "$HERMES_HOME/SOUL.md" ]; then
  cp "$DEPLOY_DIR/templates/demo-SOUL.md" "$HERMES_HOME/SOUL.md"
  echo "  wrote SOUL.md"
fi

if [ ! -f "$HERMES_HOME/USER.md" ]; then
  cat > "$HERMES_HOME/USER.md" << 'EOF'
# USER.md

Demo user — profile is filled in through conversation over time.
EOF
  echo "  wrote USER.md"
fi

# Marketing agent skills (Hermes format) — from deploy repo only
AGENTS_SRC="$DEPLOY_DIR/agents"
for agent_dir in "$AGENTS_SRC"/*/; do
  name="$(basename "$agent_dir")"
  target="$HERMES_HOME/skills/$name"
  mkdir -p "$target"
  cp "$agent_dir/SKILL.md" "$target/SKILL.md"
  echo "  skill: $name"
done

# Install Hermes CLI once on the host (shared binary; isolated HERMES_HOME per client)
if ! command -v hermes >/dev/null 2>&1; then
  echo "==> Installing Hermes Agent (host-wide CLI)"
  curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
  export PATH="${HOME}/.local/bin:${PATH}"
fi

HERMES_VENV="${HERMES_VENV:-$HOME/.hermes/hermes-agent/venv}"
if [ -d "$HERMES_VENV" ] && ! "$HERMES_VENV/bin/hermes-acp" --help >/dev/null 2>&1; then
  echo "==> Installing Hermes ACP extra"
  "$HERMES_VENV/bin/pip" install -q 'agent-client-protocol' 2>/dev/null || \
    "$HERMES_VENV/bin/pip" install -q -e "$HOME/.hermes/hermes-agent/.[acp]" 2>/dev/null || true
fi

HERMES_BIN="$(command -v hermes || echo "$HOME/.local/bin/hermes")"
HERMES_ACP="$(command -v hermes-acp || echo "$HERMES_VENV/bin/hermes-acp")"
SKILLS_DIR="$HERMES_HOME/skills"
DB_PATH="$DATA_DIR/aionui-backend.db"

if [ ! -f "$DB_PATH" ]; then
  echo "WARN: AionUI DB not found at $DB_PATH — start webui once, then re-run this script"
else
  echo "==> Registering Hermes in AionUI agent_metadata"
  python3 << PY
import json
import sqlite3
import time
from pathlib import Path

db = Path("$DB_PATH")
skills_dir = "$SKILLS_DIR"
hermes_bin = "$HERMES_BIN"
now = int(time.time() * 1000)

conn = sqlite3.connect(db)
cur = conn.cursor()

cur.execute("SELECT id FROM agent_metadata WHERE name = 'Hermes' LIMIT 1")
row = cur.fetchone()
agent_id = row[0] if row else "a1hermes0"

capabilities = {
    "load_session": True,
    "prompt_capabilities": {"image_in": True, "image_out": False},
    "mcp_capabilities": {"list": True, "call": True},
}

native_skills = json.dumps([skills_dir])
args = json.dumps(["acp"])
caps = json.dumps(capabilities)
commands = json.dumps(["/help", "/model", "/tools", "/context", "/reset", "/compact", "/steer", "/queue", "/version"])
modes = json.dumps({"available_modes": [], "current_mode_id": "default"})

if row:
    cur.execute(
        """
        UPDATE agent_metadata
        SET command = ?, args = ?, native_skills_dirs = ?, agent_capabilities = ?,
            available_commands = ?, available_modes = ?, updated_at = ?
        WHERE id = ?
        """,
        (hermes_bin, args, native_skills, caps, commands, modes, now, agent_id),
    )
else:
    cur.execute(
        """
        INSERT INTO agent_metadata (
          id, name, agent_type, command, args, native_skills_dirs,
          agent_capabilities, available_models, available_modes, available_commands,
          created_at, updated_at
        ) VALUES (?, 'Hermes', 'acp', ?, ?, ?, ?, '[]', ?, ?, ?, ?)
        """,
        (agent_id, hermes_bin, args, native_skills, caps, modes, commands, now, now),
    )

conn.commit()
conn.close()
print(f"  Hermes agent id: {agent_id}")
print(f"  command: {hermes_bin}")
print(f"  skills: {skills_dir}")
PY
fi

echo ""
echo "Hermes provisioned for $CLIENT"
echo "  HERMES_HOME=$HERMES_HOME"
echo "  Set HERMES_HOME in PM2 env and restart supernodes-$CLIENT"
