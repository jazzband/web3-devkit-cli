import { ethers } from "hardhat";
import { deployLog } from "./logger.js";

async function main() {
  const Counter = await ethers.getContractFactory("Counter");
  const counter = await Counter.deploy();
  await counter.waitForDeployment();
  deployLog.info("Counter deployed to:", await counter.getAddress());
}

main().catch((error: unknown) => {
  deployLog.error(error instanceof Error ? error : String(error));
  process.exitCode = 1;
});
