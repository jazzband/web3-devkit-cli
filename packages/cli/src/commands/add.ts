import path from "node:path";
import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import { addIntegration } from "@web3-devkit/core";
import {
  detectFrontendDir,
  getIntegration,
  mergeFrontendDependencies,
  resolveIntegrationsRoot,
  type IntegrationId,
} from "@web3-devkit/integrations";
import { writeln, writeWarn } from "../utils/logger.js";

interface AddFlags {
  dir?: string;
  yes?: boolean;
  skipExisting?: boolean;
}

const INTEGRATION_COMMANDS: { id: IntegrationId; description: string }[] = [
  { id: "wallet-connect", description: "WalletConnect connector + wagmi setup" },
  { id: "wagmi", description: "wagmi provider, hooks, and transaction helpers" },
  { id: "viem", description: "viem chain config and clients" },
  { id: "rainbowkit", description: "RainbowKit provider and connect button" },
  { id: "solana-wallet", description: "Solana wallet adapter provider and hooks" },
];

function subcommandFlags(command: Command): AddFlags {
  const parent = command.parent;
  if (!parent) return command.opts() as AddFlags;
  return { ...(parent.opts() as AddFlags), ...(command.opts() as AddFlags) };
}

function addFlags(cmd: Command): Command {
  return cmd
    .option("-d, --dir <path>", "Frontend directory (auto-detect if omitted)")
    .option("-y, --yes", "Skip confirmation prompts")
    .option("--skip-existing", "Do not overwrite existing files");
}

async function runAdd(integrationId: IntegrationId, flags: AddFlags): Promise<void> {
  const meta = getIntegration(integrationId);
  if (!meta) {
    throw new Error(`Unknown integration: ${integrationId}`);
  }

  const frontendDir = flags.dir
    ? path.resolve(flags.dir)
    : await detectFrontendDir(process.cwd());

  if (!flags.yes) {
    const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
      {
        type: "confirm",
        name: "confirmed",
        message: `Add ${chalk.cyan(meta.name)} integration → ${frontendDir}?`,
        default: true,
      },
    ]);
    if (!confirmed) {
      writeWarn(chalk.yellow("Cancelled."));
      return;
    }
  }

  const spinner = ora(`Adding ${chalk.cyan(meta.name)}...`).start();

  try {
    const result = await addIntegration({
      integrationId,
      targetDir: frontendDir,
      integrationsRoot: resolveIntegrationsRoot(),
      skipExisting: flags.skipExisting ?? false,
    });

    const { added, skipped } = await mergeFrontendDependencies(
      frontendDir,
      meta.npmDependencies,
      meta.npmDevDependencies,
    );

    spinner.succeed(
      chalk.green(
        `Wrote ${result.filesWritten} file(s)${result.filesSkipped ? `, skipped ${result.filesSkipped} existing` : ""}`,
      ),
    );

    writeln();
    writeln(chalk.bold.green("✓ Integration added"));
    writeln(`  ${chalk.dim("Path:")} ${result.targetDir}`);
    writeln(`  ${chalk.dim("Integration:")} ${meta.name}`);

    if (added.length > 0) {
      writeln(`  ${chalk.dim("Dependencies:")} ${added.join(", ")}`);
      writeln(chalk.dim("  Run npm install in the frontend directory."));
    }
    if (skipped.length > 0) {
      writeln(chalk.dim(`  Already in package.json: ${skipped.join(", ")}`));
    }

    if (meta.envVars.length > 0) {
      writeln();
      writeln(chalk.bold("Environment variables"));
      for (const key of meta.envVars) {
        writeln(`  ${chalk.cyan(key)}=`);
      }
    }

    writeln();
    writeln(chalk.dim(`See integrations/${integrationId}/README.md for setup steps.`));
  } catch (err) {
    spinner.fail(chalk.red("Failed to add integration"));
    throw err;
  }
}

function registerIntegrationCommand(add: Command, id: IntegrationId, description: string): void {
  const cmd = add.command(id).description(description);
  addFlags(cmd).action(async function (this: Command) {
    await runAdd(id, subcommandFlags(this));
  });
}

export function registerAddCommand(program: Command): void {
  const add = program
    .command("add")
    .description("Add frontend wallet / Web3 integrations to your project");

  addFlags(add).action(async function (this: Command) {
    const flags = subcommandFlags(this);
    const { integrationId } = await inquirer.prompt<{ integrationId: IntegrationId }>([
      {
        type: "list",
        name: "integrationId",
        message: "Which integration do you want to add?",
        choices: INTEGRATION_COMMANDS.map((c) => ({
          name: `${chalk.cyan(c.id)} — ${c.description}`,
          value: c.id,
        })),
      },
    ]);
    await runAdd(integrationId, flags);
  });

  for (const cmd of INTEGRATION_COMMANDS) {
    registerIntegrationCommand(add, cmd.id, cmd.description);
  }
}
