import { base, mainnet } from "wagmi/chains";

export const wagmiChains = [mainnet, base] as const;

export const defaultChain = base;
