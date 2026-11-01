#!/bin/bash
# Build, serve with vite preview, run the smoke test, stop the server.
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build >/dev/null
npx vite preview --port 3100 --strictPort >/dev/null 2>&1 &
server=$!
trap 'kill $server' EXIT
for _ in $(seq 50); do curl -fs http://localhost:3100/ >/dev/null && break; sleep 0.2; done
timeout 180 node tests/smoke.mjs http://localhost:3100/
