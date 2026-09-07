#!/usr/bin/env bash
# PALLADIUM NULL — one-command lab boot.
# Defensive build. There is no other kind.
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1; then
  echo "[palladium-null] npm not found. Install Node.js LTS, then re-run."
  exit 1
fi

echo "[palladium-null] installing dependencies..."
npm install

echo "[palladium-null] starting (build + serve on one port)..."
npm start
