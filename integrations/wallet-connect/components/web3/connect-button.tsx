"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { createWalletConnectConnector } from "@/lib/web3/wallet-connect";
import { injected } from "wagmi/connectors";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button type="button" onClick={() => disconnect()}>
        {address.slice(0, 6)}…{address.slice(-4)}
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <button type="button" disabled={isPending} onClick={() => connect({ connector: injected() })}>
        Browser wallet
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => connect({ connector: createWalletConnectConnector() })}
      >
        WalletConnect
      </button>
    </div>
  );
}
