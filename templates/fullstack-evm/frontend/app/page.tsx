"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>{{projectName}}</h1>
      <p>Next.js + wagmi + viem</p>
      {isConnected ? (
        <>
          <p>Connected: {address}</p>
          <button type="button" onClick={() => disconnect()}>
            Disconnect
          </button>
        </>
      ) : (
        <button type="button" onClick={() => connect({ connector: injected() })}>
          Connect wallet
        </button>
      )}
    </main>
  );
}
