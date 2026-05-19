export type IntegrationId =
  | "wallet-connect"
  | "wagmi"
  | "viem"
  | "rainbowkit"
  | "solana-wallet";

export interface IntegrationMeta {
  id: IntegrationId;
  name: string;
  description: string;
  npmDependencies: Record<string, string>;
  npmDevDependencies?: Record<string, string>;
  envVars: string[];
}

export const INTEGRATIONS: IntegrationMeta[] = [
  {
    id: "viem",
    name: "viem",
    description: "Chain config and public/wallet viem clients",
    npmDependencies: {
      viem: "^2.23.2",
    },
    envVars: ["NEXT_PUBLIC_RPC_URL", "NEXT_PUBLIC_CHAIN_ID"],
  },
  {
    id: "wagmi",
    name: "wagmi",
    description: "Wallet provider, connect flow, contract read/write hooks, tx helper",
    npmDependencies: {
      wagmi: "^2.14.12",
      viem: "^2.23.2",
      "@tanstack/react-query": "^5.67.3",
    },
    envVars: ["NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID", "NEXT_PUBLIC_CHAIN_ID"],
  },
  {
    id: "wallet-connect",
    name: "WalletConnect",
    description: "WalletConnect connector for wagmi",
    npmDependencies: {
      wagmi: "^2.14.12",
      viem: "^2.23.2",
      "@tanstack/react-query": "^5.67.3",
      "@walletconnect/ethereum-provider": "^2.18.0",
    },
    envVars: ["NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID"],
  },
  {
    id: "rainbowkit",
    name: "RainbowKit",
    description: "RainbowKit provider and connect button",
    npmDependencies: {
      "@rainbow-me/rainbowkit": "^2.2.4",
      wagmi: "^2.14.12",
      viem: "^2.23.2",
      "@tanstack/react-query": "^5.67.3",
    },
    envVars: ["NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID"],
  },
  {
    id: "solana-wallet",
    name: "Solana Wallet",
    description: "Solana wallet adapter provider and connect button",
    npmDependencies: {
      "@solana/wallet-adapter-base": "^0.9.23",
      "@solana/wallet-adapter-react": "^0.15.35",
      "@solana/wallet-adapter-react-ui": "^0.9.35",
      "@solana/wallet-adapter-wallets": "^0.19.32",
      "@solana/web3.js": "^1.98.0",
    },
    envVars: ["NEXT_PUBLIC_SOLANA_RPC"],
  },
];

export function getIntegration(id: string): IntegrationMeta | undefined {
  return INTEGRATIONS.find((i) => i.id === id);
}

export function resolveIntegrationsRoot(): string {
  const fromEnv = process.env.WEB3_DEVKIT_INTEGRATIONS;
  if (fromEnv) return fromEnv;
  return new URL("../../../integrations", import.meta.url).pathname;
}
