import { base, mainnet, arbitrum, polygon } from "wagmi/chains";

export const wagmiChains = [mainnet, base, arbitrum, polygon] as const;

export const defaultChain = base;
