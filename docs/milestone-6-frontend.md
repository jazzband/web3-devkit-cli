# Milestone 6: Frontend Integration Generator

## Commands

```bash
web3 add wallet-connect   # WalletConnect + wagmi
web3 add wagmi            # wagmi provider, hooks, tx helpers
web3 add viem             # viem chains + clients
web3 add rainbowkit       # RainbowKit UI + wagmi
web3 add solana-wallet    # Solana wallet adapter
```

Interactive picker:

```bash
web3 add
```

## Flags

| Flag | Description |
|------|-------------|
| `-d, --dir <path>` | Frontend directory (default: `./frontend` or Next.js root) |
| `-y, --yes` | Skip confirmation |
| `--skip-existing` | Do not overwrite existing files |

## Generated artifacts

Each integration scaffolds into your frontend (typically under `lib/` and `components/`):

| Piece | EVM (wagmi / RainbowKit / WalletConnect / viem) | Solana |
|-------|--------------------------------------------------|--------|
| Wallet provider | `components/web3/providers.tsx` | `components/solana/providers.tsx` |
| Chain config | `lib/web3/chains.ts` | `lib/solana/cluster.ts` |
| Connect button | `components/web3/connect-button.tsx` | `components/solana/connect-button.tsx` |
| Transaction helper | `lib/web3/transaction.ts` | `lib/solana/transaction.ts` |
| Read / write hooks | `hooks/use-contract-*.ts` | `hooks/use-program-*.ts` |

`viem` is a lighter integration (chains + clients only). Pair it with `wagmi` or `rainbowkit` for full wallet UI.

## Example

From a fullstack or Next.js project root:

```bash
web3 add wagmi -y
cd frontend && npm install
```

Add env vars printed by the CLI, wrap your layout with `Web3Providers`, and drop in `<ConnectButton />`.

## Environment variables

| Integration | Variables |
|-------------|-----------|
| viem | `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_CHAIN_ID` |
| wagmi | `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`, `NEXT_PUBLIC_CHAIN_ID` |
| wallet-connect | `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` |
| rainbowkit | `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` |
| solana-wallet | `NEXT_PUBLIC_SOLANA_RPC` |
