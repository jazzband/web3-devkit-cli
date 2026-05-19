import fs from "node:fs/promises";
import path from "node:path";

export interface SolanaProjectInfo {
  root: string;
  anchorToml: string;
  programsDir: string;
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function detectSolanaProject(cwd: string): Promise<SolanaProjectInfo | null> {
  const anchorToml = path.join(cwd, "Anchor.toml");
  if (await exists(anchorToml)) {
    return {
      root: cwd,
      anchorToml,
      programsDir: path.join(cwd, "programs"),
    };
  }
  return null;
}
