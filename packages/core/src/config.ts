import { z } from "zod";

export const templateIdSchema = z.enum([
  "evm-foundry",
  "evm-hardhat",
  "solana-anchor",
  "nextjs-wagmi",
  "nextjs-solana-wallet",
  "fullstack-evm",
  "fullstack-solana",
]);

export const initOptionsSchema = z.object({
  templateId: templateIdSchema,
  projectName: z
    .string()
    .min(1, "Project name is required")
    .max(64, "Project name must be 64 characters or less")
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_\-\s]*$/,
      "Project name must start with a letter and contain only letters, numbers, spaces, hyphens, or underscores",
    ),
  targetDir: z.string().min(1, "Target directory is required"),
  includeDocker: z.boolean().default(true),
});

export type InitOptionsInput = z.input<typeof initOptionsSchema>;
export type InitOptions = z.output<typeof initOptionsSchema>;

export function parseInitOptions(input: unknown): InitOptions {
  return initOptionsSchema.parse(input);
}

export function toKebabCase(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function toSnakeCase(name: string): string {
  return toKebabCase(name).replace(/-/g, "_");
}

/** PascalCase / camelCase → kebab-case (e.g. MyToken → my-token) */
export function pascalToKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

export function pascalToSnake(name: string): string {
  return pascalToKebab(name).replace(/-/g, "_");
}
