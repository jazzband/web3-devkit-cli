import fs from "node:fs/promises";
import path from "node:path";
import { parseInitOptions, toKebabCase, toSnakeCase, type InitOptions } from "./config.js";
import { renderTemplate } from "./render.js";
import type { BootstrapOptions, BootstrapResult, TemplateId } from "./types.js";

const DOCKER_FILES = new Set([
  "docker-compose.yml",
  "docker-compose.yaml",
  "Dockerfile",
  ".dockerignore",
]);

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function shouldSkipFile(relativePath: string, includeDocker: boolean): boolean {
  const basename = path.basename(relativePath);
  if (!includeDocker && DOCKER_FILES.has(basename)) {
    return true;
  }
  return false;
}

export async function bootstrapProject(
  options: BootstrapOptions,
): Promise<BootstrapResult> {
  const parsed: InitOptions = parseInitOptions({
    templateId: options.templateId,
    projectName: options.projectName,
    targetDir: options.targetDir,
    includeDocker: options.includeDocker ?? true,
  });

  const templateDir = path.join(options.templateRoot, parsed.templateId);

  if (!(await pathExists(templateDir))) {
    throw new Error(
      `Template "${parsed.templateId}" not found at ${templateDir}. Run from the web3-devkit repo or reinstall the package.`,
    );
  }

  if (await pathExists(parsed.targetDir)) {
    const stat = await fs.stat(parsed.targetDir);
    const entries = await fs.readdir(parsed.targetDir);
    if (stat.isDirectory() && entries.length > 0) {
      throw new Error(
        `Target directory "${parsed.targetDir}" already exists and is not empty.`,
      );
    }
  }

  const ctx: Record<string, string> = {
    projectName: parsed.projectName,
    projectNameKebab: toKebabCase(parsed.projectName),
    projectNameSnake: toSnakeCase(parsed.projectName),
  };

  const result = await renderTemplate({
    templateDir,
    targetDir: parsed.targetDir,
    context: ctx,
    filter: (relativePath) => !shouldSkipFile(relativePath, parsed.includeDocker),
  });

  return {
    targetDir: result.targetDir,
    templateId: parsed.templateId as TemplateId,
    filesWritten: result.filesWritten,
  };
}
