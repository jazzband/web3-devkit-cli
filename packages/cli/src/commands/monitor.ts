import { Command } from "commander";
import chalk from "chalk";
import type { Address } from "viem";
import { loadDotEnv } from "@web3-devkit/core";
import {
  monitorContractTransfers,
  monitorTokenTransfers,
  monitorWalletTransfers,
  type ParsedTransferEvent,
} from "@web3-devkit/evm";
import {
  monitorSolanaToken,
  monitorSolanaWallet,
  type SolanaLogEvent,
} from "@web3-devkit/solana";
import { printKeyValue, shortenAddress } from "../utils/output.js";
import { resolveTarget } from "../utils/resolve-chain.js";
import { configRpcUrl, loadConfigWithEnv } from "../utils/project-config.js";

interface MonitorFlags {
  chain?: string;
  network?: string;
  address?: string;
  event?: string;
  wallet?: string;
  rpc?: string;
  symbol?: string;
  poll?: string;
}

function subcommandFlags(command: Command): MonitorFlags {
  return command.opts() as MonitorFlags;
}

function setupAbort(): AbortController {
  const controller = new AbortController();
  process.on("SIGINT", () => {
    console.log(chalk.dim("\nStopping monitor..."));
    controller.abort();
  });
  return controller;
}

function printTransferEvent(event: ParsedTransferEvent): void {
  console.log();
  console.log(chalk.bold.green(`New ${event.eventName}`));
  printKeyValue("From:", event.from);
  printKeyValue("To:", event.to);
  printKeyValue("Amount:", `${event.amount} ${event.symbol}`);
  printKeyValue("Tx:", chalk.dim(event.txHash));
  console.log(chalk.dim(`Block ${event.blockNumber}`));
}

function printSolanaLog(event: SolanaLogEvent): void {
  console.log();
  console.log(chalk.bold.green(`New ${event.label}`));
  printKeyValue("Signature:", shortenAddress(event.signature, 8, 8));
  printKeyValue("Slot:", String(event.slot));
  if (event.logs.length > 0) {
    const preview = event.logs.slice(0, 3).join("\n    ");
    printKeyValue("Logs:", "\n    " + preview);
  }
}

function addMonitorFlags(cmd: Command): Command {
  return cmd
    .option("-c, --chain <chain>", "evm or solana", "evm")
    .option("-n, --network <network>", "Network (base, ethereum, devnet, …)")
    .option("-a, --address <address>", "Contract, wallet, or token address")
    .option("-e, --event <name>", "Event name (contract monitor)", "Transfer")
    .option("-w, --wallet <address>", "Filter by wallet (token monitor)")
    .option("--symbol <symbol>", "Token symbol override for display")
    .option("--rpc <url>", "Custom RPC URL")
    .option("--poll <ms>", "Poll interval in ms", "4000");
}

async function runContractMonitor(flags: MonitorFlags): Promise<void> {
  if (!flags.address) throw new Error("--address is required");
  const config = await loadConfigWithEnv(process.cwd());
  const target = resolveTarget(flags.chain, flags.network, config);
  const rpcUrl = flags.rpc ?? configRpcUrl(config, flags.network) ?? process.env.RPC_URL;
  if (target.chain !== "evm" || !target.evmNetwork) {
    throw new Error("Contract event monitor requires --chain evm");
  }

  await loadDotEnv(process.cwd());
  const controller = setupAbort();

  console.log(
    chalk.dim(
      `Watching ${flags.address} for ${flags.event ?? "Transfer"} on ${target.evmNetwork.name} (Ctrl+C to stop)`,
    ),
  );

  await monitorContractTransfers(
    {
      network: target.evmNetwork,
      address: flags.address as Address,
      eventName: flags.event,
      rpcUrl,
      pollIntervalMs: Number(flags.poll ?? 4000),
      signal: controller.signal,
    },
    printTransferEvent,
  );
}

