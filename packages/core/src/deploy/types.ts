export interface DeployedContract {
  name: string;
  address: string;
  txHash?: string;
  abiPath?: string;
  bytecodeHash?: string;
}

export interface DeployedProgram {
  name: string;
  programId: string;
  txSignature?: string;
}

export interface DeploymentRecord {
  chain: "evm" | "solana";
  network: string;
  networkKey: string;
  deployedAt: string;
  deployer?: string;
  contracts?: DeployedContract[];
  programs?: DeployedProgram[];
  artifacts?: Record<string, string>;
  gasUsed?: string;
  estimatedGasCost?: string;
  estimatedGas?: string;
  tool?: "foundry" | "hardhat" | "viem" | "anchor";
}

export interface DeploymentFile {
  latest: DeploymentRecord;
  history: DeploymentRecord[];
}
