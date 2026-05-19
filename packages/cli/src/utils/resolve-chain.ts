import type { ProjectConfig } from "@web3-devkit/core";
import { resolveEvmNetwork, type EvmNetworkId } from "@web3-devkit/evm";
import { resolveSolanaNetwork, type SolanaNetworkId } from "@web3-devkit/solana";

export type ChainKind = "evm" | "solana";

export interface ResolvedTarget {
  chain: ChainKind;
  evmNetwork?: ReturnType<typeof resolveEvmNetwork>;
  solanaNetwork?: ReturnType<typeof resolveSolanaNetwork>;
}

const EVM_ALIASES: Record<string, EvmNetworkId> = {
  eth: "ethereum",
  ethereum: "ethereum",
  mainnet: "ethereum",
  base: "base",
  arb: "arbitrum",
  arbitrum: "arbitrum",
  polygon: "polygon",
  matic: "polygon",
  bsc: "bsc",
  bnb: "bsc",
  avax: "avalanche",
  avalanche: "avalanche",
};

const SOLANA_ALIASES: Record<string, SolanaNetworkId> = {
  solana: "mainnet",
  mainnet: "mainnet",
  devnet: "devnet",
  testnet: "testnet",
};

export function resolveTarget(
  chain?: string,
  network?: string,
  config?: ProjectConfig | null,
): ResolvedTarget {
  const chainLower = chain?.toLowerCase() ?? config?.chainType;
  const networkLower = network?.toLowerCase() ?? config?.defaultChain ?? "ethereum";

  if (chainLower === "solana" || networkLower === "solana") {
    const solId = networkLower === "solana" ? "mainnet" : (SOLANA_ALIASES[networkLower] ?? "mainnet");
    return { chain: "solana", solanaNetwork: resolveSolanaNetwork(solId) };
  }

  if (chainLower === "evm" || !chainLower) {
    const evmId = EVM_ALIASES[networkLower];
    if (!evmId) {
      if (SOLANA_ALIASES[networkLower] && chainLower !== "evm") {
        return {
          chain: "solana",
          solanaNetwork: resolveSolanaNetwork(SOLANA_ALIASES[networkLower]),
        };
      }
      throw new Error(`Unknown network "${network}". Use --chain evm|solana`);
    }
    return { chain: "evm", evmNetwork: resolveEvmNetwork(evmId) };
  }

  throw new Error(`Unknown chain "${chain}". Use evm or solana.`);
}
