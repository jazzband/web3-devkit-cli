"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
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
    <button
      type="button"
      disabled={isPending}
      onClick={() => connect({ connector: injected() })}
    >
      {isPending ? "Connecting…" : "Connect wallet"}
    </button>
  );
}
