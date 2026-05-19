import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import {
  loadDotEnv,
  saveDeployment,
  validateEvmDeployEnv,
  validateSolanaDeployEnv,
} from "@web3-devkit/core";
import {
  deployEvm,
  detectEvmProject,
  estimateDeployGas,
  getDeployerAddress,
} from "@web3-devkit/evm";
import { deploySolana, detectSolanaProject } from "@web3-devkit/solana";
import { printKeyValue } from "../utils/output.js";
import { resolveTarget, type ChainKind } from "../utils/resolve-chain.js";
import { loadConfigWithEnv } from "../utils/project-config.js";
import { writeln, writeWarn } from "../utils/logger.js";

interface DeployFlags {
  network?: string;
  script?: string;
  program?: string;
  dryRun?: boolean;
  estimate?: boolean;
  yes?: boolean;
}

async function promptChain(): Promise<ChainKind> {
  const { chain } = await inquirer.prompt<{ chain: ChainKind }>([
    {
      type: "list",
      name: "chain",
      message: "Deploy to",
      choices: [
        { name: "EVM (Foundry / Hardhat)", value: "evm" },
        { name: "Solana (Anchor)", value: "solana" },
      ],
    },
  ]);
  return chain;
}

async function confirmDeploy(message: string, skip: boolean): Promise<boolean> {
  if (skip) return true;
  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
    { type: "confirm", name: "confirmed", message, default: true },
  ]);
  return confirmed;
}

async function runEvmDeploy(cwd: string, flags: DeployFlags): Promise<void> {
  await loadDotEnv(cwd);
  const config = await loadConfigWithEnv(cwd);
  const target = resolveTarget("evm", flags.network, config);
  if (!target.evmNetwork) throw new Error("EVM network required");

  const env = validateEvmDeployEnv(process.env as Record<string, string>);
  const project = await detectEvmProject(cwd);

  if (project.tool === "none") {
    throw new Error("No foundry.toml or hardhat.config found in this directory.");
  }

  const deployer = await getDeployerAddress(env.PRIVATE_KEY as `0x${string}`);

  if (flags.estimate) {
    const spinner = ora("Estimating gas...").start();
    try {
      const estimate = await estimateDeployGas(
        target.evmNetwork,
        env.RPC_URL,
        env.PRIVATE_KEY as `0x${string}`,
      );
      spinner.succeed(chalk.green("Gas estimate ready"));
      writeln();
      printKeyValue("Network:", target.evmNetwork.name);
      printKeyValue("Deployer:", deployer);
      printKeyValue("Gas units:", estimate.gas.toString());
      printKeyValue(
        "Est. cost:",
        estimate.estimatedCostFormatted + " " + estimate.nativeSymbol,
      );
      printKeyValue("Tool:", project.tool);
      return;
    } catch (err) {
      spinner.fail("Gas estimation failed");
      throw err;
    }
  }

  const ok = await confirmDeploy(
    `Deploy to ${target.evmNetwork.name} using ${project.tool}?`,
    flags.yes ?? false,
  );
  if (!ok) {
    writeWarn(chalk.yellow("Cancelled."));
    return;
  }

  const spinner = ora(`Deploying to ${chalk.cyan(target.evmNetwork.name)}...`).start();

  try {
    const result = await deployEvm({
      cwd,
      network: target.evmNetwork,
      privateKey: env.PRIVATE_KEY as `0x${string}`,
      rpcUrl: env.RPC_URL,
      script: flags.script,
      dryRun: flags.dryRun,
    });

    const filePath = await saveDeployment(cwd, result.record);
    spinner.succeed(chalk.green("Deployment complete"));

    printDeploySummary(result.record, filePath);
  } catch (err) {
    spinner.fail(chalk.red("Deployment failed"));
    throw err;
  }
}

