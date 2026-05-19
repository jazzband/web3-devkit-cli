# Milestone 4: Deployment Helper

## Commands

```bash
web3 deploy              # Interactive — pick EVM or Solana
web3 deploy evm          # Foundry / Hardhat deploy
web3 deploy solana       # Anchor deploy
web3 deploy history      # List .web3-devkit/deployments/*.json

web3 verify              # Verify contract on Etherscan-compatible explorer
```

## Features

| Feature | Description |
|---------|-------------|
| `.env` validation | Zod checks before deploy (keys, RPC URLs) |
| Chain selection | `--network` or interactive prompt |
| Gas estimation | `web3 deploy evm --estimate` |
| Verification | `forge verify-contract` / `hardhat verify` |
| Deployment history | Last 20 deploys per network file |
| Artifacts | Broadcast JSON, IDL paths stored in record |

## Storage

```
.web3-devkit/deployments/
  base.json
  arbitrum.json
  ethereum.json
  solana-devnet.json
  solana-mainnet.json
```

Example `base.json`:

```json
{
  "latest": {
    "chain": "evm",
    "network": "Base",
    "networkKey": "base",
    "deployedAt": "2026-05-19T12:00:00.000Z",
    "deployer": "0x...",
    "contracts": [{ "name": "MyToken", "address": "0x...", "txHash": "0x..." }],
    "tool": "foundry",
    "estimatedGasCost": "0.002 ETH"
  },
  "history": []
}
```

## Required `.env`

### EVM

```env
RPC_URL=https://mainnet.base.org
PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=...   # for verify
```

### Solana

```env
SOLANA_RPC_URL=https://api.devnet.solana.com
ANCHOR_WALLET=~/.config/solana/id.json
```

## Examples

```bash
# Gas estimate only
web3 deploy evm -n base --estimate

# Deploy with Foundry (from project with foundry.toml)
web3 deploy evm -n base -y

# Custom forge script
web3 deploy evm -n arbitrum --script script/Deploy.s.sol:DeployScript -y

# Anchor devnet
web3 deploy solana -n devnet -y

# Verify (uses latest deployment if flags omitted)
web3 verify -n base -a 0xContractAddress -c MyToken
```

## Tool detection

| File | Tool |
|------|------|
| `foundry.toml` | Foundry (`forge script --broadcast`) |
| `hardhat.config.ts` | Hardhat (`hardhat run`) |
| `Anchor.toml` | Anchor (`anchor deploy`) |
