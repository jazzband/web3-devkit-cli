import fs from "node:fs/promises";
import path from "node:path";

export type EvmProjectTool = "foundry" | "hardhat" | "none";

export interface EvmProjectInfo {
  tool: EvmProjectTool;
  root: string;
  contractsDir: string;
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function detectEvmProject(cwd: string): Promise<EvmProjectInfo> {
  const candidates = [
    { root: cwd, contractsDir: path.join(cwd, "contracts") },
    { root: path.join(cwd, "contracts"), contractsDir: path.join(cwd, "contracts") },
  ];

  for (const { root, contractsDir } of candidates) {
    if (await exists(path.join(root, "foundry.toml"))) {
      return { tool: "foundry", root, contractsDir };
    }
    if (await exists(path.join(contractsDir, "hardhat.config.ts"))) {
      return { tool: "hardhat", root: contractsDir, contractsDir };
    }
    if (await exists(path.join(contractsDir, "hardhat.config.js"))) {
      return { tool: "hardhat", root: contractsDir, contractsDir };
    }
  }

  return { tool: "none", root: cwd, contractsDir: path.join(cwd, "contracts") };
}
