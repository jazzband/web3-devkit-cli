"use client";

import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { createWalletConnectConnector } from "./wallet-connect";
import { defaultChain, wagmiChains } from "./chains";

export const wagmiConfig = createConfig({
  chains: wagmiChains,
  connectors: [injected(), createWalletConnectConnector()],
  transports: {
    [defaultChain.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL ?? defaultChain.rpcUrls.default.http[0],
    ),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
