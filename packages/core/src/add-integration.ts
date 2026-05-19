import path from "node:path";
import { renderTemplate } from "./render.js";

export interface AddIntegrationOptions {
  integrationId: string;
  targetDir: string;
  integrationsRoot: string;
  skipExisting?: boolean;
}

export interface AddIntegrationResult {
  targetDir: string;
  integrationId: string;
  filesWritten: number;
  filesSkipped: number;
}

export async function addIntegration(
  options: AddIntegrationOptions,
): Promise<AddIntegrationResult> {
  const templateDir = path.join(options.integrationsRoot, options.integrationId);

  const result = await renderTemplate({
    templateDir,
    targetDir: options.targetDir,
    context: { projectName: "web3-app" },
    skipExisting: options.skipExisting ?? false,
  });

  return {
    targetDir: result.targetDir,
    integrationId: options.integrationId,
    filesWritten: result.filesWritten,
    filesSkipped: result.filesSkipped,
  };
}
