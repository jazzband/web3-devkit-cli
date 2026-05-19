import type { TemplateCategory, TemplateId, TemplateMeta } from "@web3-devkit/core";

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "evm-foundry",
    name: "EVM — Foundry",
    description: "Solidity contracts with Forge, Cast, and deployment scripts",
    category: "evm",
    tags: ["foundry", "solidity", "forge"],
  },
  {
    id: "evm-hardhat",
    name: "EVM — Hardhat",
    description: "TypeScript Hardhat workspace with deploy and test examples",
    category: "evm",
    tags: ["hardhat", "solidity", "typescript"],
  },
  {
    id: "solana-anchor",
    name: "Solana — Anchor",
    description: "Anchor program with tests and deploy scripts",
    category: "solana",
    tags: ["anchor", "rust", "solana"],
  },
  {
    id: "nextjs-wagmi",
    name: "Next.js + wagmi",
    description: "EVM frontend with wagmi and viem",
    category: "frontend",
    tags: ["nextjs", "wagmi", "viem", "evm"],
  },
  {
    id: "nextjs-solana-wallet",
    name: "Next.js + Solana Wallet",
    description: "Solana dApp frontend with wallet adapter",
    category: "frontend",
    tags: ["nextjs", "solana", "wallet-adapter"],
  },
  {
    id: "fullstack-evm",
    name: "Full-stack EVM",
    description: "Foundry contracts, Next.js frontend, and API backend",
    category: "fullstack",
    tags: ["foundry", "nextjs", "wagmi", "api"],
  },
  {
    id: "fullstack-solana",
    name: "Full-stack Solana",
    description: "Anchor program, Next.js frontend, and API backend",
    category: "fullstack",
    tags: ["anchor", "nextjs", "solana", "api"],
  },
];

export const CATEGORY_TEMPLATE_IDS: Record<
  Exclude<TemplateCategory, "frontend"> | "all",
  TemplateId[]
> = {
  all: TEMPLATES.map((t) => t.id),
  evm: ["evm-foundry", "evm-hardhat", "nextjs-wagmi", "fullstack-evm"],
  solana: ["solana-anchor", "nextjs-solana-wallet", "fullstack-solana"],
  fullstack: ["fullstack-evm", "fullstack-solana"],
};

export function getTemplate(id: TemplateId): TemplateMeta | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(
  category: TemplateCategory | "evm" | "solana" | "fullstack",
): TemplateMeta[] {
  if (category === "frontend") {
    return TEMPLATES.filter((t) => t.category === "frontend");
  }
  const ids = CATEGORY_TEMPLATE_IDS[category as keyof typeof CATEGORY_TEMPLATE_IDS];
  if (!ids) return TEMPLATES;
  return TEMPLATES.filter((t) => ids.includes(t.id));
}

export function resolveTemplateRoot(): string {
  const fromEnv = process.env.WEB3_DEVKIT_TEMPLATES;
  if (fromEnv) return fromEnv;

  // packages/templates/dist -> repo root templates/
  const packageRelative = new URL("../../../templates", import.meta.url);
  return packageRelative.pathname;
}
