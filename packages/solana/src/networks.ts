export type SolanaNetworkId = "mainnet" | "devnet" | "testnet";

export interface SolanaNetworkConfig {
  id: SolanaNetworkId;
  name: string;
  rpcUrl: string;
  nativeSymbol: string;
  /** USDC mint (mainnet / devnet) */
  usdcMint?: string;
}

const MAINNET_RPC = "https://api.mainnet-beta.solana.com";
const DEVNET_RPC = "https://api.devnet.solana.com";
const TESTNET_RPC = "https://api.testnet.solana.com";

export const SOLANA_NETWORKS: Record<SolanaNetworkId, SolanaNetworkConfig> = {
  mainnet: {
    id: "mainnet",
    name: "Solana Mainnet",
    rpcUrl: MAINNET_RPC,
    nativeSymbol: "SOL",
    usdcMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  },
  devnet: {
    id: "devnet",
    name: "Solana Devnet",
    rpcUrl: DEVNET_RPC,
    nativeSymbol: "SOL",
    usdcMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  },
  testnet: {
    id: "testnet",
    name: "Solana Testnet",
    rpcUrl: TESTNET_RPC,
    nativeSymbol: "SOL",
  },
};

export const SOLANA_NETWORK_IDS = Object.keys(SOLANA_NETWORKS) as SolanaNetworkId[];

export function resolveSolanaNetwork(id: string): SolanaNetworkConfig {
  const key = id.toLowerCase() as SolanaNetworkId;
  const network = SOLANA_NETWORKS[key];
  if (!network) {
    throw new Error(
      `Unknown Solana network "${id}". Supported: ${SOLANA_NETWORK_IDS.join(", ")}`,
    );
  }
  return network;
}

export function getSolanaRpcUrl(network: SolanaNetworkConfig, customUrl?: string): string {
  if (customUrl) return customUrl;
  return process.env.SOLANA_RPC_URL ?? network.rpcUrl;
}
