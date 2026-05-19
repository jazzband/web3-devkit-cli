import path from "node:path";
import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import {
  generateContract,
  pascalToKebab,
  type GenerateCategory,
} from "@web3-devkit/core";
import {
  defaultOutputDir,
  detectOutputDir,
  getVariant,
  getVariantsByCategoryAndChain,
  resolveGeneratorsRoot,
  type Chain,
  type GeneratorVariantMeta,
} from "@web3-devkit/generators";

interface GenerateFlags {
  chain?: string;
  variant?: string;
  name?: string;
  out?: string;
  yes?: boolean;
  skipExisting?: boolean;
}

const CATEGORIES: { id: GenerateCategory; label: string }[] = [
  { id: "token", label: "Token" },
  { id: "nft", label: "NFT" },
  { id: "staking", label: "Staking" },
  { id: "vault", label: "Vault" },
  { id: "prediction-market", label: "Prediction Market" },
];

function subcommandFlags(command: Command): GenerateFlags {
  const parent = command.parent;
  if (!parent) return command.opts() as GenerateFlags;
  return { ...(parent.opts() as GenerateFlags), ...(command.opts() as GenerateFlags) };
}

async function promptChain(): Promise<Chain> {
  const { chain } = await inquirer.prompt<{ chain: Chain }>([
    {
      type: "list",
      name: "chain",
      message: "Target chain",
      choices: [
        { name: "EVM (Solidity)", value: "evm" },
        { name: "Solana (Anchor / SPL)", value: "solana" },
      ],
    },
  ]);
  return chain;
}

async function promptVariant(
  category: GenerateCategory,
  chain: Chain,
): Promise<GeneratorVariantMeta> {
  const variants = getVariantsByCategoryAndChain(category, chain);
  if (variants.length === 0) {
    throw new Error(`No generators for ${category} on ${chain}.`);
  }

  const { variantId } = await inquirer.prompt<{ variantId: string }>([
    {
      type: "list",
      name: "variantId",
      message: "Choose generator variant",
      choices: variants.map((v) => ({
        name: `${chalk.cyan(v.id)} — ${v.description}`,
        value: v.id,
        short: v.id,
      })),
    },
  ]);

  const meta = getVariant(category, chain, variantId);
  if (!meta) throw new Error(`Unknown variant: ${variantId}`);
  return meta;
}

async function promptContractName(defaultName: string): Promise<string> {
  const { contractName } = await inquirer.prompt<{ contractName: string }>([
    {
      type: "input",
      name: "contractName",
      message: "Contract / program name (PascalCase)",
      default: defaultName,
      validate: (input: string) =>
        /^[A-Z][a-zA-Z0-9]*$/.test(input.trim()) ||
        "Use PascalCase, e.g. MyToken",
    },
  ]);
  return contractName.trim();
}

async function promptOutputDir(suggested: string): Promise<string> {
  const { targetDir } = await inquirer.prompt<{ targetDir: string }>([
    {
      type: "input",
      name: "targetDir",
      message: "Output directory",
      default: suggested,
    },
  ]);
  return path.resolve(targetDir.trim());
}

