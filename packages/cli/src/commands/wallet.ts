import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import {
  createEvmPublicClient,
  createEvmWallet,
  getEvmNativeBalance,
  getEvmTokenBalances,
} from "@web3-devkit/evm";
import {
  createSolanaConnection,
  createSolanaWallet,
  getSolanaNativeBalance,
  getSolanaTokenBalances,
} from "@web3-devkit/solana";
import { formatBalance, printKeyValue, shortenAddress } from "../utils/output.js";
import { resolveTarget } from "../utils/resolve-chain.js";
import { configRpcUrl, loadConfigWithEnv } from "../utils/project-config.js";

interface WalletFlags {
  chain?: string;
  network?: string;
  address?: string;
  rpc?: string;
  tokens?: boolean;
  json?: boolean;
  out?: string;
}

function subcommandFlags(command: Command): WalletFlags {
  return command.opts() as WalletFlags;
}

async function runCreate(flags: WalletFlags): Promise<void> {
  const config = await loadConfigWithEnv(process.cwd());
  const target = resolveTarget(flags.chain ?? "evm", flags.network, config);

  if (target.chain === "evm") {
    const wallet = createEvmWallet();
    if (flags.json) {
      console.log(JSON.stringify({ chain: "evm", ...wallet }, null, 2));
    } else {
      console.log(chalk.bold.green("✓ EVM wallet created"));
      printKeyValue("Address:", wallet.address);
      printKeyValue("Private key:", chalk.yellow(wallet.privateKey));
      console.log(chalk.red("\n⚠ Never share your private key or commit it to git."));
    }
    if (flags.out) {
      await fs.writeFile(
        flags.out,
        JSON.stringify({ address: wallet.address, privateKey: wallet.privateKey }, null, 2),
        "utf8",
      );
      console.log(chalk.dim(`Saved to ${path.resolve(flags.out)}`));
    }
    return;
  }

  const wallet = createSolanaWallet();
  if (flags.json) {
    console.log(
      JSON.stringify(
        { chain: "solana", publicKey: wallet.publicKey, secretKey: [...wallet.secretKey] },
        null,
        2,
      ),
    );
  } else {
    console.log(chalk.bold.green("✓ Solana wallet created"));
    printKeyValue("Public key:", wallet.publicKey);
    printKeyValue("Secret key:", chalk.yellow(`[${wallet.secretKey.length} bytes]`));
    console.log(chalk.red("\n⚠ Store secret key securely. Use --out to save keypair JSON."));
  }
  if (flags.out) {
    await fs.writeFile(
      flags.out,
      JSON.stringify(Array.from(wallet.secretKey)),
      "utf8",
    );
    console.log(chalk.dim(`Saved keypair bytes to ${path.resolve(flags.out)}`));
  }
}

async function runBalance(flags: WalletFlags): Promise<void> {
  if (!flags.address) {
    throw new Error("Address required. Use --address <wallet-address>");
  }

  const config = await loadConfigWithEnv(process.cwd());
  const target = resolveTarget(flags.chain, flags.network, config);
  const rpcUrl = flags.rpc ?? configRpcUrl(config, flags.network);
  const spinner = ora("Fetching balance...").start();

  try {
    if (target.chain === "evm" && target.evmNetwork) {
      const client = createEvmPublicClient(target.evmNetwork, rpcUrl);
      const native = await getEvmNativeBalance(client, flags.address as `0x${string}`);
      spinner.stop();

      if (flags.json) {
        console.log(
          JSON.stringify({
            chain: "evm",
            network: target.evmNetwork.id,
            address: flags.address,
            native: { symbol: target.evmNetwork.nativeSymbol, balance: native },
          }),
        );
      } else {
        console.log();
        printKeyValue("Wallet:", shortenAddress(flags.address));
        printKeyValue(
          `${target.evmNetwork.nativeSymbol} Balance:`,
          formatBalance(target.evmNetwork.nativeSymbol, native),
        );
      }

      if (flags.tokens) {
        await printEvmTokens(client, flags.address as `0x${string}`, target.evmNetwork);
      }
      return;
    }

    if (target.chain === "solana" && target.solanaNetwork) {
      const connection = createSolanaConnection(target.solanaNetwork, rpcUrl);
      const native = await getSolanaNativeBalance(connection, flags.address);
      spinner.stop();

      if (flags.json) {
        console.log(
          JSON.stringify({
            chain: "solana",
            network: target.solanaNetwork.id,
            address: flags.address,
            native: { symbol: "SOL", balance: native },
          }),
        );
      } else {
        console.log();
        printKeyValue("Wallet:", shortenAddress(flags.address, 4, 4));
        printKeyValue("SOL Balance:", formatBalance("SOL", native));
      }

      if (flags.tokens) {
        await printSolanaTokens(connection, flags.address, target.solanaNetwork);
      }
    }
  } catch (err) {
    spinner.fail(chalk.red("Failed to fetch balance"));
    throw err;
  }
}

