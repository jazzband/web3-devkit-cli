import { z } from "zod";

const ethAddress = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address");
const privateKey = z
  .string()
  .min(1, "PRIVATE_KEY is required")
  .refine((v) => /^[a-fA-F0-9]{64}$/.test(v.trim().replace(/^0x/i, "")), {
    message: "PRIVATE_KEY must be 64 hex characters (32 bytes)",
  })
  .transform((v) => {
    const hex = v.trim().replace(/^0x/i, "");
    return ("0x" + hex) as string;
  });

export const evmDeployEnvSchema = z.object({
  RPC_URL: z.string().url("RPC_URL must be a valid URL"),
  PRIVATE_KEY: privateKey,
  ETHERSCAN_API_KEY: z.string().min(1).optional(),
});

export const solanaDeployEnvSchema = z.object({
  SOLANA_RPC_URL: z.string().url("SOLANA_RPC_URL must be a valid URL"),
  ANCHOR_WALLET: z.string().min(1, "ANCHOR_WALLET path is required"),
});

export const verifyEnvSchema = z.object({
  ETHERSCAN_API_KEY: z.string().min(1, "ETHERSCAN_API_KEY required for verification"),
  RPC_URL: z.string().url().optional(),
});

export type EvmDeployEnv = z.infer<typeof evmDeployEnvSchema>;
export type SolanaDeployEnv = z.infer<typeof solanaDeployEnvSchema>;

export function validateEvmDeployEnv(env: Record<string, string | undefined>): EvmDeployEnv {
  const result = evmDeployEnvSchema.safeParse(env);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid .env for EVM deploy:\n${lines.join("\n")}`);
  }
  return result.data;
}

export function validateSolanaDeployEnv(
  env: Record<string, string | undefined>,
): SolanaDeployEnv {
  const result = solanaDeployEnvSchema.safeParse(env);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid .env for Solana deploy:\n${lines.join("\n")}`);
  }
  return result.data;
}

export function validateVerifyEnv(env: Record<string, string | undefined>): {
  ETHERSCAN_API_KEY: string;
  RPC_URL?: string;
} {
  const result = verifyEnvSchema.safeParse(env);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid .env for verification:\n${lines.join("\n")}`);
  }
  return result.data;
}

export { ethAddress, privateKey };