async function runGenerate(category: GenerateCategory, flags: GenerateFlags): Promise<void> {
  const chain = (flags.chain as Chain | undefined) ?? (await promptChain());
  if (chain !== "evm" && chain !== "solana") {
    throw new Error(`Invalid chain "${flags.chain}". Use evm or solana.`);
  }

  let variantMeta: GeneratorVariantMeta;
  if (flags.variant) {
    const found = getVariant(category, chain, flags.variant);
    if (!found) {
      const available = getVariantsByCategoryAndChain(category, chain)
        .map((v) => v.id)
        .join(", ");
      throw new Error(
        `Unknown variant "${flags.variant}" for ${category}/${chain}. Available: ${available}`,
      );
    }
    variantMeta = found;
  } else {
    variantMeta = await promptVariant(category, chain);
  }

  const contractName =
    flags.name ?? (await promptContractName(variantMeta.defaultContractName));

  const kebab = pascalToKebab(contractName);
  const suggestedOut = await detectOutputDir(process.cwd(), chain).catch(() =>
    defaultOutputDir(process.cwd(), chain, kebab),
  );

  const defaultDir =
    chain === "solana" ? defaultOutputDir(process.cwd(), chain, kebab) : suggestedOut;

  const targetDir = flags.out
    ? path.resolve(flags.out)
    : flags.yes
      ? path.resolve(defaultDir)
      : await promptOutputDir(defaultDir);

  if (!flags.yes) {
    const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
      {
        type: "confirm",
        name: "confirmed",
        message: `Generate ${chalk.cyan(variantMeta.id)} (${contractName}) → ${targetDir}?`,
        default: true,
      },
    ]);
    if (!confirmed) {
      console.log(chalk.yellow("Cancelled."));
      return;
    }
  }

  const spinner = ora(
    `Generating ${chalk.cyan(variantMeta.id)} for ${chalk.yellow(chain)}...`,
  ).start();

  try {
    const result = await generateContract({
      category,
      chain,
      variant: variantMeta.id,
      contractName,
      targetDir,
      generatorsRoot: resolveGeneratorsRoot(),
      skipExisting: flags.skipExisting ?? false,
    });

    spinner.succeed(
      chalk.green(
        `Wrote ${result.filesWritten} file(s)${result.filesSkipped ? `, skipped ${result.filesSkipped} existing` : ""}`,
      ),
    );
    console.log();
    console.log(chalk.bold.green("✓ Generated"));
    console.log(`  ${chalk.dim("Path:")} ${result.targetDir}`);
    console.log(`  ${chalk.dim("Variant:")} ${variantMeta.name}`);
    console.log();
    console.log(chalk.dim("See README in output folder for dependencies and next steps."));
  } catch (err) {
    spinner.fail(chalk.red("Generation failed"));
    throw err;
  }
}

function addGenerateFlags(cmd: Command): Command {
  return cmd
    .option("-c, --chain <chain>", "evm or solana")
    .option("-v, --variant <id>", "Generator variant id")
    .option("-n, --name <name>", "Contract/program name (PascalCase)")
    .option("-o, --out <dir>", "Output directory")
    .option("-y, --yes", "Skip confirmation")
    .option("--skip-existing", "Do not overwrite existing files");
}

function registerCategoryCommand(
  generate: Command,
  category: GenerateCategory,
  description: string,
): void {
  const cmd = generate.command(category).description(description);
  addGenerateFlags(cmd).action(async function (this: Command) {
    await runGenerate(category, subcommandFlags(this));
  });
}

export function registerGenerateCommand(program: Command): void {
  const generate = program
    .command("generate")
    .alias("g")
    .description("Generate contracts and programs from boilerplate");

  addGenerateFlags(generate).action(async function (this: Command) {
    const flags = subcommandFlags(this);
    const { category } = await inquirer.prompt<{ category: GenerateCategory }>([
      {
        type: "list",
        name: "category",
        message: "What do you want to generate?",
        choices: CATEGORIES.map((c) => ({
          name: c.label,
          value: c.id,
        })),
      },
    ]);
    await runGenerate(category, flags);
  });

  registerCategoryCommand(generate, "token", "Generate token contracts (ERC20, SPL, tax, airdrop)");
  registerCategoryCommand(generate, "nft", "Generate NFT contracts (ERC721, ERC1155, Metaplex)");
  registerCategoryCommand(
    generate,
    "staking",
    "Generate staking contracts/programs",
  );
  registerCategoryCommand(generate, "vault", "Generate vault / escrow contracts");
  registerCategoryCommand(
    generate,
    "prediction-market",
    "Generate prediction market skeletons",
  );

}
