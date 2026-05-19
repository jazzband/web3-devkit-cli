"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { wagmiChains } from "./chains";

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is required for RainbowKit");
}

export const wagmiConfig = getDefaultConfig({
  appName: "Web3 App",
  projectId,
  chains: [...wagmiChains],
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
