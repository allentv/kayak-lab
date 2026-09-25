#!/usr/bin/env bash
set -euo pipefail

# Cross-compilation script for kayak CLI
# Builds native binaries for Linux x64, macOS ARM64, and macOS x64

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$PROJECT_DIR/dist"

echo "==> Creating dist directory..."
mkdir -p "$DIST_DIR"

TARGETS=(
  "x86_64-unknown-linux-gnu:kayak-linux-x64"
  "aarch64-apple-darwin:kayak-macos-arm64"
  "x86_64-apple-darwin:kayak-macos-x64"
)

for entry in "${TARGETS[@]}"; do
  IFS=: read -r target output_name <<< "$entry"
  echo ""
  echo "==> Building $output_name ($target)..."
  if deno compile \
    --allow-read \
    --allow-write \
    --allow-env \
    --allow-net \
    --allow-run \
    --allow-ffi \
    --no-check \
    --target "$target" \
    --output "$DIST_DIR/$output_name" \
    "$PROJECT_DIR/src/cli.ts"; then
    echo "    ✓ $output_name built successfully"
  else
    echo "    ✗ $output_name build failed (target may not be available on this host)"
  fi
done

echo ""
echo "==> Build results:"
ls -lh "$DIST_DIR"/kayak-* 2>/dev/null || echo "    No binaries produced"

echo ""
echo "==> Size check (>50MB warning):"
SIZE_WARNING=false
for bin in "$DIST_DIR"/kayak-*; do
  [ -f "$bin" ] || continue
  SIZE_KB=$(du -k "$bin" | cut -f1)
  if [ "$SIZE_KB" -gt 51200 ]; then
    echo "    ⚠ WARNING: $(basename "$bin") is ${SIZE_KB}KB (exceeds 50MB)"
    SIZE_WARNING=true
  fi
done
if [ "$SIZE_WARNING" = false ]; then
  echo "    All binaries under 50MB"
fi
