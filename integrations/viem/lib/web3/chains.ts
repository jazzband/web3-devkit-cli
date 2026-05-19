import { base, mainnet, arbitrum, polygon, bsc, avalanche } from "viem/chains";
import type { Chain } from "viem";

/** Supported EVM chains — extend or trim for your app */
export const supportedChains = [
  mainnet,
  base,
  arbitrum,
  polygon,
  bsc,
  avalanche,
] as const satisfies readonly Chain[];

export const defaultChain = base;

export function getChainById(id: number): Chain | undefined {
  return supportedChains.find((c) => c.id === id);
}
