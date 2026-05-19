import { z } from "zod";

export const frameworkSchema = z.enum(["foundry", "hardhat", "anchor"]);
export const chainTypeSchema = z.enum(["evm", "solana"]);
export const walletTypeSchema = z.enum(["privateKey", "hardware", "env"]);

export const walletConfigSchema = z.object({
  type: walletTypeSchema.default("privateKey"),
  /** Env var name when type is "env" (default PRIVATE_KEY / ANCHOR_WALLET) */
  envKey: z.string().min(1).optional(),
});

export const projectConfigSchema = z.object({
  defaultChain: z.string().min(1),
  chainType: chainTypeSchema.default("evm"),
  framework: frameworkSchema.optional(),
  rpc: z.record(z.string(), z.string().min(1)).default({}),
  wallet: walletConfigSchema.default({ type: "privateKey" }),
});

export type Framework = z.infer<typeof frameworkSchema>;
export type ChainType = z.infer<typeof chainTypeSchema>;
export type WalletType = z.infer<typeof walletTypeSchema>;
export type WalletConfig = z.infer<typeof walletConfigSchema>;
export type ProjectConfig = z.infer<typeof projectConfigSchema>;

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  defaultChain: "base",
  chainType: "evm",
  framework: "foundry",
  rpc: {},
  wallet: { type: "privateKey" },
};

export function parseProjectConfig(data: unknown): ProjectConfig {
  const result = projectConfigSchema.safeParse(data);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid project config:\n${lines.join("\n")}`);
  }
  return result.data;
}
