#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { cli, initLogger } from "./utils/logger.js";

initLogger();
import { registerInitCommand } from "./commands/init.js";
import { registerGenerateCommand } from "./commands/generate.js";
import { registerWalletCommand } from "./commands/wallet.js";
import { registerNetworkCommand } from "./commands/network.js";
import { registerRpcCommand } from "./commands/rpc.js";
import { registerDeployCommand } from "./commands/deploy.js";
import { registerVerifyCommand } from "./commands/verify.js";
import { registerMonitorCommand } from "./commands/monitor.js";
import { registerAddCommand } from "./commands/add.js";
import { registerConfigCommand } from "./commands/config.js";

const program = new Command();

program
  .name("web3")
  .description(
    chalk.bold("Web3 Developer Toolkit") +
      " — bootstrap, deploy, and manage EVM + Solana projects",
  )
  .version("0.1.0");

registerInitCommand(program);
registerGenerateCommand(program);
registerWalletCommand(program);
registerNetworkCommand(program);
registerRpcCommand(program);
registerDeployCommand(program);
registerVerifyCommand(program);
registerMonitorCommand(program);
registerAddCommand(program);
registerConfigCommand(program);

program.parseAsync(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  cli.error(chalk.red("Error:"), message);
  if (err instanceof Error && err.stack && process.env.WEB3_LOG_LEVEL === "debug") {
    cli.debug(err.stack);
  }
  process.exit(1);
});
