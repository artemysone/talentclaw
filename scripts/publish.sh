#!/usr/bin/env bash
#
# publish.sh — Build and publish TalentClaw npm packages
#
# Automates: version bump -> web UI build -> Rust CLI build -> npm publish -> git tag
#
# Usage:
#   ./scripts/publish.sh                     # interactive version prompt
#   ./scripts/publish.sh --version 1.0.0     # explicit version
#   ./scripts/publish.sh --dry-run            # preview without side effects
#   ./scripts/publish.sh --skip-build         # republish existing artifacts
#
set -euo pipefail

# ---------------------------------------------------------------------------
# Flags (parsed early so --help works before any setup)
# ---------------------------------------------------------------------------

DRY_RUN=false
SKIP_BUILD=false
NEW_VERSION=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)
      NEW_VERSION="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--version X.Y.Z] [--dry-run] [--skip-build]"
      echo ""
      echo "Flags:"
      echo "  --version X.Y.Z   Set the new version (skips interactive prompt)"
      echo "  --dry-run          Show what would happen without making changes"
      echo "  --skip-build       Skip web UI and Rust builds (republish existing artifacts)"
      exit 0
      ;;
    *)
      echo "Unknown flag: $1"
      exit 1
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Package paths (relative to REPO_ROOT)
ROOT_PKG="package.json"
MAIN_NPM_PKG="cli/npm/talentclaw/package.json"
PLATFORM_PKGS=(
  "cli/npm/darwin-arm64/package.json"
  "cli/npm/darwin-x64/package.json"
  "cli/npm/linux-x64/package.json"
)
CRATE_CARGO="cli/crates/talentclaw/Cargo.toml"

