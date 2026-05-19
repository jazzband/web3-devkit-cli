"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

export default function Home() {
  const { publicKey } = useWallet();

  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>{{projectName}}</h1>
      <p>Next.js + Solana wallet adapter</p>
      <WalletMultiButton />
      {publicKey && <p>Wallet: {publicKey.toBase58()}</p>}
    </main>
  );
}
