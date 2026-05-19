# Milestone 3: Wallet & Network Utilities

## Commands

```bash
web3 wallet create              # New EVM or Solana wallet
web3 wallet balance             # Native balance (ETH, SOL, …)
web3 wallet tokens              # Token balances (USDC, …)

web3 network check              # Chain health, block, latency
web3 rpc test                   # RPC latency + connectivity
```

## Supported networks

### EVM (`--chain evm`)

| `--network` | Chain ID | Native |
|-------------|----------|--------|
| `ethereum` | 1 | ETH |
| `base` | 8453 | ETH |
| `arbitrum` | 42161 | ETH |
| `polygon` | 137 | POL |
| `bsc` | 56 | BNB |
| `avalanche` | 43114 | AVAX |

### Solana (`--chain solana`)

| `--network` | Description |
|-------------|-------------|
| `mainnet` / `solana` | Mainnet-beta |
| `devnet` | Devnet |
| `testnet` | Testnet |

## Examples

```bash
# Create wallets
web3 wallet create --chain evm
web3 wallet create --chain solana -o ./keypair.json

# Balances on Base
web3 wallet balance -n base -a 0xYourAddress
web3 wallet tokens -n base -a 0xYourAddress --tokens

# Full summary (native + USDC)
web3 wallet balance -n base -a 0x... --tokens

# Network + RPC
web3 network check -n base
web3 rpc test -n base
web3 rpc test -u https://mainnet.base.org

# Solana
web3 wallet balance -c solana -n devnet -a <pubkey>
web3 network check -c solana -n mainnet
```

## Environment

- `RPC_URL` — override EVM RPC
- `SOLANA_RPC_URL` — override Solana RPC

## Example output

```
Wallet:          0x1234...abcd
ETH Balance:     1.42
USDC Balance:    500.00
RPC Latency:     184ms
Chain ID:        8453
Status:          Healthy
```
