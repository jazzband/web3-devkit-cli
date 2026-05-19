# Web3 Developer Toolkit

Open-source CLI for **EVM** and **Solana** developers. Bootstrap projects, generate contracts, manage wallets, test RPCs, deploy, monitor events, and scaffold frontend wallet integrations.

## MVP launch

Six commands are enough for a strong first release:

```bash
web3 init
web3 generate token
web3 wallet balance
web3 rpc test
web3 deploy
web3 monitor wallet
```

Full walkthrough: [docs/mvp-launch.md](docs/mvp-launch.md)

## Quick start

```bash
npm install
npm run build
npm link   # optional: run `web3` globally

web3 init
web3 generate token -c evm -v erc20 -n MyToken -y
web3 rpc test -n base
web3 wallet balance -n base -a 0x...
```

Run the CLI without linking: `npm run web3 -- <command>`.

---

## Features by milestone

### Milestone 1 — Project bootstrap

Scaffold new projects from curated templates with a consistent layout:

- `contracts/` or `programs/` — on-chain code
- `frontend/` — dApp UI
- `backend/api/` — optional API layer
- `.env.example`, `README.md`, deployment scripts, and test examples
- Optional Docker setup

**Commands**

```bash
web3 init                  # Interactive — pick chain + template
web3 init evm              # EVM templates (Foundry, Hardhat, Next.js + wagmi)
web3 init solana           # Solana templates (Anchor, Next.js wallet)
web3 init fullstack        # Full-stack EVM or Solana
```

**Templates**

| ID | Description |
|----|-------------|
| `evm-foundry` | Foundry (Solidity, Forge, Cast) |
| `evm-hardhat` | Hardhat + TypeScript |
| `solana-anchor` | Anchor program workspace |
| `nextjs-wagmi` | Next.js + wagmi (EVM frontend) |
| `nextjs-solana-wallet` | Next.js + Solana wallet adapter |
| `fullstack-evm` | Foundry contracts + Next.js + API |
| `fullstack-solana` | Anchor + Next.js + API |

→ [docs/milestone-1-bootstrap.md](docs/milestone-1-bootstrap.md)

---

### Milestone 2 — Contract generator

Generate Solidity contracts and Solana programs from boilerplate.

```bash
web3 generate token -c evm -v erc20 -n MyToken -o ./contracts -y
web3 generate nft -c evm -v erc721 -n MyNFT -y
web3 generate vault -c solana -v escrow-anchor -n MyEscrow -y
```

Categories: `token`, `nft`, `staking`, `vault`, `prediction-market`.

→ [docs/milestone-2-generate.md](docs/milestone-2-generate.md)

---

### Milestone 3 — Wallet & network utilities

Create wallets, check balances, inspect tokens, and validate RPC connectivity.

```bash
web3 wallet create --chain evm
web3 wallet balance -n base -a 0x...
web3 wallet tokens -n ethereum -a 0x...
web3 network check -n base
web3 rpc test -n arbitrum
```

**Networks:** Ethereum, Base, Arbitrum, Polygon, BSC, Avalanche, and Solana (mainnet / devnet / testnet).

→ [docs/milestone-3-wallet-network.md](docs/milestone-3-wallet-network.md)

---

### Milestone 4 — Deployment helper

Deploy EVM contracts (Foundry / Hardhat) and Solana programs (Anchor), with history and explorer verification.

```bash
web3 deploy evm -n base --estimate    # Gas estimate
web3 deploy evm -n base -y            # Broadcast
web3 deploy solana -n devnet -y       # Anchor deploy
web3 deploy history
web3 verify -n base -a 0x... -c MyToken
```

Deployments are stored under `.web3-devkit/deployments/`.

→ [docs/milestone-4-deploy.md](docs/milestone-4-deploy.md)

---

### Milestone 5 — Event monitor

Poll on-chain activity for contracts, wallets, and tokens — useful for debugging and bots.

```bash
web3 monitor contract -a 0x... -e Transfer -n base
web3 monitor wallet -a 0xYourWallet -n ethereum
web3 monitor token -a 0xToken -w 0xWallet -n base
```

→ [docs/milestone-5-monitor.md](docs/milestone-5-monitor.md)

---

### Milestone 6 — Frontend integration generator

Add wallet providers, chain config, connect buttons, transaction helpers, and contract hooks to a Next.js frontend.

```bash
web3 add wagmi -y
web3 add rainbowkit -y
web3 add wallet-connect -y
web3 add viem -y
web3 add solana-wallet -y
```

→ [docs/milestone-6-frontend.md](docs/milestone-6-frontend.md)

---

### Milestone 7 — Config manager

Persist project defaults so other commands can omit flags.

```bash
web3 config init
web3 config get defaultChain
web3 config set rpc.base https://mainnet.base.org
```

Settings live in `.web3-devkit/config.json` (default chain, framework, per-network RPC URLs, wallet type). Used by deploy, wallet, network, RPC, and monitor commands when flags are omitted.

→ [docs/milestone-7-config.md](docs/milestone-7-config.md)

---

## Monorepo layout

```
web3-devkit/
├── packages/
│   ├── cli/           # `web3` binary (Commander)
│   ├── core/          # Bootstrap, config, deploy store
│   ├── templates/     # Init template registry
│   ├── generators/    # Contract generator registry
│   ├── integrations/  # Frontend integration registry
│   ├── evm/           # viem utilities
│   └── solana/        # Solana Web3.js utilities
├── templates/         # Project scaffolds
├── generators/        # Contract/program boilerplates
├── integrations/      # Frontend wallet scaffolds
└── docs/
```

Dependencies are declared in each workspace under `packages/*`, not in the root `package.json`. Run `npm install` at the repo root to install all workspaces.

## Tech stack

- **Runtime:** Node.js 18+, TypeScript
- **CLI:** Commander, Inquirer, Chalk, Ora
- **Validation:** Zod
- **Chains:** Viem (EVM), `@solana/web3.js` (Solana)
- **Tooling:** Foundry, Hardhat, Anchor

## License

MIT
