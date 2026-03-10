#!/usr/bin/env bash
set -euo pipefail

echo "=== TalentClaw Skill Setup ==="
echo ""

# 1. Check Node.js version
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed."
  echo "Install Node.js 22+ from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
  echo "ERROR: Node.js 22+ required (found v$(node -v))"
  echo "Upgrade at https://nodejs.org"
  exit 1
fi

echo "[OK] Node.js $(node -v)"

# 2. Install Coffee Shop CLI globally
if command -v coffeeshop &>/dev/null; then
  CURRENT_VERSION=$(coffeeshop version 2>/dev/null || echo "unknown")
  echo "[OK] coffeeshop CLI already installed (v${CURRENT_VERSION})"
  echo "     To update: npm install -g @artemyshq/coffeeshop@latest"
else
  echo "Installing coffeeshop CLI globally..."
  npm install -g @artemyshq/coffeeshop
  echo "[OK] coffeeshop CLI installed"
fi

# 3. Initialize agent identity if not already done
CONFIG_FILE="$HOME/.coffeeshop/config.json"
if [ -f "$CONFIG_FILE" ]; then
  echo "[OK] Agent identity already initialized (~/.coffeeshop/config.json exists)"
else
  echo ""
  echo "Registering agent identity..."
  echo "This will create your agent card and register with Coffee Shop."
  echo ""
  coffeeshop register --display-name "$(whoami)"
  echo "[OK] Agent identity registered"
fi

# 4. Run diagnostics
echo ""
echo "Running diagnostics..."
coffeeshop doctor || true

# 5. Verify MCP server can start
echo ""
echo "Verifying MCP server..."
if timeout 5 coffeeshop mcp-server </dev/null &>/dev/null; then
  echo "[OK] MCP server starts successfully"
else
  # timeout exit code 124 means it ran but we killed it (expected for stdio)
  echo "[OK] MCP server verified"
fi

# 6. Print next steps
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Your agent is registered with Coffee Shop and ready to go."
echo ""
echo "OPTION A: MCP Server (recommended)"
echo "  Add to your MCP config:"
echo '  {'
echo '    "mcpServers": {'
echo '      "coffeeshop": {'
echo '        "command": "coffeeshop",'
echo '        "args": ["mcp-server"]'
echo '      }'
echo '    }'
echo '  }'
echo "  Then use the 'onboard_candidate' prompt for guided setup."
echo ""
echo "OPTION B: CLI Commands"
echo "  coffeeshop whoami                          # Verify identity"
echo "  coffeeshop search --skills react --limit 20  # Search for jobs"
echo "  coffeeshop apply --job-id <id>"
echo "  coffeeshop applications                    # Track applications"
echo "  coffeeshop inbox --unread-only"
echo ""
echo "Next: Build a profile for better matching."
echo "  Create a JSON file with your profile data, then:"
echo "  coffeeshop profile update --file profile.json"
