# {{projectName}}

Full-stack **EVM** project: Foundry contracts + Next.js (wagmi) + API.

## Structure

```
contracts/     # Foundry
frontend/      # Next.js + wagmi
backend/api/   # Node health API
scripts/
```

## Quick start

```bash
# Terminal 1 — local chain
docker compose up anvil

# Terminal 2 — contracts
cd contracts && forge build && forge test

# Terminal 3 — frontend
cd frontend && npm install && npm run dev

# Terminal 4 — API
cd backend/api && npm run dev
```

Deploy contracts with `./scripts/deploy.sh` or `forge script`.
