# {{projectName}}

Solana program workspace bootstrapped with **Anchor** via web3-devkit.

## Structure

```
programs/      # Anchor program (Rust)
frontend/
backend/api/
scripts/
```

## Prerequisites

- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor](https://www.anchor-lang.com/docs/installation)

## Quick start

```bash
anchor build
anchor test
```

## Deploy

```bash
anchor deploy --provider.cluster devnet
# or
./scripts/deploy.sh
```

Set `ANCHOR_WALLET` and `SOLANA_RPC_URL` in `.env`.
