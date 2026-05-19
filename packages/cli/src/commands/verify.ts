import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import {
  loadDotEnv,
  loadDeploymentFile,
  validateVerifyEnv,
} from "@web3-devkit/core";
import { verifyEvmContract } from "@web3-devkit/evm";
import { printKeyValue } from "../utils/output.js";
import { resolveTarget } from "../utils/resolve-chain.js";
import { loadConfigWithEnv } from "../utils/project-config.js";
import { cli, writeln } from "../utils/logger.js";

interface VerifyFlags {
  network?: string;
  address?: string;
  contract?: string;
  path?: string;
  constructorArgs?: string;
}

export function registerVerifyCommand(program: Command): void {
  program
    .command("verify")
    .description("Verify deployed contracts on block explorers")
    .option("-n, --network <network>", "Network (e.g. base, ethereum)")
    .option("-a, --address <address>", "Contract address")
    .option("-c, --contract <name>", "Contract name")
    .option("--path <fqName>", "Fully qualified path e.g. src/Token.sol:Token")
    .option("--constructor-args <hex>", "ABI-encoded constructor args (hex)")
    .action(async (flags: VerifyFlags) => {
      const cwd = process.cwd();
      await loadDotEnv(cwd);
      const config = await loadConfigWithEnv(cwd);

      const target = resolveTarget("evm", flags.network, config);
      if (!target.evmNetwork) {
        throw new Error("Verification currently supports EVM chains only.");
      }

      let address = flags.address as `0x${string}` | undefined;
      let contractName = flags.contract;

      if (!address || !contractName) {
        const file = await loadDeploymentFile(cwd, target.evmNetwork.id);
        const latest = file?.latest;
        if (!latest?.contracts?.length) {
          throw new Error(
            "Provide --address and --contract, or deploy first to save artifacts.",
          );
        }
        const first = latest.contracts[0];
        address = (address ?? first.address) as `0x${string}`;
        contractName = contractName ?? first.name;
      }

      if (!address?.startsWith("0x") || !contractName) {
        throw new Error("--address and --contract are required.");
      }

      const env = validateVerifyEnv(process.env as Record<string, string>);

      const spinner = ora(`Verifying ${contractName} on ${target.evmNetwork.name}...`).start();

      try {
        const result = await verifyEvmContract({
          cwd,
          network: target.evmNetwork,
          contractAddress: address,
          contractName,
          contractPath: flags.path,
          etherscanApiKey: env.ETHERSCAN_API_KEY,
          rpcUrl: env.RPC_URL,
          constructorArgs: flags.constructorArgs,
        });

        if (result.success) {
          spinner.succeed(chalk.green("Verified"));
          writeln();
          printKeyValue("Contract:", contractName);
          printKeyValue("Address:", address);
          if (result.explorerUrl) {
            printKeyValue("Explorer:", result.explorerUrl);
          }
        } else {
          spinner.fail(chalk.red("Verification failed"));
          cli.error(chalk.dim(result.message));
          process.exitCode = 1;
        }
      } catch (err) {
        spinner.fail(chalk.red("Verification failed"));
        throw err;
      }
    });
}
