import type { EvmNetworkId } from "./networks.js";

export interface ExplorerConfig {
  apiUrl: string;
  browserUrl: string;
}

/** Etherscan-compatible API endpoints per chain */
export const EXPLORER_APIS: Partial<Record<EvmNetworkId, ExplorerConfig>> = {
  ethereum: {
    apiUrl: "https://api.etherscan.io/api",
    browserUrl: "https://etherscan.io",
  },
  base: {
    apiUrl: "https://api.basescan.org/api",
    browserUrl: "https://basescan.org",
  },
  arbitrum: {
    apiUrl: "https://api.arbiscan.io/api",
    browserUrl: "https://arbiscan.io",
  },
  polygon: {
    apiUrl: "https://api.polygonscan.com/api",
    browserUrl: "https://polygonscan.com",
  },
  bsc: {
    apiUrl: "https://api.bscscan.com/api",
    browserUrl: "https://bscscan.com",
  },
  avalanche: {
    apiUrl: "https://api.snowtrace.io/api",
    browserUrl: "https://snowtrace.io",
  },
};
