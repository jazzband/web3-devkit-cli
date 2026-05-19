import { Connection } from "@solana/web3.js";
import type { SolanaNetworkConfig } from "./networks.js";
import { getSolanaRpcUrl } from "./networks.js";
import type { HealthStatus } from "./types.js";

export type { HealthStatus };

export interface RpcTestResult {
  url: string;
  latencyMs: number;
  slot: number;
  status: HealthStatus;
}

export interface NetworkCheckResult {
  network: string;
  slot: number;
  rpcUrl: string;
  latencyMs: number;
  status: HealthStatus;
}

function statusFromLatency(latencyMs: number, ok: boolean): HealthStatus {
  if (!ok) return "Unreachable";
  if (latencyMs > 2000) return "Degraded";
  return "Healthy";
}

export async function testSolanaRpc(
  network: SolanaNetworkConfig,
  customUrl?: string,
): Promise<RpcTestResult> {
  const url = getSolanaRpcUrl(network, customUrl);
  const start = performance.now();
  try {
    const connection = new Connection(url, "confirmed");
    const slot = await connection.getSlot();
    const latencyMs = Math.round(performance.now() - start);
    return { url, latencyMs, slot, status: statusFromLatency(latencyMs, true) };
  } catch {
    return {
      url,
      latencyMs: Math.round(performance.now() - start),
      slot: 0,
      status: "Unreachable",
    };
  }
}

export async function checkSolanaNetwork(
  network: SolanaNetworkConfig,
  customUrl?: string,
): Promise<NetworkCheckResult> {
  const rpc = await testSolanaRpc(network, customUrl);
  return {
    network: network.name,
    slot: rpc.slot,
    rpcUrl: rpc.url,
    latencyMs: rpc.latencyMs,
    status: rpc.status,
  };
}

export async function testSolanaRpcUrl(url: string): Promise<RpcTestResult> {
  const start = performance.now();
  try {
    const connection = new Connection(url, "confirmed");
    const slot = await connection.getSlot();
    const latencyMs = Math.round(performance.now() - start);
    return { url, latencyMs, slot, status: statusFromLatency(latencyMs, true) };
  } catch {
    return {
      url,
      latencyMs: Math.round(performance.now() - start),
      slot: 0,
      status: "Unreachable",
    };
  }
}
