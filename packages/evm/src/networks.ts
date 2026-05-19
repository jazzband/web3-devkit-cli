import {
  arbitrum,
  avalanche,
  base,
  bsc,
  mainnet,
  polygon,
  type Chain,
} from "viem/chains";

export type EvmNetworkId =
  | "ethereum"
  | "base"
  | "arbitrum"
  | "polygon"
  | "bsc"
  | "avalanche";

export interface EvmNetworkConfig {
  id: EvmNetworkId;
  name: string;
  chain: Chain;
  nativeSymbol: string;
  /** USDC contract on this chain (mainnet) */
  usdcAddress?: `0x${string}`;
}

export const EVM_NETWORKS: Record<EvmNetworkId, EvmNetworkConfig> = {
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    chain: mainnet,
    nativeSymbol: "ETH",
    usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  base: {
    id: "base",
    name: "Base",
    chain: base,
    nativeSymbol: "ETH",
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  arbitrum: {
    id: "arbitrum",
    name: "Arbitrum",
    chain: arbitrum,
    nativeSymbol: "ETH",
    usdcAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
  polygon: {
    id: "polygon",
    name: "Polygon",
    chain: polygon,
    nativeSymbol: "POL",
    usdcAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  },
  bsc: {
    id: "bsc",
    name: "BNB Smart Chain",
    chain: bsc,
    nativeSymbol: "BNB",
    usdcAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  },
  avalanche: {
    id: "avalanche",
    name: "Avalanche C-Chain",
    chain: avalanche,
    nativeSymbol: "AVAX",
    usdcAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  },
};

export const EVM_NETWORK_IDS = Object.keys(EVM_NETWORKS) as EvmNetworkId[];

export function resolveEvmNetwork(id: string): EvmNetworkConfig {
  const key = id.toLowerCase() as EvmNetworkId;
  const network = EVM_NETWORKS[key];
  if (!network) {
    throw new Error(
      `Unknown EVM network "${id}". Supported: ${EVM_NETWORK_IDS.join(", ")}`,
    );
  }
  return network;
}

export function getRpcUrl(network: EvmNetworkConfig, customUrl?: string): string {
  if (customUrl) return customUrl;
  const fromEnv = process.env.RPC_URL;
  if (fromEnv) return fromEnv;
  return network.chain.rpcUrls.default.http[0];
}
