import chalk from "chalk";
import type { HealthStatus } from "@web3-devkit/evm";
import { writeln } from "./logger.js";

export function statusColor(status: HealthStatus): (text: string) => string {
  switch (status) {
    case "Healthy":
      return chalk.green;
    case "Degraded":
      return chalk.yellow;
    case "Unreachable":
      return chalk.red;
    default:
      return chalk.white;
  }
}

export function printKeyValue(label: string, value: string): void {
  const pad = 16;
  writeln(`${chalk.dim(label.padEnd(pad))}${value}`);
}

export function shortenAddress(addr: string, head = 6, tail = 4): string {
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head + 2)}...${addr.slice(-tail)}`;
}

export function formatBalance(symbol: string, amount: string): string {
  const num = parseFloat(amount);
  if (Number.isNaN(num)) return `${amount} ${symbol}`;
  if (symbol === "USDC" || symbol === "USDT") return num.toFixed(2);
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
}
