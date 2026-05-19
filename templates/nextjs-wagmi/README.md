# {{projectName}}

Next.js + **wagmi** + **viem** frontend scaffold (EVM) via web3-devkit.

## Structure

```
frontend/      # Next.js app with wagmi
contracts/     # Placeholder — link your Foundry/Hardhat project
backend/api/
```

## Quick start

```bash
cd frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` in `.env` (WalletConnect Cloud).

Connect to your contracts by importing ABIs from `contracts/` after you add a Hardhat/Foundry workspace.
