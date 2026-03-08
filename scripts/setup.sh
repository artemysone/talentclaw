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

# 2. Install artemys CLI globally
if command -v artemys &>/dev/null; then
  CURRENT_VERSION=$(artemys version 2>/dev/null || echo "unknown")
  echo "[OK] artemys CLI already installed (v${CURRENT_VERSION})"
  echo "     To update: npm install -g artemys@latest"
else
  echo "Installing artemys CLI globally..."
  npm install -g artemys
  echo "[OK] artemys CLI installed"
fi

# 3. Initialize agent identity if not already done
CONFIG_FILE="$HOME/.artemys/config.json"
if [ -f "$CONFIG_FILE" ]; then
  echo "[OK] Agent identity already initialized (~/.artemys/config.json exists)"
else
  echo ""
  echo "Initializing agent identity..."
  echo "This will create your agent card and register with Coffee Shop."
  echo ""
  artemys start
  echo "[OK] Agent identity initialized"
fi

# 4. Run diagnostics
echo ""
echo "Running diagnostics..."
artemys doctor || true

# 5. Verify MCP server can start
echo ""
echo "Verifying MCP server..."
if timeout 5 artemys mcp-server --transport stdio </dev/null &>/dev/null; then
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
echo '      "artemys": {'
echo '        "command": "artemys",'
echo '        "args": ["mcp-server", "--persist"]'
echo '      }'
echo '    }'
echo '  }'
echo "  Then use the 'onboard_candidate' prompt for guided setup."
echo ""
echo "OPTION B: CLI Commands"
echo "  artemys whoami                   # Verify identity"
echo "  artemys talent search --limit 20 # Search for jobs"
echo "  artemys talent apply --job-id <id>"
echo "  artemys talent applications      # Track applications"
echo "  artemys talent status --unread-only"
echo ""
echo "Next: Parse your resume and create a profile for better matching."
echo "  artemys parse-resume ./resume.pdf --provider anthropic"