async function runSolanaDeploy(cwd: string, flags: DeployFlags): Promise<void> {
  await loadDotEnv(cwd);
  const config = await loadConfigWithEnv(cwd);
  const target = resolveTarget("solana", flags.network, config);
  if (!target.solanaNetwork) throw new Error("Solana network required");

  const env = validateSolanaDeployEnv(process.env as Record<string, string>);
  const project = await detectSolanaProject(cwd);
  if (!project) {
    throw new Error("Anchor.toml not found. Run from an Anchor project root.");
  }

  const ok = await confirmDeploy(
    `Deploy to ${target.solanaNetwork.name} with Anchor?`,
    flags.yes ?? false,
  );
  if (!ok) {
    writeWarn(chalk.yellow("Cancelled."));
    return;
  }

  const spinner = ora(`Deploying to ${chalk.cyan(target.solanaNetwork.name)}...`).start();

  try {
    const result = await deploySolana({
      cwd,
      network: target.solanaNetwork,
      rpcUrl: env.SOLANA_RPC_URL,
      walletPath: env.ANCHOR_WALLET.replace(/^~/, process.env.HOME ?? ""),
      program: flags.program,
      dryRun: flags.dryRun,
    });

    const filePath = await saveDeployment(cwd, result.record);
    spinner.succeed(chalk.green("Deployment complete"));

    printDeploySummary(result.record, filePath);
  } catch (err) {
    spinner.fail(chalk.red("Deployment failed"));
    throw err;
  }
}

function printDeploySummary(
  record: Awaited<ReturnType<typeof deployEvm>>["record"],
  filePath: string,
): void {
  writeln();
  printKeyValue("Network:", record.network);
  printKeyValue("Saved:", chalk.dim(filePath));

  if (record.deployer) {
    printKeyValue("Deployer:", record.deployer);
  }
  if (record.estimatedGasCost) {
    printKeyValue("Est. gas:", record.estimatedGasCost);
  }

  for (const c of record.contracts ?? []) {
    printKeyValue(`Contract ${c.name}:`, c.address);
    if (c.txHash) printKeyValue("  tx:", chalk.dim(c.txHash));
  }

  for (const p of record.programs ?? []) {
    printKeyValue(`Program ${p.name}:`, p.programId);
  }

  writeln();
  writeln(chalk.dim("Run `web3 verify` to verify contracts on a block explorer."));
}

async function runDeploy(chain: ChainKind | undefined, flags: DeployFlags): Promise<void> {
  const cwd = process.cwd();
  const selected = chain ?? (await promptChain());

  if (selected === "evm") {
    await runEvmDeploy(cwd, flags);
  } else {
    await runSolanaDeploy(cwd, flags);
  }
}

function addDeployFlags(cmd: Command): Command {
  return cmd
    .option("-n, --network <network>", "Target network")
    .option("--script <path>", "Deploy script (EVM: forge/hardhat path)")
    .option("--program <name>", "Anchor program name (Solana)")
    .option("--dry-run", "Simulate / build only, do not broadcast")
    .option("--estimate", "Show gas estimate only (EVM)")
    .option("-y, --yes", "Skip confirmation");
}

function subcommandFlags(command: Command): DeployFlags {
  return command.opts() as DeployFlags;
}

export function registerDeployCommand(program: Command): void {
  const deploy = program.command("deploy").description("Deploy contracts and programs");

  deploy.action(async () => {
    await runDeploy(undefined, {});
  });

  const evm = deploy.command("evm").description("Deploy EVM contracts (Foundry/Hardhat)");
  addDeployFlags(evm).action(async function (this: Command) {
    await runDeploy("evm", subcommandFlags(this));
  });

  const solana = deploy.command("solana").description("Deploy Solana programs (Anchor)");
  addDeployFlags(solana).action(async function (this: Command) {
    await runDeploy("solana", subcommandFlags(this));
  });

  deploy
    .command("history")
    .description("List saved deployment records")
    .action(async () => {
      const { listDeploymentFiles, loadDeploymentFile } = await import("@web3-devkit/core");
      const cwd = process.cwd();
      const files = await listDeploymentFiles(cwd);

      if (files.length === 0) {
        writeWarn(chalk.yellow("No deployments found in .web3-devkit/deployments/"));
        return;
      }

      for (const file of files) {
        const key = file.replace(".json", "");
        const data = await loadDeploymentFile(cwd, key);
        if (!data) continue;
        writeln(chalk.bold(`\n${key}`));
        printKeyValue("  When:", data.latest.deployedAt);
        printKeyValue("  Chain:", data.latest.chain);
        printKeyValue("  Tool:", data.latest.tool ?? "—");
        const count =
          (data.latest.contracts?.length ?? 0) + (data.latest.programs?.length ?? 0);
        printKeyValue("  Artifacts:", String(count));
      }
    });
}
