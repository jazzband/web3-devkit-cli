# Milestone 7: Config Manager

## Command

```bash
web3 config              # Show current config
web3 config init         # Interactive setup
web3 config get <key>    # Read a value (e.g. rpc.base)
web3 config set <key> <value>
web3 config path         # Print config file path
```

## Config file

Stored at `.web3-devkit/config.json`:

```json
{
  "defaultChain": "base",
  "chainType": "evm",
  "framework": "foundry",
  "rpc": {
    "base": "https://mainnet.base.org"
  },
  "wallet": {
    "type": "privateKey"
  }
}
```

| Field | Description |
|-------|-------------|
| `defaultChain` | Default network when `-n` is omitted (EVM id or Solana cluster) |
| `chainType` | `evm` or `solana` |
| `framework` | `foundry`, `hardhat`, or `anchor` |
| `rpc` | Per-network RPC URLs |
| `wallet.type` | `privateKey`, `env`, or `hardware` |

## Integration

When a config file exists, these commands use `defaultChain` and `rpc.<network>` automatically:

- `web3 deploy`, `web3 verify`
- `web3 wallet balance|tokens`
- `web3 network check`, `web3 rpc test`
- `web3 monitor`

RPC URLs from config are applied to `RPC_URL` / `SOLANA_RPC_URL` when not set in `.env`.

## Examples

```bash
web3 config init
web3 config set defaultChain base
web3 config set rpc.base https://base-mainnet.g.alchemy.com/v2/KEY
web3 config get defaultChain
web3 deploy evm -y          # uses defaultChain + rpc from config
```