async function runWalletMonitor(flags: MonitorFlags): Promise<void> {
  if (!flags.address) throw new Error("--address is required");
  const config = await loadConfigWithEnv(process.cwd());
  const target = resolveTarget(flags.chain, flags.network, config);
  const evmRpc = flags.rpc ?? configRpcUrl(config, flags.network) ?? process.env.RPC_URL;
  const solRpc =
    flags.rpc ?? configRpcUrl(config, flags.network) ?? process.env.SOLANA_RPC_URL;
  const controller = setupAbort();

  if (target.chain === "evm" && target.evmNetwork) {
    await loadDotEnv(process.cwd());
    console.log(
      chalk.dim(
        `Watching wallet ${flags.address} for ERC20 transfers on ${target.evmNetwork.name}`,
      ),
    );
    await monitorWalletTransfers(
      {
        network: target.evmNetwork,
        address: flags.address as Address,
        rpcUrl: evmRpc,
        pollIntervalMs: Number(flags.poll ?? 4000),
        signal: controller.signal,
      },
      printTransferEvent,
    );
    return;
  }

  if (target.chain === "solana" && target.solanaNetwork) {
    console.log(
      chalk.dim(`Watching Solana wallet ${flags.address} on ${target.solanaNetwork.name}`),
    );
    await monitorSolanaWallet(
      {
        network: target.solanaNetwork,
        address: flags.address,
        rpcUrl: solRpc,
        pollIntervalMs: Number(flags.poll ?? 4000),
        signal: controller.signal,
      },
      printSolanaLog,
    );
  }
}

async function runTokenMonitor(flags: MonitorFlags): Promise<void> {
  if (!flags.address) throw new Error("--address is required (token mint / contract)");
  const config = await loadConfigWithEnv(process.cwd());
  const target = resolveTarget(flags.chain, flags.network, config);
  const evmRpc = flags.rpc ?? configRpcUrl(config, flags.network) ?? process.env.RPC_URL;
  const solRpc =
    flags.rpc ?? configRpcUrl(config, flags.network) ?? process.env.SOLANA_RPC_URL;
  const controller = setupAbort();

  if (target.chain === "evm" && target.evmNetwork) {
    await loadDotEnv(process.cwd());
    console.log(
      chalk.dim(
        `Watching token ${flags.address} on ${target.evmNetwork.name}${flags.wallet ? ` (wallet ${shortenAddress(flags.wallet)})` : ""}`,
      ),
    );
    await monitorTokenTransfers(
      {
        network: target.evmNetwork,
        tokenAddress: flags.address as Address,
        wallet: flags.wallet as Address | undefined,
        symbol: flags.symbol,
        rpcUrl: evmRpc,
        pollIntervalMs: Number(flags.poll ?? 4000),
        signal: controller.signal,
      },
      printTransferEvent,
    );
    return;
  }

  if (target.chain === "solana" && target.solanaNetwork) {
    console.log(chalk.dim(`Watching SPL mint ${flags.address}`));
    await monitorSolanaToken(
      {
        network: target.solanaNetwork,
        mint: flags.address,
        wallet: flags.wallet,
        rpcUrl: solRpc,
        pollIntervalMs: Number(flags.poll ?? 4000),
        signal: controller.signal,
      },
      printSolanaLog,
    );
  }
}

export function registerMonitorCommand(program: Command): void {
  const monitor = program
    .command("monitor")
    .description("Monitor on-chain events (contracts, wallets, tokens)");

  const contract = monitor
    .command("contract")
    .description("Monitor contract events (e.g. Transfer)");
  addMonitorFlags(contract).action(async function (this: Command) {
    await runContractMonitor(subcommandFlags(this));
  });

  const wallet = monitor.command("wallet").description("Monitor wallet token activity");
  addMonitorFlags(wallet).action(async function (this: Command) {
    await runWalletMonitor(subcommandFlags(this));
  });

  const token = monitor.command("token").description("Monitor ERC20 / SPL token transfers");
  addMonitorFlags(token).action(async function (this: Command) {
    await runTokenMonitor(subcommandFlags(this));
  });
}
