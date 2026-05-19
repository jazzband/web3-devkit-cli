import fs from "node:fs/promises";
import path from "node:path";
import type { DeploymentFile, DeploymentRecord } from "./types.js";

export const DEPLOYMENTS_DIR = ".web3-devkit/deployments";

export function getDeploymentsRoot(cwd: string): string {
  return path.join(cwd, DEPLOYMENTS_DIR);
}

export function getDeploymentFilePath(cwd: string, networkKey: string): string {
  return path.join(getDeploymentsRoot(cwd), `${networkKey}.json`);
}

export async function loadDeploymentFile(
  cwd: string,
  networkKey: string,
): Promise<DeploymentFile | null> {
  const filePath = getDeploymentFilePath(cwd, networkKey);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as DeploymentFile;
  } catch {
    return null;
  }
}

export async function saveDeployment(
  cwd: string,
  record: DeploymentRecord,
): Promise<string> {
  const filePath = getDeploymentFilePath(cwd, record.networkKey);
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const existing = await loadDeploymentFile(cwd, record.networkKey);
  const history = existing
    ? [existing.latest, ...existing.history].slice(0, 20)
    : [];

  const file: DeploymentFile = {
    latest: record,
    history,
  };

  await fs.writeFile(filePath, JSON.stringify(file, null, 2), "utf8");
  return filePath;
}

export async function listDeploymentFiles(cwd: string): Promise<string[]> {
  const root = getDeploymentsRoot(cwd);
  try {
    const entries = await fs.readdir(root);
    return entries.filter((e) => e.endsWith(".json"));
  } catch {
    return [];
  }
}
