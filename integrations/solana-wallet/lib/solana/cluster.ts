import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";

export type SolanaCluster = "mainnet-beta" | "devnet" | "testnet";

const networkMap: Record<SolanaCluster, WalletAdapterNetwork> = {
  "mainnet-beta": WalletAdapterNetwork.Mainnet,
  devnet: WalletAdapterNetwork.Devnet,
  testnet: WalletAdapterNetwork.Testnet,
};

export const defaultCluster: SolanaCluster = "devnet";

export function getSolanaNetwork(cluster: SolanaCluster = defaultCluster): WalletAdapterNetwork {
  return networkMap[cluster];
}

export function getSolanaRpcUrl(cluster: SolanaCluster = defaultCluster): string {
  if (process.env.NEXT_PUBLIC_SOLANA_RPC) {
    return process.env.NEXT_PUBLIC_SOLANA_RPC;
  }
  return clusterApiUrl(getSolanaNetwork(cluster));
}
