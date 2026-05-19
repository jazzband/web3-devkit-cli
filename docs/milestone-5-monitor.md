# Milestone 5: Event Monitor

## Commands

```bash
web3 monitor contract   # Contract events (ERC20 Transfer by default)
web3 monitor wallet     # Wallet ERC20 activity (network USDC)
web3 monitor token      # Specific token / mint transfers
```

## Example

```bash
# USDC on Base
web3 monitor contract \
  --address 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
  --event Transfer \
  --network base

# Shorthand
web3 monitor contract -a 0x833589... -e Transfer -n base

# Wallet USDC in/out on Ethereum
web3 monitor wallet -a 0xYourWallet -n ethereum

# Token with optional wallet filter
web3 monitor token -a 0xTokenAddress -w 0xWallet -n base --symbol USDC
```

## Output

```
New Transfer
From:           0xabc...
To:             0xdef...
Amount:         250.00 USDC
Tx:             0x123...
Block 46212800
```

Press `Ctrl+C` to stop.

## Flags

| Flag | Description |
|------|-------------|
| `-a, --address` | Contract, wallet, or token address |
| `-e, --event` | Event name (contract; default `Transfer`) |
| `-n, --network` | `base`, `ethereum`, `devnet`, … |
| `-c, --chain` | `evm` or `solana` |
| `-w, --wallet` | Filter transfers involving wallet (token) |
| `--symbol` | Override display symbol |
| `--rpc` | Custom RPC URL |
| `--poll` | Poll interval ms (default 4000) |

## Notes

- **EVM** uses HTTP polling (works with public RPCs; no WebSocket required).
- **Wallet monitor** tracks **USDC** transfers on the selected network (uses known USDC addresses).
- **Solana** wallet/token monitors poll recent signatures (devnet-friendly).
- Set `RPC_URL` / `SOLANA_RPC_URL` in `.env` for custom endpoints.
