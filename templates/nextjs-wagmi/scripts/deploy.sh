#!/usr/bin/env bash
set -euo pipefail

# {{projectName}} — deployment entrypoint
# Customize per stack (Foundry, Hardhat, Anchor) — see README.md

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "Deploying {{projectName}}..."
echo "Edit scripts/deploy.sh for your network and keys."
