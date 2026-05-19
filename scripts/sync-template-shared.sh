#!/usr/bin/env bash
# Re-copy _shared files into all registered templates (dev helper)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMPLATES=(evm-foundry evm-hardhat solana-anchor nextjs-wagmi nextjs-solana-wallet fullstack-evm fullstack-solana)
for t in "${TEMPLATES[@]}"; do
  cp "$ROOT/templates/_shared/.env.example" "$ROOT/templates/$t/.env.example"
  cp "$ROOT/templates/_shared/docker-compose.yml" "$ROOT/templates/$t/docker-compose.yml"
  cp "$ROOT/templates/_shared/scripts/deploy.sh" "$ROOT/templates/$t/scripts/deploy.sh"
  if [ -d "$ROOT/templates/$t/backend/api/src" ]; then
    cp "$ROOT/templates/_shared/backend/api/src/logger.js" "$ROOT/templates/$t/backend/api/src/logger.js"
    cp "$ROOT/templates/_shared/backend/api/src/index.js" "$ROOT/templates/$t/backend/api/src/index.js"
    cp "$ROOT/templates/_shared/backend/api/package.json" "$ROOT/templates/$t/backend/api/package.json"
  fi
done
echo "Synced shared scaffold into ${#TEMPLATES[@]} templates."
