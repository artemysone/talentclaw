#!/usr/bin/env bash
set -euo pipefail

# talentclaw Skill Setup
# Cross-platform installer for macOS and Linux
# Installs Node.js 22+ and scaffolds workspace

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

info()  { echo -e "${BOLD}$1${RESET}"; }
ok()    { echo -e "${GREEN}[OK]${RESET} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${RESET} $1"; }
fail()  { echo -e "${RED}[ERROR]${RESET} $1"; }

echo ""
info "=== talentclaw Skill Setup ==="
echo ""

# Detect platform
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin) PLATFORM="macos" ;;
  Linux)  PLATFORM="linux" ;;
  *)
    fail "Unsupported operating system: $OS"
    echo "talentclaw setup supports macOS and Linux."
    exit 1
    ;;
esac

ok "Detected platform: $PLATFORM ($ARCH)"

# ─── 1. Check / install Node.js ─────────────────────────────────────────────

install_node_suggestion() {
  echo ""
  info "How to install Node.js 22+:"
  echo ""
  if [ "$PLATFORM" = "macos" ]; then
    echo "  Option A (Homebrew):  brew install node@22"
    echo "  Option B (nvm):       nvm install 22"
    echo "  Option C (fnm):       fnm install 22"
    echo "  Option D (direct):    https://nodejs.org/en/download"
  else
    echo "  Option A (nvm):       curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash && nvm install 22"
    echo "  Option B (fnm):       curl -fsSL https://fnm.vercel.app/install | bash && fnm install 22"
    echo "  Option C (NodeSource):"
    if command -v apt-get &>/dev/null; then
      echo "    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
      echo "    sudo apt-get install -y nodejs"
    elif command -v dnf &>/dev/null; then
      echo "    curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -"
      echo "    sudo dnf install -y nodejs"
    elif command -v yum &>/dev/null; then
      echo "    curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -"
      echo "    sudo yum install -y nodejs"
    else
      echo "    Visit https://nodejs.org/en/download for your distribution"
    fi
    echo "  Option D (direct):    https://nodejs.org/en/download"
  fi
  echo ""
}

if ! command -v node &>/dev/null; then
  fail "Node.js is not installed."
  install_node_suggestion
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
  fail "Node.js 22+ required (found $(node -v))"
  install_node_suggestion
  exit 1
fi

ok "Node.js $(node -v)"

# ─── 2. Check npm is available ───────────────────────────────────────────────

if ! command -v npm &>/dev/null; then
  fail "npm is not available. It usually ships with Node.js."
  echo "  Try reinstalling Node.js from https://nodejs.org"
  exit 1
fi

ok "npm $(npm -v)"

# ─── 3. Print next steps ────────────────────────────────────────────────────

echo ""
info "=== Setup Complete ==="
echo ""
echo "Node.js and npm are ready. Run 'npx talentclaw' to start."
echo ""