async function printEvmTokens(
  client: ReturnType<typeof createEvmPublicClient>,
  address: `0x${string}`,
  network: NonNullable<ReturnType<typeof resolveTarget>["evmNetwork"]>,
): Promise<void> {
  const tokens = await getEvmTokenBalances(client, address, network);
  for (const t of tokens) {
    printKeyValue(`${t.symbol} Balance:`, formatBalance(t.symbol, t.balance));
  }
}

async function printSolanaTokens(
  connection: ReturnType<typeof createSolanaConnection>,
  address: string,
  network: NonNullable<ReturnType<typeof resolveTarget>["solanaNetwork"]>,
): Promise<void> {
  const tokens = await getSolanaTokenBalances(connection, address, network);
  for (const t of tokens) {
    printKeyValue(`${t.symbol} Balance:`, formatBalance(t.symbol, t.balance));
  }
}

async function runTokens(flags: WalletFlags): Promise<void> {
  if (!flags.address) {
    throw new Error("Address required. Use --address <wallet-address>");
  }

  const config = await loadConfigWithEnv(process.cwd());
  const target = resolveTarget(flags.chain, flags.network, config);
  const rpcUrl = flags.rpc ?? configRpcUrl(config, flags.network);
  const spinner = ora("Fetching token balances...").start();

  try {
    if (target.chain === "evm" && target.evmNetwork) {
      const client = createEvmPublicClient(target.evmNetwork, rpcUrl);
      const [native, tokens] = await Promise.all([
        getEvmNativeBalance(client, flags.address as `0x${string}`),
        getEvmTokenBalances(client, flags.address as `0x${string}`, target.evmNetwork),
      ]);
      spinner.stop();

      if (flags.json) {
        console.log(JSON.stringify({ native, tokens }, null, 2));
        return;
      }

      console.log();
      printKeyValue("Wallet:", shortenAddress(flags.address));
      printKeyValue(
        `${target.evmNetwork.nativeSymbol} Balance:`,
        formatBalance(target.evmNetwork.nativeSymbol, native),
      );
      for (const t of tokens) {
        printKeyValue(`${t.symbol} Balance:`, formatBalance(t.symbol, t.balance));
      }
      return;
    }

    if (target.chain === "solana" && target.solanaNetwork) {
      const connection = createSolanaConnection(target.solanaNetwork, rpcUrl);
      const [native, tokens] = await Promise.all([
        getSolanaNativeBalance(connection, flags.address),
        getSolanaTokenBalances(connection, flags.address, target.solanaNetwork),
      ]);
      spinner.stop();

      if (flags.json) {
        console.log(JSON.stringify({ native, tokens }, null, 2));
        return;
      }

      console.log();
      printKeyValue("Wallet:", shortenAddress(flags.address, 4, 4));
      printKeyValue("SOL Balance:", formatBalance("SOL", native));
      for (const t of tokens) {
        printKeyValue(`${t.symbol} Balance:`, formatBalance(t.symbol, t.balance));
      }
    }
  } catch (err) {
    spinner.fail(chalk.red("Failed to fetch tokens"));
    throw err;
  }
}

function addWalletFlags(cmd: Command): Command {
  return cmd
    .option("-c, --chain <chain>", "evm or solana", "evm")
    .option(
      "-n, --network <network>",
      "ethereum | base | arbitrum | polygon | bsc | avalanche | solana mainnet/devnet",
      "ethereum",
    )
    .option("-a, --address <address>", "Wallet address")
    .option("--rpc <url>", "Custom RPC URL")
    .option("--json", "JSON output")
    .option("--tokens", "Include token balances (balance command)")
    .option("-o, --out <file>", "Save key material to file (create)");
}

export function registerWalletCommand(program: Command): void {
  const wallet = program.command("wallet").description("Create wallets and check balances");

  const create = wallet.command("create").description("Generate a new wallet");
  addWalletFlags(create).action(async function (this: Command) {
    await runCreate(subcommandFlags(this));
  });

  const balance = wallet.command("balance").description("Native currency balance");
  addWalletFlags(balance).action(async function (this: Command) {
    await runBalance(subcommandFlags(this));
  });

  const tokens = wallet.command("tokens").description("Token balances (e.g. USDC)");
  addWalletFlags(tokens).action(async function (this: Command) {
    await runTokens(subcommandFlags(this));
  });
}
