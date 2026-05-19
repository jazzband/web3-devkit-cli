import path from "node:path";
import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import { bootstrapProject, toKebabCase, type TemplateId } from "@web3-devkit/core";
import {
  getTemplate,
  getTemplatesByCategory,
  resolveTemplateRoot,
  TEMPLATES,
} from "@web3-devkit/templates";
import { templateIdSchema } from "@web3-devkit/core";
import { writeln, writeWarn } from "../utils/logger.js";

type InitCategory = "evm" | "solana" | "fullstack" | undefined;

interface InitFlags {
  template?: string;
  name?: string;
  dir?: string;
  yes?: boolean;
  docker?: boolean;
}

async function promptTemplate(
  category: InitCategory | "frontend",
): Promise<TemplateId> {
  const templates =
    category === undefined
      ? TEMPLATES
      : category === "frontend"
        ? getTemplatesByCategory("frontend")
        : getTemplatesByCategory(category);

  const unique = [...new Map(templates.map((t) => [t.id, t])).values()];

  const { templateId } = await inquirer.prompt<{ templateId: TemplateId }>([
    {
      type: "list",
      name: "templateId",
      message: "Choose a project template",
      choices: unique.map((t) => ({
        name: `${chalk.cyan(t.id)} — ${t.description}`,
        value: t.id,
        short: t.id,
      })),
    },
  ]);

  return templateId;
}

async function promptProjectName(defaultName?: string): Promise<string> {
  const { projectName } = await inquirer.prompt<{ projectName: string }>([
    {
      type: "input",
      name: "projectName",
      message: "Project name",
      default: defaultName ?? "my-web3-app",
      validate: (input: string) => {
        const trimmed = input.trim();
        if (!trimmed) return "Project name is required";
        if (!/^[a-zA-Z][a-zA-Z0-9_\-\s]*$/.test(trimmed)) {
          return "Use letters, numbers, spaces, hyphens, or underscores; must start with a letter";
        }
        return true;
      },
    },
  ]);
  return projectName.trim();
}

async function promptTargetDir(projectName: string, dirFlag?: string): Promise<string> {
  const defaultDir = dirFlag ?? `./${toKebabCase(projectName)}`;
  const { targetDir } = await inquirer.prompt<{ targetDir: string }>([
    {
      type: "input",
      name: "targetDir",
      message: "Output directory",
      default: defaultDir,
    },
  ]);
  return path.resolve(targetDir.trim());
}

async function confirmBootstrap(
  templateId: TemplateId,
  projectName: string,
  targetDir: string,
  skip: boolean,
): Promise<boolean> {
  if (skip) return true;

  const meta = getTemplate(templateId);
  writeln();
  writeln(chalk.bold("Summary"));
  writeln(`  ${chalk.dim("Template:")}  ${chalk.cyan(templateId)}${meta ? ` (${meta.name})` : ""}`);
  writeln(`  ${chalk.dim("Project:")}   ${projectName}`);
  writeln(`  ${chalk.dim("Directory:")} ${targetDir}`);
  writeln();

  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: "confirm",
      name: "confirmed",
      message: "Create project?",
      default: true,
    },
  ]);
  return confirmed;
}

async function runInit(category: InitCategory, flags: InitFlags): Promise<void> {
  let templateId: TemplateId;

  if (flags.template) {
    const parsed = templateIdSchema.safeParse(flags.template);
    if (!parsed.success) {
      throw new Error(
        `Invalid template "${flags.template}". Valid: ${templateIdSchema.options.join(", ")}`,
      );
    }
    templateId = parsed.data;

    if (category) {
      const allowed = getTemplatesByCategory(category).map((t) => t.id);
      if (!allowed.includes(templateId)) {
        throw new Error(
          `Template "${templateId}" is not available for "web3 init ${category}".`,
        );
      }
    }
  } else if (category) {
    templateId = await promptTemplate(category);
  } else {
    const { chain } = await inquirer.prompt<{ chain: "evm" | "solana" | "fullstack" | "frontend" }>([
      {
        type: "list",
        name: "chain",
        message: "What are you building?",
        choices: [
          { name: "EVM (Foundry / Hardhat / wagmi)", value: "evm" },
          { name: "Solana (Anchor / wallet adapter)", value: "solana" },
          { name: "Full-stack (contracts + frontend + API)", value: "fullstack" },
          {
            name: "Frontend only (Next.js wagmi or Solana wallet)",
            value: "frontend",
          },
        ],
      },
    ]);
    templateId = await promptTemplate(chain);
  }

  const projectName = flags.name ?? (await promptProjectName());
  const targetDir = flags.dir
    ? path.resolve(flags.dir)
    : await promptTargetDir(projectName, flags.dir);

  const includeDocker = flags.docker !== false;

  const confirmed = await confirmBootstrap(
    templateId,
    projectName,
    targetDir,
    flags.yes ?? false,
  );
  if (!confirmed) {
    writeWarn(chalk.yellow("Cancelled."));
    return;
  }

  const spinner = ora(`Scaffolding ${chalk.cyan(templateId)}...`).start();

  try {
    const result = await bootstrapProject({
      templateId,
      projectName,
      targetDir,
      includeDocker,
      templateRoot: resolveTemplateRoot(),
    });

    spinner.succeed(chalk.green(`Created ${result.filesWritten} files`));
    writeln();
    writeln(chalk.bold.green("✓ Project ready"));
    writeln(`  ${chalk.dim("Path:")} ${result.targetDir}`);
    writeln();
    writeln(chalk.bold("Next steps:"));
    const cdPath = result.targetDir.startsWith(process.cwd() + path.sep)
      ? path.relative(process.cwd(), result.targetDir) || "."
      : result.targetDir;
    writeln(`  ${chalk.cyan(`cd ${cdPath}`)}`);
    writeln(`  ${chalk.dim("cat README.md")}`);
  } catch (err) {
    spinner.fail(chalk.red("Bootstrap failed"));
    throw err;
  }
}

function addInitFlags(cmd: Command): Command {
  return cmd
    .option("-t, --template <id>", "Template id (e.g. evm-foundry)")
    .option("-n, --name <name>", "Project name")
    .option("-d, --dir <path>", "Output directory")
    .option("-y, --yes", "Skip confirmation prompt")
    .option("--no-docker", "Omit optional Docker files");
}

export function registerInitCommand(program: Command): void {
  const init = program
    .command("init")
    .description("Bootstrap a new Web3 project from a template");

  addInitFlags(init).action(async (flags: InitFlags) => {
    await runInit(undefined, flags);
  });

  const evm = init.command("evm").description("Initialize an EVM project");
  addInitFlags(evm).action(async function (this: Command) {
    await runInit("evm", subcommandFlags(this));
  });

  const solana = init.command("solana").description("Initialize a Solana project");
  addInitFlags(solana).action(async function (this: Command) {
    await runInit("solana", subcommandFlags(this));
  });

  const fullstack = init
    .command("fullstack")
    .description("Initialize a full-stack Web3 project");
  addInitFlags(fullstack).action(async function (this: Command) {
    await runInit("fullstack", subcommandFlags(this));
  });
}

/** Commander attaches shared flags to the parent `init` command when using `init <chain>`. */
function subcommandFlags(command: Command): InitFlags {
  const parent = command.parent;
  if (!parent) return command.opts() as InitFlags;
  const fromParent = parent.opts() as InitFlags;
  const fromSelf = command.opts() as InitFlags;
  return { ...fromSelf, ...fromParent };
}
