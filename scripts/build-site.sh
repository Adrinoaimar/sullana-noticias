#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
rm -rf "$root/dist"
mkdir -p "$root/dist/server" "$root/dist/.openai/drizzle"
cp "$root/worker/index.js" "$root/dist/server/index.js"
cp "$root/worker/editorial.js" "$root/dist/server/editorial.js"
cp "$root/.openai/hosting.json" "$root/dist/.openai/hosting.json"
cp "$root"/worker/migrations/*.sql "$root/dist/.openai/drizzle/"
echo "Built Cloudflare Worker artifact"
