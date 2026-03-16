#!/usr/bin/env bash
set -euo pipefail

# Usage: ./cli/scripts/build-npm.sh <target>
# Example: ./cli/scripts/build-npm.sh darwin-arm64
#
# Expects:
#   - Rust binary already compiled at cli/target/<rust-target>/release/talentclaw
#   - Next.js already built at .next/standalone/ and .next/static/

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

TARGET="${1:?Usage: build-npm.sh <darwin-arm64|darwin-x64|linux-x64>}"

# Map npm target names to Rust target triples
case "$TARGET" in
  darwin-arm64) RUST_TARGET="aarch64-apple-darwin" ;;
  darwin-x64)   RUST_TARGET="x86_64-apple-darwin" ;;
  linux-x64)    RUST_TARGET="x86_64-unknown-linux-gnu" ;;
  *) echo "Unknown target: $TARGET"; exit 1 ;;
esac

BINARY="$ROOT/cli/target/$RUST_TARGET/release/talentclaw"
DEST="$ROOT/cli/npm/$TARGET/bin/talentclaw"

if [ ! -f "$BINARY" ]; then
  echo "Binary not found: $BINARY"
  echo "Build first: cargo build --release --target $RUST_TARGET"
  exit 1
fi

echo "Copying binary for $TARGET..."
mkdir -p "$(dirname "$DEST")"
cp "$BINARY" "$DEST"
chmod +x "$DEST"

echo "Done: $DEST"
