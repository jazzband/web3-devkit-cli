# Web3 Developer Toolkit

Open-source CLI for **EVM** and **Solana** developers to bootstrap projects, deploy contracts/programs, manage wallets, test RPCs, monitor events, and generate production-ready Web3 boilerplates.

## MVP launch (start here)

Six commands are enough for a strong first release:

```bash
web3 init
web3 generate token
web3 wallet balance
web3 rpc test
web3 deploy
web3 monitor wallet
```

Example flow: [docs/mvp-launch.md](docs/mvp-launch.md)

## Milestone 7: Config Manager

```bash
web3 config init
web3 config get defaultChain
web3 config set rpc.base https://mainnet.base.org
```

Project settings live in `.web3-devkit/config.json` (default chain, framework, RPC URLs, wallet type). Other commands pick up defaults when flags are omitted. See [docs/milestone-7-config.md](docs/milestone-7-config.md).

## Milestone 6: Frontend Integration Generator

```bash
web3 add wagmi -y
web3 add rainbowkit -y
web3 add solana-wallet -y
```

Scaffolds wallet providers, chain config, connect buttons, transaction helpers, and contract/program hooks into your Next.js frontend. See [docs/milestone-6-frontend.md](docs/milestone-6-frontend.md).

## Milestone 5: Event Monitor

```bash
web3 monitor contract -a 0x... -e Transfer -n base
web3 monitor wallet -a 0xYourWallet -n ethereum
web3 monitor token -a 0xToken -w 0xWallet -n base
```

Real-time-style polling for **Transfer** events — ideal for debugging contracts and bots. See [docs/milestone-5-monitor.md](docs/milestone-5-monitor.md).

## Milestone 4: Deployment Helper

```bash
web3 deploy evm -n base --estimate    # Gas estimate
web3 deploy evm -n base -y            # Foundry/Hardhat broadcast
web3 deploy solana -n devnet -y       # Anchor deploy
web3 deploy history
web3 verify -n base -a 0x... -c MyToken
```

Deployments saved under `.web3-devkit/deployments/`. See [docs/milestone-4-deploy.md](docs/milestone-4-deploy.md).

## Milestone 3: Wallet & Network Utilities

```bash
web3 wallet create --chain evm
web3 wallet balance -n base -a 0x...
web3 wallet tokens -n ethereum -a 0x...
web3 network check -n base
web3 rpc test -n arbitrum
```

Supports **Ethereum, Base, Arbitrum, Polygon, BSC, Avalanche**, and **Solana**. See [docs/milestone-3-wallet-network.md](docs/milestone-3-wallet-network.md).

## Milestone 2: Contract Generator

Generate Solidity contracts and Solana programs from boilerplate:

```bash
web3 generate token -c evm -v erc20 -n MyToken -o ./contracts -y
web3 generate nft -c evm -v erc721 -n MyNFT -y
web3 generate vault -c solana -v escrow-anchor -n MyEscrow -y
```

See [docs/milestone-2-generate.md](docs/milestone-2-generate.md) for all variants.

## Milestone 1: Project Bootstrap

Scaffold new projects from curated templates with a consistent layout:

- `contracts/` or `programs/` — on-chain code
- `frontend/` — dApp UI
- `backend/api/` — optional API layer
- `.env.example`, `README.md`, deployment scripts, test examples
- Optional Docker setup

### Commands

```bash
web3 init                  # Interactive — pick chain + template
web3 init evm              # EVM templates (Foundry, Hardhat, Next.js + wagmi)
web3 init solana           # Solana templates (Anchor, Next.js wallet)
web3 init fullstack        # Full-stack EVM or Solana
```

### Templates

| ID | Description |
|----|-------------|
| `evm-foundry` | Foundry (Solidity, Forge, Cast) |
| `evm-hardhat` | Hardhat + TypeScript |
| `solana-anchor` | Anchor program workspace |
| `nextjs-wagmi` | Next.js + wagmi (EVM frontend) |
| `nextjs-solana-wallet` | Next.js + Solana wallet adapter |
| `fullstack-evm` | Foundry contracts + Next.js + API |
| `fullstack-solana` | Anchor + Next.js + API |

## Quick start

```bash
npm install
npm run build
npm link   # optional: use `web3` globally

web3 init
web3 generate token -c evm -v erc20 -n MyToken -y
web3 rpc test -n base
web3 wallet balance -n base -a 0x...
```

## Monorepo layout

```
web3-devkit/
├── packages/
│   ├── cli/          # Commander CLI (`web3` binary)
│   ├── core/         # Bootstrap engine, Zod config
│   ├── templates/    # Project bootstrap registry
│   ├── generators/   # Contract generator registry
│   ├── evm/          # EVM utilities (viem)
│   ├── solana/       # Solana utilities
│   ├── generators/   # Contract generator registry
│   └── integrations/ # Frontend integration registry
├── templates/        # Project scaffolds
├── generators/       # Contract/program boilerplates
├── integrations/     # Frontend wallet scaffolds
├── docs/
└── examples/
```

## Tech stack

- TypeScript, Node.js 18+
- Commander, Inquirer, Chalk, Ora
- Zod (config validation)
- Viem, Solana Web3.js, Foundry/Hardhat/Anchor integrations

## License

MIT
