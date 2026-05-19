import fs from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_PROJECT_CONFIG,
  parseProjectConfig,
  type ProjectConfig,
} from "./schema.js";

export const CONFIG_DIR = ".web3-devkit";
export const CONFIG_FILENAME = "config.json";

export function getConfigDir(cwd: string): string {
  return path.join(cwd, CONFIG_DIR);
}

export function getConfigFilePath(cwd: string): string {
  return path.join(getConfigDir(cwd), CONFIG_FILENAME);
}

export async function configExists(cwd: string): Promise<boolean> {
  try {
    await fs.access(getConfigFilePath(cwd));
    return true;
  } catch {
    return false;
  }
}

export async function loadProjectConfig(cwd: string): Promise<ProjectConfig | null> {
  const filePath = getConfigFilePath(cwd);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return parseProjectConfig(JSON.parse(raw) as unknown);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

export async function loadProjectConfigOrDefault(cwd: string): Promise<ProjectConfig> {
  const loaded = await loadProjectConfig(cwd);
  return loaded ?? { ...DEFAULT_PROJECT_CONFIG };
}

export async function saveProjectConfig(cwd: string, config: ProjectConfig): Promise<string> {
  const parsed = parseProjectConfig(config);
  const dir = getConfigDir(cwd);
  await fs.mkdir(dir, { recursive: true });
  const filePath = getConfigFilePath(cwd);
  await fs.writeFile(filePath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  return filePath;
}

export async function initProjectConfig(
  cwd: string,
  partial?: Partial<ProjectConfig>,
): Promise<{ path: string; config: ProjectConfig }> {
  const config: ProjectConfig = {
    ...DEFAULT_PROJECT_CONFIG,
    ...partial,
    rpc: { ...DEFAULT_PROJECT_CONFIG.rpc, ...partial?.rpc },
    wallet: { ...DEFAULT_PROJECT_CONFIG.wallet, ...partial?.wallet },
  };
  const filePath = await saveProjectConfig(cwd, config);
  return { path: filePath, config };
}
