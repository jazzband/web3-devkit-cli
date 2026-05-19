import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { testEvmRpc, testEvmRpcUrl } from "@web3-devkit/evm";
import { testSolanaRpc, testSolanaRpcUrl } from "@web3-devkit/solana";
import { printKeyValue, statusColor } from "../utils/output.js";
import { resolveTarget } from "../utils/resolve-chain.js";
import { configRpcUrl, loadConfigWithEnv } from "../utils/project-config.js";
import { writeln, writeJson } from "../utils/logger.js";

interface RpcFlags {
  chain?: string;
  network?: string;
  url?: string;
  json?: boolean;
}

export function registerRpcCommand(program: Command): void {
  const rpc = program.command("rpc").description("RPC endpoint utilities");

  rpc
    .command("test")
    .description("Test RPC latency and connectivity")
    .option("-c, --chain <chain>", "evm or solana (with --network)")
    .option("-n, --network <network>", "Preset network (e.g. base, ethereum, devnet)")
    .option("-u, --url <url>", "Custom RPC URL to test")
    .option("--json", "JSON output")
    .action(async (flags: RpcFlags) => {
      const spinner = ora("Testing RPC...").start();

      try {
        if (flags.url) {
          const evmResult = await testEvmRpcUrl(flags.url);
          if (evmResult.status !== "Unreachable") {
            spinner.stop();
            printRpcResult(evmResult, flags.json);
            return;
          }

          const solResult = await testSolanaRpcUrl(flags.url);
          spinner.stop();
          if (flags.json) {
            writeJson(solResult);
          } else {
            printKeyValue("RPC URL:", solResult.url);
            printKeyValue("RPC Latency:", `${solResult.latencyMs}ms`);
            printKeyValue("Slot:", String(solResult.slot));
            printKeyValue("Status:", statusColor(solResult.status)(solResult.status));
          }
          return;
        }

        const cwd = process.cwd();
        const config = await loadConfigWithEnv(cwd);
        const target = resolveTarget(flags.chain, flags.network, config);
        const rpcUrl = flags.url ?? configRpcUrl(config, flags.network);

        if (target.chain === "evm" && target.evmNetwork) {
          const result = await testEvmRpc(target.evmNetwork, rpcUrl);
          spinner.stop();
          printRpcResult(result, flags.json);
          return;
        }

        if (target.chain === "solana" && target.solanaNetwork) {
          const result = await testSolanaRpc(target.solanaNetwork, rpcUrl);
          spinner.stop();
          if (flags.json) {
            writeJson(result);
          } else {
            printKeyValue("Network:", target.solanaNetwork.name);
            printKeyValue("RPC Latency:", `${result.latencyMs}ms`);
            printKeyValue("Slot:", String(result.slot));
            printKeyValue("Status:", statusColor(result.status)(result.status));
          }
        }
      } catch (err) {
        spinner.fail(chalk.red("RPC test failed"));
        throw err;
      }
    });
}

function printRpcResult(
  result: Awaited<ReturnType<typeof testEvmRpc>>,
  json?: boolean,
): void {
  if (json) {
    writeJson({ ...result, blockNumber: result.blockNumber.toString() });
    return;
  }
  writeln();
  printKeyValue("RPC Latency:", `${result.latencyMs}ms`);
  printKeyValue("Chain ID:", String(result.chainId));
  printKeyValue("Block:", result.blockNumber.toString());
  printKeyValue("Status:", statusColor(result.status)(result.status));
  printKeyValue("RPC URL:", chalk.dim(result.url));
}
