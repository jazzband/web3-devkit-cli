import type { ProjectConfig } from "./schema.js";

/** Apply config RPC URLs to process.env when not already set */
export function applyConfigToEnv(config: ProjectConfig): void {
  const rpcUrl = config.rpc[config.defaultChain];
  if (!rpcUrl) return;

  if (config.chainType === "solana") {
    if (!process.env.SOLANA_RPC_URL) {
      process.env.SOLANA_RPC_URL = rpcUrl;
    }
    return;
  }

  if (!process.env.RPC_URL) {
    process.env.RPC_URL = rpcUrl;
  }
}

export function getRpcUrlFromConfig(
  config: ProjectConfig,
  network?: string,
): string | undefined {
  const key = network ?? config.defaultChain;
  return config.rpc[key];
}
