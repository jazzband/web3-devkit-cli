export type TemplateCategory = "evm" | "solana" | "fullstack" | "frontend";

export type TemplateId =
  | "evm-foundry"
  | "evm-hardhat"
  | "solana-anchor"
  | "nextjs-wagmi"
  | "nextjs-solana-wallet"
  | "fullstack-evm"
  | "fullstack-solana";

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
}

export interface BootstrapContext {
  projectName: string;
  projectNameKebab: string;
  targetDir: string;
  includeDocker: boolean;
}

export interface BootstrapOptions {
  templateId: TemplateId;
  projectName: string;
  targetDir: string;
  includeDocker?: boolean;
  templateRoot: string;
}

export interface BootstrapResult {
  targetDir: string;
  templateId: TemplateId;
  filesWritten: number;
}
