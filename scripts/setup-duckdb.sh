#!/usr/bin/env bash
# Setup script for DuckDB native binding
# Run this after `deno install` to download the native binary

set -euo pipefail

echo "Setting up DuckDB native binding..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    deno install
fi

# Run node-pre-gyp install for DuckDB
echo "Installing DuckDB native binary..."
npx @mapbox/node-pre-gyp install --fallback-to-build

echo "DuckDB setup complete!"