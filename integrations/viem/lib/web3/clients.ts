"use client";

import { createPublicClient, createWalletClient, custom, http, type Chain } from "viem";
import { defaultChain, getChainById } from "./chains";

export function getRpcUrl(chain: Chain): string {
  if (chain.id === defaultChain.id && process.env.NEXT_PUBLIC_RPC_URL) {
    return process.env.NEXT_PUBLIC_RPC_URL;
  }
  return chain.rpcUrls.default.http[0];
}

export function createChainPublicClient(chain: Chain = defaultChain) {
  return createPublicClient({
    chain,
    transport: http(getRpcUrl(chain)),
  });
}

export function createAppWalletClient(chain: Chain = defaultChain) {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No injected wallet found");
  }
  return createWalletClient({
    chain,
    transport: custom(window.ethereum),
  });
}

export function resolveActiveChain(): Chain {
  const id = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? defaultChain.id);
  return getChainById(id) ?? defaultChain;
}
