# {{projectName}}

EVM project bootstrapped with **Hardhat** via web3-devkit.

## Structure

```
contracts/     # Hardhat workspace (Solidity + TS deploy/test)
frontend/
backend/api/
scripts/
```

## Prerequisites

- Node.js 18+
- npm or pnpm

## Quick start

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

## Deploy

```bash
npx hardhat run scripts/deploy.ts --network localhost
# or
./scripts/deploy.sh
```

Copy `.env.example` to `contracts/.env` for keys and RPC URLs.
