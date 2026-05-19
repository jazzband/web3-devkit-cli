import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Address } from "viem";
import type { EvmNetworkConfig } from "./networks.js";
import { EXPLORER_APIS } from "./explorers.js";
import { detectEvmProject } from "./project.js";

const execFileAsync = promisify(execFile);

export interface VerifyOptions {
  cwd: string;
  network: EvmNetworkConfig;
  contractAddress: Address;
  contractName: string;
  /** Solidity fully qualified name e.g. src/Counter.sol:Counter */
  contractPath?: string;
  etherscanApiKey: string;
  rpcUrl?: string;
  constructorArgs?: string;
}

export interface VerifyResult {
  success: boolean;
  message: string;
  explorerUrl?: string;
}

export async function verifyEvmContract(options: VerifyOptions): Promise<VerifyResult> {
  const explorer = EXPLORER_APIS[options.network.id];
  const project = await detectEvmProject(options.cwd);

  const fqName =
    options.contractPath ?? `src/${options.contractName}.sol:${options.contractName}`;

  if (project.tool === "foundry") {
    const args = [
      "verify-contract",
      options.contractAddress,
      fqName,
      "--chain-id",
      String(options.network.chain.id),
      "--etherscan-api-key",
      options.etherscanApiKey,
    ];

    if (options.rpcUrl) {
      args.push("--rpc-url", options.rpcUrl);
    }
    if (options.constructorArgs) {
      args.push("--constructor-args", options.constructorArgs);
    }

    try {
      const { stdout } = await execFileAsync("forge", args, {
        cwd: project.root,
      });
      const browser = explorer?.browserUrl ?? "https://etherscan.io";
      return {
        success: true,
        message: stdout.trim() || "Contract verified",
        explorerUrl: `${browser}/address/${options.contractAddress}#code`,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, message };
    }
  }

  if (project.tool === "hardhat") {
    try {
      const args = [
        "hardhat",
        "verify",
        "--network",
        options.network.id === "ethereum" ? "mainnet" : options.network.id,
        options.contractAddress,
        ...(options.constructorArgs ? [options.constructorArgs] : []),
      ];
      const { stdout } = await execFileAsync("npx", args, {
        cwd: project.root,
        env: {
          ...process.env,
          ETHERSCAN_API_KEY: options.etherscanApiKey,
        },
      });
      const browser = explorer?.browserUrl ?? "https://etherscan.io";
      return {
        success: true,
        message: stdout.trim(),
        explorerUrl: `${browser}/address/${options.contractAddress}#code`,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, message };
    }
  }

  return {
    success: false,
    message: "No Foundry/Hardhat project found for verification.",
  };
}
