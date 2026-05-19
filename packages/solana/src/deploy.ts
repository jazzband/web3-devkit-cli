import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { DeploymentRecord, DeployedProgram } from "@web3-devkit/core";
import type { SolanaNetworkConfig } from "./networks.js";
import { detectSolanaProject } from "./project.js";

const execFileAsync = promisify(execFile);

export interface SolanaDeployOptions {
  cwd: string;
  network: SolanaNetworkConfig;
  rpcUrl: string;
  walletPath: string;
  program?: string;
  dryRun?: boolean;
}

export interface SolanaDeployResult {
  record: DeploymentRecord;
}

function networkKey(network: SolanaNetworkConfig): string {
  return `solana-${network.id}`;
}

function clusterFlag(network: SolanaNetworkConfig): string {
  switch (network.id) {
    case "mainnet":
      return "mainnet";
    case "devnet":
      return "devnet";
    case "testnet":
      return "testnet";
    default:
      return "devnet";
  }
}

async function readAnchorProgramIds(
  root: string,
): Promise<DeployedProgram[]> {
  const programs: DeployedProgram[] = [];

  try {
    const anchorToml = await fs.readFile(path.join(root, "Anchor.toml"), "utf8");
    const idlDir = path.join(root, "target", "idl");
    const idlFiles = await fs.readdir(idlDir).catch(() => [] as string[]);

    for (const file of idlFiles) {
      if (!file.endsWith(".json")) continue;
      const name = file.replace(".json", "");
      const idl = JSON.parse(
        await fs.readFile(path.join(idlDir, file), "utf8"),
      ) as { address?: string };
      if (idl.address) {
        programs.push({ name, programId: idl.address });
      }
    }

    if (programs.length === 0) {
      const programSection = anchorToml.match(/\[programs\.[^\]]+\]([\s\S]*?)(?=\[|$)/g);
      if (programSection) {
        for (const block of programSection) {
          const matches = block.matchAll(/^(\w+)\s*=\s*"([^"]+)"/gm);
          for (const m of matches) {
            if (m[1] && m[2] && m[1] !== "test") {
              programs.push({ name: m[1], programId: m[2] });
            }
          }
        }
      }
    }
  } catch {
    // ignore parse errors
  }

  return programs;
}

export async function deploySolana(options: SolanaDeployOptions): Promise<SolanaDeployResult> {
  const project = await detectSolanaProject(options.cwd);
  if (!project) {
    throw new Error(
      "No Anchor project found (Anchor.toml missing). Run from an Anchor workspace root.",
    );
  }

  const cluster = clusterFlag(options.network);
  const args = ["deploy", "--provider.cluster", cluster];

  if (options.program) {
    args.push("--program-name", options.program);
  }

  if (options.dryRun) {
    await execFileAsync("anchor", ["build"], {
      cwd: project.root,
      env: deployEnv(options),
    });
  } else {
    await execFileAsync("anchor", args, {
      cwd: project.root,
      env: deployEnv(options),
    });
  }

  const programs = await readAnchorProgramIds(project.root);

  const record: DeploymentRecord = {
    chain: "solana",
    network: options.network.name,
    networkKey: networkKey(options.network),
    deployedAt: new Date().toISOString(),
    programs,
    tool: "anchor",
    artifacts: {
      idl: "target/idl",
      types: "target/types",
    },
  };

  return { record };
}

function deployEnv(options: SolanaDeployOptions): NodeJS.ProcessEnv {
  return {
    ...process.env,
    ANCHOR_WALLET: options.walletPath,
    SOLANA_RPC_URL: options.rpcUrl,
  };
}

export { networkKey as solanaNetworkKey };
