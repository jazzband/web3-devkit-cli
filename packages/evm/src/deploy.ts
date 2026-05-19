import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { DeploymentRecord, DeployedContract } from "@web3-devkit/core";
import {
  createPublicClient,
  formatEther,
  http,
  parseEther,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { EvmNetworkConfig } from "./networks.js";
import { detectEvmProject, type EvmProjectInfo } from "./project.js";

const execFileAsync = promisify(execFile);

export interface EvmDeployOptions {
  cwd: string;
  network: EvmNetworkConfig;
  privateKey: Hex;
  rpcUrl: string;
  script?: string;
  dryRun?: boolean;
}

export interface GasEstimate {
  gas: bigint;
  gasPrice: bigint;
  estimatedCostWei: bigint;
  estimatedCostFormatted: string;
  nativeSymbol: string;
}

export interface EvmDeployResult {
  record: DeploymentRecord;
  broadcastPath?: string;
}

export async function estimateDeployGas(
  network: EvmNetworkConfig,
  rpcUrl: string,
  privateKey: Hex,
  bytecode: Hex = "0x",
): Promise<GasEstimate> {
  const account = privateKeyToAccount(privateKey);
  const client = createPublicClient({
    chain: network.chain,
    transport: http(rpcUrl, { timeout: 15_000 }),
  });

  const gas = await client.estimateGas({
    account: account.address,
    data: bytecode.length > 2 ? bytecode : undefined,
    value: parseEther("0"),
  });

  const gasPrice = await client.getGasPrice();
  const estimatedCostWei = gas * gasPrice;

  return {
    gas,
    gasPrice,
    estimatedCostWei,
    estimatedCostFormatted: formatEther(estimatedCostWei),
    nativeSymbol: network.nativeSymbol,
  };
}

async function parseFoundryBroadcast(
  projectRoot: string,
  chainId: number,
  scriptName: string,
): Promise<DeployedContract[]> {
  const broadcastDir = path.join(
    projectRoot,
    "broadcast",
    scriptName,
    String(chainId),
  );
  const runFile = path.join(broadcastDir, "run-latest.json");

  try {
    const raw = await fs.readFile(runFile, "utf8");
    const data = JSON.parse(raw) as {
      transactions?: Array<{
        contractName?: string;
        contractAddress?: string;
        hash?: string;
      }>;
    };

    const contracts: DeployedContract[] = [];
    for (const tx of data.transactions ?? []) {
      if (tx.contractAddress && tx.contractName) {
        contracts.push({
          name: tx.contractName,
          address: tx.contractAddress,
          txHash: tx.hash,
        });
      }
    }
    return contracts;
  } catch {
    return [];
  }
}

export async function deployWithFoundry(
  options: EvmDeployOptions,
  project: EvmProjectInfo,
): Promise<EvmDeployResult> {
  const script = options.script ?? "script/Deploy.s.sol:DeployScript";
  const scriptFile = script.split(":")[0] ?? "script/Deploy.s.sol";
  const args = [
    "script",
    script,
    "--rpc-url",
    options.rpcUrl,
    "--json",
  ];

  if (!options.dryRun) {
    args.push("--broadcast");
  }

  const deployer = privateKeyToAccount(options.privateKey);

  let gasEstimate: GasEstimate | undefined;
  try {
    gasEstimate = await estimateDeployGas(
      options.network,
      options.rpcUrl,
      options.privateKey,
    );
  } catch {
    // estimation optional before broadcast
  }

  if (!options.dryRun) {
    await execFileAsync("forge", args, {
      cwd: project.root,
      env: {
        ...process.env,
        PRIVATE_KEY: options.privateKey,
        ETH_RPC_URL: options.rpcUrl,
      },
    });
  } else {
    args.push("--gas-estimate");
    await execFileAsync("forge", args, { cwd: project.root });
  }

  const contracts = options.dryRun
    ? []
    : await parseFoundryBroadcast(
        project.root,
        options.network.chain.id,
        scriptFile,
      );

  const record: DeploymentRecord = {
    chain: "evm",
    network: options.network.name,
    networkKey: options.network.id,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts,
    tool: "foundry",
    estimatedGas: gasEstimate?.gas.toString(),
    estimatedGasCost: gasEstimate
      ? gasEstimate.estimatedCostFormatted + " " + gasEstimate.nativeSymbol
      : undefined,
    artifacts: {
      broadcast: path.join(
        "broadcast",
        scriptFile,
        String(options.network.chain.id),
        "run-latest.json",
      ),
    },
  };

  return {
    record,
    broadcastPath: record.artifacts?.broadcast,
  };
}

export async function deployWithHardhat(
  options: EvmDeployOptions,
  project: EvmProjectInfo,
): Promise<EvmDeployResult> {
  const script = options.script ?? "scripts/deploy.ts";
  const networkName = options.network.id === "ethereum" ? "mainnet" : options.network.id;

  await execFileAsync(
    "npx",
    ["hardhat", "run", script, "--network", networkName],
    {
      cwd: project.root,
      env: {
        ...process.env,
        PRIVATE_KEY: options.privateKey,
        RPC_URL: options.rpcUrl,
      },
    },
  );

  const deployer = privateKeyToAccount(options.privateKey);
  const deploymentsPath = path.join(project.root, "deployments", networkName + ".json");

  let contracts: DeployedContract[] = [];
  try {
    const raw = await fs.readFile(deploymentsPath, "utf8");
    const data = JSON.parse(raw) as Record<string, string>;
    contracts = Object.entries(data).map(([name, address]) => ({
      name,
      address,
    }));
  } catch {
    // hardhat-deploy not configured
  }

  return {
    record: {
      chain: "evm",
      network: options.network.name,
      networkKey: options.network.id,
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      contracts,
      tool: "hardhat",
      artifacts: { deployments: deploymentsPath },
    },
  };
}

export async function deployEvm(options: EvmDeployOptions): Promise<EvmDeployResult> {
  const project = await detectEvmProject(options.cwd);

  if (project.tool === "foundry") {
    return deployWithFoundry(options, project);
  }
  if (project.tool === "hardhat") {
    return deployWithHardhat(options, project);
  }

  throw new Error(
    "No Foundry or Hardhat project detected. Run from a project with foundry.toml or hardhat.config.",
  );
}

export async function getDeployerAddress(privateKey: Hex): Promise<Address> {
  return privateKeyToAccount(privateKey).address;
}
