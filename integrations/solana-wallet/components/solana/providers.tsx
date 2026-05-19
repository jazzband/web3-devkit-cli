"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { type ReactNode, useMemo } from "react";
import { defaultCluster, getSolanaRpcUrl } from "@/lib/solana/cluster";

import "@solana/wallet-adapter-react-ui/styles.css";

export function SolanaProviders({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => getSolanaRpcUrl(defaultCluster), []);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
