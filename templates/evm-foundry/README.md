# {{projectName}}

EVM project bootstrapped with **Foundry** via [web3-devkit](https://github.com/your-org/web3-devkit).

## Structure

```
contracts/     # Solidity, scripts, tests (Forge)
frontend/      # dApp UI
backend/api/   # Optional API
scripts/       # Deployment helpers
```

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)

## Quick start

```bash
cd contracts
forge build
forge test
```

## Deploy

```bash
# Local Anvil
anvil &
./scripts/deploy.sh

# Or directly
cd contracts && forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

## Docker (optional)

```bash
docker compose up anvil
```

Copy `.env.example` to `.env` and set `RPC_URL` and `PRIVATE_KEY`.
