import {
  applyConfigToEnv,
  getRpcUrlFromConfig,
  loadProjectConfig,
  type ProjectConfig,
} from "@web3-devkit/core";
import { resolveTarget, type ResolvedTarget } from "./resolve-chain.js";

export async function loadConfigWithEnv(cwd: string): Promise<ProjectConfig | null> {
  const config = await loadProjectConfig(cwd);
  if (config) {
    applyConfigToEnv(config);
  }
  return config;
}

export async function resolveTargetWithConfig(
  cwd: string,
  chain?: string,
  network?: string,
): Promise<{ config: ProjectConfig | null; target: ResolvedTarget }> {
  const config = await loadConfigWithEnv(cwd);
  const target = resolveTarget(chain, network, config);
  return { config, target };
}

export function configRpcUrl(
  config: ProjectConfig | null,
  network?: string,
): string | undefined {
  if (!config) return undefined;
  return getRpcUrlFromConfig(config, network);
}
