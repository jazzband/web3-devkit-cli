# MVP launch commands

Start with only these six commands for a strong first release:

```bash
web3 init
web3 generate token
web3 wallet balance
web3 rpc test
web3 deploy
web3 monitor wallet
```

## End-to-end flow

### 1. Bootstrap a project

```bash
web3 init
# or non-interactive:
web3 init evm --template evm-foundry --name my-dapp -y
```

### 2. Generate a token contract

```bash
web3 generate token -c evm -v erc20 -n MyToken -o ./contracts -y
```

### 3. Check wallet balance

```bash
web3 wallet balance -n base -a 0xYourAddress
```

### 4. Test RPC connectivity

```bash
web3 rpc test -n base
# or custom URL:
web3 rpc test -u https://mainnet.base.org
```

### 5. Deploy

```bash
# Configure RPC + key in .env, then:
web3 deploy evm -n base -y
# or interactive:
web3 deploy
```

Use `web3 config init` to set `defaultChain` and RPC URLs so `-n` can be omitted.

### 6. Monitor wallet activity

```bash
web3 monitor wallet -a 0xYourWallet -n base
```

Watches ERC20 transfers (e.g. USDC) on the selected network. Press Ctrl+C to stop.

## Optional next commands

After the MVP path works, explore:

- `web3 generate nft|staking|vault|…`
- `web3 wallet create|tokens`
- `web3 network check`
- `web3 deploy solana`, `web3 verify`
- `web3 monitor contract|token`
- `web3 add wagmi`, `web3 config`
