import type { GenerateCategory } from "@web3-devkit/core";

export type Chain = "evm" | "solana";

export interface GeneratorVariantMeta {
  id: string;
  category: GenerateCategory;
  chain: Chain;
  name: string;
  description: string;
  defaultContractName: string;
}

export const GENERATOR_VARIANTS: GeneratorVariantMeta[] = [
  // ── Token ──
  {
    id: "erc20",
    category: "token",
    chain: "evm",
    name: "ERC20",
    description: "Standard fungible token (OpenZeppelin ERC20)",
    defaultContractName: "MyToken",
  },
  {
    id: "erc20-tax",
    category: "token",
    chain: "evm",
    name: "Tax Token",
    description: "ERC20 with buy/sell tax and treasury",
    defaultContractName: "TaxToken",
  },
  {
    id: "erc20-upgradeable",
    category: "token",
    chain: "evm",
    name: "Upgradeable ERC20",
    description: "UUPS upgradeable ERC20 proxy pattern",
    defaultContractName: "MyToken",
  },
  {
    id: "erc20-ownable",
    category: "token",
    chain: "evm",
    name: "ERC20 + Ownable",
    description: "Mintable ERC20 with single-owner access control",
    defaultContractName: "MyToken",
  },
  {
    id: "erc20-access-control",
    category: "token",
    chain: "evm",
    name: "ERC20 + AccessControl",
    description: "Role-based mint/pause (MINTER, PAUSER roles)",
    defaultContractName: "MyToken",
  },
  {
    id: "airdrop",
    category: "token",
    chain: "evm",
    name: "Airdrop",
    description: "Merkle-tree token airdrop claim contract",
    defaultContractName: "TokenAirdrop",
  },
  {
    id: "spl-token",
    category: "token",
    chain: "solana",
    name: "SPL Token",
    description: "SPL token creation scripts (TypeScript)",
    defaultContractName: "MyToken",
  },
  // ── NFT ──
  {
    id: "erc721",
    category: "nft",
    chain: "evm",
    name: "ERC721",
    description: "NFT collection with URI storage",
    defaultContractName: "MyNFT",
  },
  {
    id: "erc1155",
    category: "nft",
    chain: "evm",
    name: "ERC1155",
    description: "Multi-token semi-fungible standard",
    defaultContractName: "MyMultiToken",
  },
  {
    id: "metaplex-collection",
    category: "nft",
    chain: "solana",
    name: "NFT Collection Setup",
    description: "Metaplex collection + candy machine setup scripts",
    defaultContractName: "MyCollection",
  },
  // ── Staking ──
  {
    id: "staking-erc20",
    category: "staking",
    chain: "evm",
    name: "ERC20 Staking",
    description: "Stake ERC20, earn reward token over time",
    defaultContractName: "StakingRewards",
  },
  {
    id: "staking-anchor",
    category: "staking",
    chain: "solana",
    name: "Staking Program",
    description: "Anchor staking pool skeleton",
    defaultContractName: "StakingPool",
  },
  // ── Vault ──
  {
    id: "vault-erc20",
    category: "vault",
    chain: "evm",
    name: "ERC20 Vault",
    description: "Simple deposit/withdraw vault for ERC20",
    defaultContractName: "TokenVault",
  },
  {
    id: "vault-anchor",
    category: "vault",
    chain: "solana",
    name: "Vault Program",
    description: "Anchor vault for SOL/SPL deposits",
    defaultContractName: "Vault",
  },
  {
    id: "escrow-anchor",
    category: "vault",
    chain: "solana",
    name: "Escrow Program",
    description: "Two-party escrow with release authority",
    defaultContractName: "Escrow",
  },
  // ── Prediction market ──
  {
    id: "prediction-market",
    category: "prediction-market",
    chain: "evm",
    name: "Prediction Market",
    description: "Binary outcome market skeleton (yes/no pools)",
    defaultContractName: "PredictionMarket",
  },
  {
    id: "prediction-market-anchor",
    category: "prediction-market",
    chain: "solana",
    name: "Prediction Market",
    description: "Anchor prediction market skeleton",
    defaultContractName: "PredictionMarket",
  },
  // ── Solana extras (counter from bootstrap spec) ──
  {
    id: "counter-anchor",
    category: "token",
    chain: "solana",
    name: "Anchor Counter",
    description: "Minimal Anchor counter program example",
    defaultContractName: "Counter",
  },
];

export function getVariantsByCategory(category: GenerateCategory): GeneratorVariantMeta[] {
  return GENERATOR_VARIANTS.filter((v) => v.category === category);
}

export function getVariantsByCategoryAndChain(
  category: GenerateCategory,
  chain: Chain,
): GeneratorVariantMeta[] {
  return GENERATOR_VARIANTS.filter((v) => v.category === category && v.chain === chain);
}

export function getVariant(
  category: GenerateCategory,
  chain: Chain,
  variantId: string,
): GeneratorVariantMeta | undefined {
  return GENERATOR_VARIANTS.find(
    (v) => v.category === category && v.chain === chain && v.id === variantId,
  );
}

export function resolveGeneratorsRoot(): string {
  const fromEnv = process.env.WEB3_DEVKIT_GENERATORS;
  if (fromEnv) return fromEnv;
  return new URL("../../../generators", import.meta.url).pathname;
}
