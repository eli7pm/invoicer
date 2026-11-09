#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
IMAGE=invoicer-api
PORT=3199

echo "› Updating dependencies within their version ranges (a newer Puppeteer brings a newer Chrome)"
pnpm up -r
pnpm audit --prod || echo "  (audit found issues, review them above)"

echo "› Rebuilding the image with the newest Debian and Node 26 packages, and the Chrome pinned by Puppeteer"
docker build --pull --no-cache -t "$IMAGE" .
docker run --rm --entrypoint /opt/chrome/chrome-headless-shell "$IMAGE" --version
docker image inspect "$IMAGE" --format '{{.Size}}' >/dev/null && docker images "$IMAGE"

echo "› Smoke test with Render's free limits (512 MB, 0.1 CPU)"
CID=$(docker run -d --rm --memory 512m --cpus 0.1 -p "$PORT:3100" -e MAX_CONCURRENT_RENDERS=1 "$IMAGE")
trap 'docker stop "$CID" >/dev/null' EXIT
for _ in $(seq 1 30); do curl -fs "localhost:$PORT/health" >/dev/null && break; sleep 1; done
BYTES=$(curl -fs -X POST "localhost:$PORT/api/preview" -H 'Content-Type: application/json' \
  -d '{"invoice":{"invoiceNumber":"1","from":"Test","billTo":"Test","lineItems":[{"description":"Check","quantity":1,"rate":1000}]}}' | wc -c)
[ "$BYTES" -gt 1000 ] || { echo "  ✗ preview failed"; exit 1; }
echo "  ✓ PDF rendered ($BYTES bytes)"

if [ -n "${RENDER_API_KEY:-}" ] && [ -n "${RENDER_SERVICE_ID:-}" ]; then
  echo "› Redeploying on Render with a clean build cache"
  curl -fsS -X POST "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys" \
    -H "Authorization: Bearer $RENDER_API_KEY" -H 'Content-Type: application/json' \
    -d '{"clearCache":"clear"}' >/dev/null
  echo "  ✓ deploy started"
else
  echo "› Commit and push any dependency changes, then in Render choose Manual Deploy › Clear build cache & deploy"
  echo "  (or set RENDER_API_KEY and RENDER_SERVICE_ID to have this script do it)"
fi
