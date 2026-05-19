import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { checkEvmNetwork } from "@web3-devkit/evm";
import { checkSolanaNetwork } from "@web3-devkit/solana";
import { printKeyValue, statusColor } from "../utils/output.js";
import { resolveTarget } from "../utils/resolve-chain.js";
import { configRpcUrl, loadConfigWithEnv } from "../utils/project-config.js";
import { writeln, writeJson } from "../utils/logger.js";

interface NetworkFlags {
  chain?: string;
  network?: string;
  rpc?: string;
  json?: boolean;
}

export function registerNetworkCommand(program: Command): void {
  const network = program.command("network").description("Network status utilities");

  network
    .command("check")
    .description("Check RPC health, chain ID, and latest block")
    .option("-c, --chain <chain>", "evm or solana")
    .option("-n, --network <network>", "Network name (e.g. base, ethereum, devnet)")
    .option("--rpc <url>", "Custom RPC URL")
    .option("--json", "JSON output")
    .action(async (flags: NetworkFlags) => {
      const cwd = process.cwd();
      const config = await loadConfigWithEnv(cwd);
      const target = resolveTarget(flags.chain, flags.network, config);
      const rpcUrl = flags.rpc ?? configRpcUrl(config, flags.network);
      const spinner = ora(`Checking ${target.chain} network...`).start();

      try {
        if (target.chain === "evm" && target.evmNetwork) {
          const result = await checkEvmNetwork(target.evmNetwork, rpcUrl);
          spinner.stop();

          if (flags.json) {
            writeJson({ ...result, blockNumber: result.blockNumber.toString() });
            return;
          }

          writeln();
          printKeyValue("Network:", result.network);
          printKeyValue("Chain ID:", String(result.chainId));
          printKeyValue("Block:", result.blockNumber.toString());
          printKeyValue("RPC Latency:", `${result.latencyMs}ms`);
          printKeyValue("RPC URL:", chalk.dim(result.rpcUrl));
          printKeyValue("Status:", statusColor(result.status)(result.status));
          return;
        }

        if (target.chain === "solana" && target.solanaNetwork) {
          const result = await checkSolanaNetwork(target.solanaNetwork, rpcUrl);
          spinner.stop();

          if (flags.json) {
            writeJson(result);
            return;
          }

          writeln();
          printKeyValue("Network:", result.network);
          printKeyValue("Slot:", String(result.slot));
          printKeyValue("RPC Latency:", `${result.latencyMs}ms`);
          printKeyValue("RPC URL:", chalk.dim(result.rpcUrl));
          printKeyValue("Status:", statusColor(result.status)(result.status));
        }
      } catch (err) {
        spinner.fail(chalk.red("Network check failed"));
        throw err;
      }
    });
}
