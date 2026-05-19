# Milestone 2: Contract Generator

## Commands

```bash
web3 generate              # interactive — pick category, chain, variant
web3 generate token        # ERC20, SPL, tax, airdrop, …
web3 generate nft          # ERC721, ERC1155, Metaplex
web3 generate staking
web3 generate vault        # vault + Solana escrow
web3 generate prediction-market
```

Alias: `web3 g`

## Flags

| Flag | Description |
|------|-------------|
| `-c, --chain` | `evm` or `solana` |
| `-v, --variant` | Variant id (e.g. `erc20`, `spl-token`) |
| `-n, --name` | PascalCase contract/program name |
| `-o, --out` | Output directory |
| `-y, --yes` | Skip confirmation |
| `--skip-existing` | Do not overwrite existing files |

## Examples

```bash
# ERC20 into ./contracts
web3 generate token -c evm -v erc20 -n MyToken -o ./contracts -y

# Tax token
web3 generate token -c evm -v erc20-tax -n TaxToken -y

# SPL token scripts
web3 generate token -c solana -v spl-token -n MyToken -o ./scripts -y

# ERC721 NFT
web3 generate nft -c evm -v erc721 -n MyNFT -y

# Anchor vault program
web3 generate vault -c solana -v vault-anchor -n TokenVault -y
```

## EVM variants

| Category | Variants |
|----------|----------|
| token | `erc20`, `erc20-tax`, `erc20-upgradeable`, `erc20-ownable`, `erc20-access-control`, `airdrop` |
| nft | `erc721`, `erc1155` |
| staking | `staking-erc20` |
| vault | `vault-erc20` (ERC4626) |
| prediction-market | `prediction-market` |

Uses OpenZeppelin imports — run `forge install OpenZeppelin/openzeppelin-contracts`.

## Solana variants

| Category | Variants |
|----------|----------|
| token | `spl-token`, `counter-anchor` |
| nft | `metaplex-collection` |
| staking | `staking-anchor` |
| vault | `vault-anchor`, `escrow-anchor` |
| prediction-market | `prediction-market-anchor` |

## Adding a generator

1. Add files under `generators/<category>/<chain>/<variant-id>/`
2. Use placeholders: `{{contractName}}`, `{{contractNameKebab}}`, `{{contractNameSnake}}`
3. Register in `packages/generators/src/registry.ts`