# Rust cross-compilation targets and their corresponding npm platform directories
# (parallel arrays — Bash 3.2 compatible, no associative arrays needed)
RUST_TARGETS=(
  "aarch64-apple-darwin"
  "x86_64-apple-darwin"
  "x86_64-unknown-linux-gnu"
)
NPM_PLATFORM_DIRS=(
  "darwin-arm64"
  "darwin-x64"
  "linux-x64"
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

info()  { echo "  ℹ️  $*"; }
ok()    { echo "  ✅ $*"; }
warn()  { echo "  ⚠️  $*"; }
err()   { echo "  ❌ $*" >&2; }
step()  { echo ""; echo "━━━ $* ━━━"; }

# Run a command, or print it if --dry-run
run() {
  if $DRY_RUN; then
    echo "  [dry-run] $*"
  else
    "$@"
  fi
}

# Read a JSON field using node (available everywhere bun/node is)
json_field() {
  node -e "console.log(JSON.parse(require('fs').readFileSync('$1','utf8')).$2)"
}

# Update a JSON field in-place using node
json_set() {
  local file="$1" field="$2" value="$3"
  if $DRY_RUN; then
    echo "  [dry-run] Set $field = \"$value\" in $file"
  else
    node -e "
      const fs = require('fs');
      const p = '$file';
      const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
      const keys = '$field'.split('.');
      let obj = pkg;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = '$value';
      fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\\n');
    "
  fi
}

# Update version in a Cargo.toml (only the first version = "..." line)
cargo_set_version() {
  local file="$1" version="$2"
  if $DRY_RUN; then
    echo "  [dry-run] Set version = \"$version\" in $file"
  else
    sed -i '' "s/^version = \".*\"/version = \"$version\"/" "$file"
  fi
}

# ---------------------------------------------------------------------------
# Step 1: Pre-flight checks
# ---------------------------------------------------------------------------

step "Pre-flight checks"

cd "$REPO_ROOT"

# Verify tools
for cmd in bun cargo npm node git; do
  if ! command -v "$cmd" &>/dev/null; then
    err "$cmd is not installed or not in PATH"
    exit 1
  fi
done
ok "Required tools available (bun, cargo, npm, node, git)"

# Verify clean working tree
if [[ -n "$(git status --porcelain)" ]]; then
  err "Git working tree is not clean. Commit or stash changes first."
  git status --short
  exit 1
fi
ok "Git working tree is clean"

# Verify on main branch
CURRENT_BRANCH="$(git branch --show-current)"
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  err "Not on main branch (currently on '$CURRENT_BRANCH'). Switch to main first."
  exit 1
fi
ok "On main branch"

# Read current version
CURRENT_VERSION="$(json_field "$ROOT_PKG" "version")"
info "Current version: $CURRENT_VERSION"

# ---------------------------------------------------------------------------
# Step 2: Determine new version
# ---------------------------------------------------------------------------

step "Version"

if [[ -z "$NEW_VERSION" ]]; then
  echo ""
  echo "  Current version: $CURRENT_VERSION"
  echo ""
  read -rp "  Enter new version: " NEW_VERSION
  echo ""
fi

# Basic semver validation
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
  err "Invalid version format: '$NEW_VERSION' (expected semver like 1.0.0 or 1.0.0-beta.1)"
  exit 1
fi

if [[ "$NEW_VERSION" == "$CURRENT_VERSION" ]]; then
  err "New version ($NEW_VERSION) is the same as current version"
  exit 1
fi

ok "Version: $CURRENT_VERSION -> $NEW_VERSION"

if $DRY_RUN; then
  warn "DRY RUN mode — no files will be modified, no packages published"
fi

# ---------------------------------------------------------------------------
# Step 3: Version bump
# ---------------------------------------------------------------------------

step "Bumping versions to $NEW_VERSION"

# Root package.json
json_set "$ROOT_PKG" "version" "$NEW_VERSION"
ok "root package.json"

# Main npm package
json_set "$MAIN_NPM_PKG" "version" "$NEW_VERSION"
ok "cli/npm/talentclaw/package.json"

# Update optionalDependencies in main npm package to match new version
for dep in "@artemyshq/talentclaw-cli-darwin-arm64" "@artemyshq/talentclaw-cli-darwin-x64" "@artemyshq/talentclaw-cli-linux-x64"; do
  json_set "$MAIN_NPM_PKG" "optionalDependencies.$dep" "$NEW_VERSION"
done
ok "optionalDependencies versions in main package"

# Platform packages
for pkg_file in "${PLATFORM_PKGS[@]}"; do
  json_set "$pkg_file" "version" "$NEW_VERSION"
  ok "$pkg_file"
done

# Cargo.toml
cargo_set_version "$CRATE_CARGO" "$NEW_VERSION"
ok "$CRATE_CARGO"

# ---------------------------------------------------------------------------
# Step 4: Build web UI
# ---------------------------------------------------------------------------

if $SKIP_BUILD; then
  step "Skipping builds (--skip-build)"
else
  step "Building web UI"

  cd "$REPO_ROOT"

  info "Installing dependencies..."
  run bun install

  info "Building Next.js (standalone output)..."
  run bun run build

  # Copy web UI artifacts into main npm package for distribution
  DIST_DIR="$REPO_ROOT/cli/npm/talentclaw"

  info "Copying .next/standalone/ into npm package..."
  if ! $DRY_RUN; then
    rm -rf "$DIST_DIR/.next"
    mkdir -p "$DIST_DIR/.next"
    cp -r "$REPO_ROOT/.next/standalone" "$DIST_DIR/.next/standalone"
    cp -r "$REPO_ROOT/.next/static" "$DIST_DIR/.next/static"
  else
    echo "  [dry-run] cp -r .next/standalone -> $DIST_DIR/.next/standalone"
    echo "  [dry-run] cp -r .next/static -> $DIST_DIR/.next/static"
  fi
  ok ".next/standalone + .next/static copied"

  # Copy public/ if it exists
  if [[ -d "$REPO_ROOT/public" ]]; then
    info "Copying public/ into npm package..."
    if ! $DRY_RUN; then
      rm -rf "$DIST_DIR/public"
      cp -r "$REPO_ROOT/public" "$DIST_DIR/public"
    else
      echo "  [dry-run] cp -r public -> $DIST_DIR/public"
    fi
    ok "public/ copied"
  fi

  # Copy skills/ and persona/ directories
  for dir in skills persona; do
    if [[ -d "$REPO_ROOT/$dir" ]]; then
      info "Copying $dir/ into npm package..."
      if ! $DRY_RUN; then
        rm -rf "$DIST_DIR/$dir"
        cp -r "$REPO_ROOT/$dir" "$DIST_DIR/$dir"
      else
        echo "  [dry-run] cp -r $dir -> $DIST_DIR/$dir"
      fi
      ok "$dir/ copied"
    fi
  done

  # -------------------------------------------------------------------------
  # Step 5: Build Rust CLI
  # -------------------------------------------------------------------------

  step "Building Rust CLI"

  cd "$REPO_ROOT/cli"

  for i in "${!RUST_TARGETS[@]}"; do
    TARGET="${RUST_TARGETS[$i]}"
    PLATFORM_DIR="${NPM_PLATFORM_DIRS[$i]}"
    BIN_DIR="$REPO_ROOT/cli/npm/$PLATFORM_DIR/bin"

    info "Building for $TARGET..."

    # Check if the target toolchain is installed
    if ! rustup target list --installed 2>/dev/null | grep -q "$TARGET"; then
      # Try to add the target
      if ! $DRY_RUN; then
        if ! rustup target add "$TARGET" 2>/dev/null; then
          warn "Cannot add target $TARGET — skipping (cross-compilation may require additional toolchain setup)"
          continue
        fi
      fi
    fi

    # For linux targets on macOS, we need a cross-linker.
    # Skip if we detect we are on macOS trying to build for linux without a cross toolchain.
    if [[ "$TARGET" == *"linux"* ]] && [[ "$(uname -s)" == "Darwin" ]]; then
      if ! command -v x86_64-unknown-linux-gnu-gcc &>/dev/null && \
         ! command -v x86_64-linux-gnu-gcc &>/dev/null && \
         ! command -v zig &>/dev/null; then
        warn "Skipping $TARGET — no Linux cross-linker found on macOS"
        warn "  Install a cross toolchain: brew install messense/macos-cross-toolchains/x86_64-unknown-linux-gnu"
        warn "  Or use zig as a linker: brew install zig"
        continue
      fi
    fi

    run cargo build --release --target "$TARGET"

    if ! $DRY_RUN; then
      mkdir -p "$BIN_DIR"
      cp "$REPO_ROOT/cli/target/$TARGET/release/talentclaw" "$BIN_DIR/talentclaw"
      chmod +x "$BIN_DIR/talentclaw"
    else
      echo "  [dry-run] cp target/$TARGET/release/talentclaw -> $BIN_DIR/talentclaw"
    fi

    ok "$TARGET -> cli/npm/$PLATFORM_DIR/bin/talentclaw"
  done
fi

# ---------------------------------------------------------------------------
# Step 6: Publish npm packages
# ---------------------------------------------------------------------------

step "Publishing npm packages"

cd "$REPO_ROOT"

# Publish platform packages first (they must exist on the registry before the
# main package, which lists them as optionalDependencies).
for pkg_file in "${PLATFORM_PKGS[@]}"; do
  PKG_DIR="$(dirname "$REPO_ROOT/$pkg_file")"
  PKG_NAME="$(json_field "$REPO_ROOT/$pkg_file" "name")"
  BIN_PATH="$PKG_DIR/bin/talentclaw"

  # Check that the binary exists (unless dry-running)
  if [[ ! -f "$BIN_PATH" ]] && ! $DRY_RUN; then
    warn "No binary at $BIN_PATH — skipping publish of $PKG_NAME"
    continue
  fi

  info "Publishing $PKG_NAME@$NEW_VERSION..."
  if $DRY_RUN; then
    echo "  [dry-run] cd $PKG_DIR && npm publish --access public"
  else
    (cd "$PKG_DIR" && npm publish --access public)
  fi
  ok "$PKG_NAME@$NEW_VERSION published"
done

# Publish main package
MAIN_PKG_DIR="$REPO_ROOT/cli/npm/talentclaw"
info "Publishing talentclaw@$NEW_VERSION..."
if $DRY_RUN; then
  echo "  [dry-run] cd $MAIN_PKG_DIR && npm publish --access public"
else
  (cd "$MAIN_PKG_DIR" && npm publish --access public)
fi
ok "talentclaw@$NEW_VERSION published"

# ---------------------------------------------------------------------------
# Step 7: Post-publish — git commit and tag
# ---------------------------------------------------------------------------

step "Post-publish"

cd "$REPO_ROOT"

info "Creating version commit..."
if $DRY_RUN; then
  echo "  [dry-run] git add + commit + tag v$NEW_VERSION"
else
  git add \
    "$ROOT_PKG" \
    "$MAIN_NPM_PKG" \
    "${PLATFORM_PKGS[@]}" \
    "$CRATE_CARGO"
  git commit -m "release: v$NEW_VERSION"
  ok "Committed version bump"

  git tag "v$NEW_VERSION"
  ok "Tagged v$NEW_VERSION"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

step "Done"

echo ""
echo "  Published packages:"
echo "     talentclaw@$NEW_VERSION"
for pkg_file in "${PLATFORM_PKGS[@]}"; do
  PKG_NAME="$(json_field "$REPO_ROOT/$pkg_file" "name")"
  echo "     $PKG_NAME@$NEW_VERSION"
done
echo ""
echo "  Git tag: v$NEW_VERSION"
echo ""
if $DRY_RUN; then
  warn "This was a DRY RUN — nothing was actually published or committed."
  echo ""
fi
echo "  Next steps:"
echo "     git push origin main --tags"
echo ""
