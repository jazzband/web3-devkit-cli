import { z } from "zod";
import { pascalToKebab, pascalToSnake } from "./config.js";

export const chainSchema = z.enum(["evm", "solana"]);

export const generateCategorySchema = z.enum([
  "token",
  "nft",
  "staking",
  "vault",
  "prediction-market",
]);

export const generateOptionsSchema = z.object({
  category: generateCategorySchema,
  chain: chainSchema,
  variant: z.string().min(1),
  contractName: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[A-Z][a-zA-Z0-9]*$/, "Contract name must be PascalCase (e.g. MyToken)"),
  targetDir: z.string().min(1),
});

export type GenerateCategory = z.infer<typeof generateCategorySchema>;
export type GenerateOptions = z.infer<typeof generateOptionsSchema>;

export function buildGenerateContext(contractName: string): Record<string, string> {
  const contractNamePascal = contractName;
  const contractNameKebab = pascalToKebab(contractName);
  const contractNameSnake = pascalToSnake(contractName);
  return {
    contractName: contractNamePascal,
    contractNamePascal,
    contractNameKebab,
    contractNameSnake,
  };
}

export function parseGenerateOptions(input: unknown): GenerateOptions {
  return generateOptionsSchema.parse(input);
}
