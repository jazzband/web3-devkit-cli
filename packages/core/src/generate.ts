import path from "node:path";
import { buildGenerateContext, parseGenerateOptions, type GenerateOptions } from "./generate-config.js";
import { renderTemplate } from "./render.js";

export interface GenerateProjectOptions {
  category: GenerateOptions["category"];
  chain: GenerateOptions["chain"];
  variant: string;
  contractName: string;
  targetDir: string;
  generatorsRoot: string;
  skipExisting?: boolean;
}

export interface GenerateProjectResult {
  targetDir: string;
  filesWritten: number;
  filesSkipped: number;
  variant: string;
}

export async function generateContract(
  options: GenerateProjectOptions,
): Promise<GenerateProjectResult> {
  const parsed = parseGenerateOptions({
    category: options.category,
    chain: options.chain,
    variant: options.variant,
    contractName: options.contractName,
    targetDir: options.targetDir,
  });

  const templateDir = path.join(
    options.generatorsRoot,
    parsed.category,
    parsed.chain,
    parsed.variant,
  );

  const context = buildGenerateContext(parsed.contractName);

  const result = await renderTemplate({
    templateDir,
    targetDir: parsed.targetDir,
    context,
    skipExisting: options.skipExisting ?? false,
  });

  return {
    targetDir: result.targetDir,
    filesWritten: result.filesWritten,
    filesSkipped: result.filesSkipped,
    variant: parsed.variant,
  };
}
