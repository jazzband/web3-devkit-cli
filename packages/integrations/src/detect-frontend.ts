import fs from "node:fs/promises";
import path from "node:path";

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function detectFrontendDir(cwd: string): Promise<string> {
  if (await exists(path.join(cwd, "frontend", "package.json"))) {
    return path.join(cwd, "frontend");
  }
  if (await exists(path.join(cwd, "package.json"))) {
    const pkg = JSON.parse(await fs.readFile(path.join(cwd, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
    };
    if (pkg.dependencies?.next) return cwd;
  }
  return path.join(cwd, "frontend");
}
