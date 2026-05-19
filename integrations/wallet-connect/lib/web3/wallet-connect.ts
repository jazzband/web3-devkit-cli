"use client";

import { walletConnect } from "wagmi/connectors";

export function createWalletConnectConnector() {
  const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
  if (!projectId) {
    throw new Error("NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is required");
  }

  return walletConnect({
    projectId,
    metadata: {
      name: "Web3 App",
      description: "WalletConnect via web3-devkit",
      url: typeof window !== "undefined" ? window.location.origin : "https://localhost",
      icons: ["https://walletconnect.com/walletconnect-logo.png"],
    },
    showQrModal: true,
  });
}
