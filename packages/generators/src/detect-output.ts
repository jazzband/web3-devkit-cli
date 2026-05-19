import fs from "node:fs/promises";
import path from "node:path";
import type { Chain } from "./registry.js";

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/** Suggest output directory based on current project layout. */
export async function detectOutputDir(cwd: string, chain: Chain): Promise<string> {
  if (chain === "evm") {
    if (await exists(path.join(cwd, "contracts", "src"))) {
      return path.join(cwd, "contracts", "src");
    }
    if (await exists(path.join(cwd, "contracts"))) {
      return path.join(cwd, "contracts");
    }
    if (await exists(path.join(cwd, "foundry.toml"))) {
      return path.join(cwd, "src");
    }
    return path.join(cwd, "contracts");
  }

  // Anchor templates include programs/{{contractNameKebab}}/ — write from project root
  if (await exists(path.join(cwd, "Anchor.toml"))) {
    return cwd;
  }
  if (await exists(path.join(cwd, "programs"))) {
    return cwd;
  }
  return cwd;
}

export function defaultOutputDir(cwd: string, chain: Chain, _contractNameKebab: string): string {
  if (chain === "evm") {
    return path.join(cwd, "contracts");
  }
  // Solana anchor generators embed programs/ in template tree
  return cwd;
}
