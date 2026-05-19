import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import {
  configExists,
  getConfigFilePath,
  getConfigValue,
  initProjectConfig,
  loadProjectConfig,
  parseSetValue,
  saveProjectConfig,
  setConfigValue,
  type ChainType,
  type Framework,
  type ProjectConfig,
  type WalletType,
} from "@web3-devkit/core";
import { detectEvmProject } from "@web3-devkit/evm";
import { detectSolanaProject } from "@web3-devkit/solana";
import { EVM_NETWORK_IDS } from "@web3-devkit/evm";
import { printKeyValue } from "../utils/output.js";
import { writeln, writeJson, writeRaw, writeWarn } from "../utils/logger.js";

interface ConfigFlags {
  json?: boolean;
  yes?: boolean;
}

const SOLANA_CHAINS = ["mainnet", "devnet", "testnet"] as const;

const FRAMEWORK_CHOICES: { name: string; value: Framework }[] = [
  { name: "Foundry", value: "foundry" },
  { name: "Hardhat", value: "hardhat" },
  { name: "Anchor", value: "anchor" },
];

const WALLET_CHOICES: { name: string; value: WalletType }[] = [
  { name: "Private key (.env)", value: "privateKey" },
  { name: "Read from env var", value: "env" },
  { name: "Hardware wallet", value: "hardware" },
];

async function detectFramework(cwd: string): Promise<Framework | undefined> {
  const evm = await detectEvmProject(cwd);
  if (evm.tool === "foundry") return "foundry";
  if (evm.tool === "hardhat") return "hardhat";
  const sol = await detectSolanaProject(cwd);
  if (sol) return "anchor";
  return undefined;
}

function printConfig(config: ProjectConfig, json?: boolean): void {
  if (json) {
    writeJson(config);
    return;
  }
  writeln(chalk.bold("Project config"));
  writeJson(config);
}

async function runInit(cwd: string, flags: ConfigFlags): Promise<void> {
  const exists = await configExists(cwd);
  if (exists && !flags.yes) {
    const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>([
      {
        type: "confirm",
        name: "overwrite",
        message: `${getConfigFilePath(cwd)} already exists. Overwrite?`,
        default: false,
      },
    ]);
    if (!overwrite) {
      writeWarn(chalk.yellow("Cancelled."));
      return;
    }
  }

  const detectedFramework = await detectFramework(cwd);

  const answers = await inquirer.prompt<{
    chainType: ChainType;
    defaultChain: string;
    framework: Framework;
    rpcUrl: string;
    walletType: WalletType;
  }>([
    {
      type: "list",
      name: "chainType",
      message: "Primary chain type",
      choices: [
        { name: "EVM", value: "evm" },
        { name: "Solana", value: "solana" },
      ],
      default: "evm",
    },
    {
      type: "list",
      name: "defaultChain",
      message: "Default network",
      choices(answers: { chainType?: ChainType }) {
        if (answers.chainType === "solana") {
          return SOLANA_CHAINS.map((c) => ({ name: c, value: c }));
        }
        return EVM_NETWORK_IDS.map((c) => ({ name: c, value: c }));
      },
    },
    {
      type: "list",
      name: "framework",
      message: "Contract framework",
      choices: FRAMEWORK_CHOICES,
      default: detectedFramework ?? "foundry",
    },
    {
      type: "input",
      name: "rpcUrl",
      message: "RPC URL for default network",
      default: (prev: { defaultChain: string; chainType: ChainType }) =>
        prev.chainType === "solana"
          ? `https://api.${prev.defaultChain}.solana.com`
          : "https://",
      validate: (v: string) => v.startsWith("http") || "Enter a valid http(s) URL",
    },
    {
      type: "list",
      name: "walletType",
      message: "Wallet type",
      choices: WALLET_CHOICES,
      default: "privateKey",
    },
  ]);

  const config: ProjectConfig = {
    defaultChain: answers.defaultChain,
    chainType: answers.chainType,
    framework: answers.framework,
    rpc: { [answers.defaultChain]: answers.rpcUrl },
    wallet: { type: answers.walletType },
  };

  const spinner = ora("Writing config...").start();
  try {
    const filePath = await saveProjectConfig(cwd, config);
    spinner.succeed(chalk.green("Config saved"));
    writeln();
    printKeyValue("Path:", filePath);
    printConfig(config, flags.json);
  } catch (err) {
    spinner.fail(chalk.red("Failed to write config"));
    throw err;
  }
}

async function runGet(cwd: string, key: string, flags: ConfigFlags): Promise<void> {
  const config = await loadProjectConfig(cwd);
  if (!config) {
    throw new Error(`No config at ${getConfigFilePath(cwd)}. Run: web3 config init`);
  }

  const value = getConfigValue(config, key);
  if (value === undefined) {
    throw new Error(`Unknown config key: ${key}`);
  }

  if (flags.json) {
    writeJson({ [key]: value });
    return;
  }

  if (typeof value === "object") {
    writeJson(value);
  } else {
    writeRaw(String(value));
  }
}

async function runSet(cwd: string, key: string, valueRaw: string): Promise<void> {
  const existing = (await loadProjectConfig(cwd)) ?? (await initProjectConfig(cwd)).config;

  const value = parseSetValue(valueRaw);
  const updated = setConfigValue(existing, key, value);
  const filePath = await saveProjectConfig(cwd, updated);

  writeln(chalk.green(`Updated ${key}`));
  writeln(chalk.dim(filePath));
}

export function registerConfigCommand(program: Command): void {
  const config = program
    .command("config")
    .description("Manage project config (.web3-devkit/config.json)")
    .option("--json", "JSON output")
    .action(async function (this: Command) {
      const flags = this.opts() as ConfigFlags;
      const cwd = process.cwd();
      const loaded = await loadProjectConfig(cwd);

      if (!loaded) {
        writeWarn(chalk.yellow(`No config at ${getConfigFilePath(cwd)}`));
        writeln(chalk.dim("Run: web3 config init"));
        return;
      }

      printConfig(loaded, flags.json);
    });

  config
    .command("init")
    .description("Create or overwrite project config interactively")
    .option("-y, --yes", "Overwrite existing config without prompting")
    .action(async function (this: Command) {
      const parent = this.parent;
      const flags = {
        ...(parent?.opts() as ConfigFlags),
        ...(this.opts() as ConfigFlags),
      };
      await runInit(process.cwd(), flags);
    });

  config
    .command("get <key>")
    .description("Get a config value (e.g. defaultChain, rpc.base)")
    .action(async function (this: Command, key: string) {
      const flags = (this.parent?.opts() ?? {}) as ConfigFlags;
      await runGet(process.cwd(), key, flags);
    });

  config
    .command("set <key> [value...]")
    .description("Set a config value")
    .action(async function (key: string, valueParts: string[]) {
      const valueRaw = valueParts?.join(" ").trim();
      if (!key || !valueRaw) {
        throw new Error("Usage: web3 config set <key> <value>");
      }
      await runSet(process.cwd(), key, valueRaw);
    });

  config
    .command("path")
    .description("Print config file path")
    .action(() => {
      writeRaw(getConfigFilePath(process.cwd()));
    });
}
