import { createPublicClient, http } from "viem";
import type { EvmNetworkConfig } from "./networks.js";
import { getRpcUrl } from "./networks.js";

export type HealthStatus = "Healthy" | "Degraded" | "Unreachable";

export interface RpcTestResult {
  url: string;
  latencyMs: number;
  chainId: number;
  blockNumber: bigint;
  status: HealthStatus;
}

export interface NetworkCheckResult {
  network: string;
  chainId: number;
  blockNumber: bigint;
  rpcUrl: string;
  latencyMs: number;
  status: HealthStatus;
}

function statusFromLatency(latencyMs: number, ok: boolean): HealthStatus {
  if (!ok) return "Unreachable";
  if (latencyMs > 2000) return "Degraded";
  return "Healthy";
}

export async function testEvmRpc(
  network: EvmNetworkConfig,
  customUrl?: string,
): Promise<RpcTestResult> {
  const url = getRpcUrl(network, customUrl);
  const start = performance.now();
  try {
    const client = createPublicClient({
      chain: network.chain,
      transport: http(url, { timeout: 10_000 }),
    });
    const [chainId, blockNumber] = await Promise.all([
      client.getChainId(),
      client.getBlockNumber(),
    ]);
    const latencyMs = Math.round(performance.now() - start);
    return {
      url,
      latencyMs,
      chainId,
      blockNumber,
      status: statusFromLatency(latencyMs, true),
    };
  } catch {
    const latencyMs = Math.round(performance.now() - start);
    return {
      url,
      latencyMs,
      chainId: network.chain.id,
      blockNumber: 0n,
      status: "Unreachable",
    };
  }
}

export async function checkEvmNetwork(
  network: EvmNetworkConfig,
  customUrl?: string,
): Promise<NetworkCheckResult> {
  const rpc = await testEvmRpc(network, customUrl);
  return {
    network: network.name,
    chainId: rpc.chainId,
    blockNumber: rpc.blockNumber,
    rpcUrl: rpc.url,
    latencyMs: rpc.latencyMs,
    status: rpc.status,
  };
}

export async function testEvmRpcUrl(url: string, expectedChainId?: number): Promise<RpcTestResult> {
  const start = performance.now();
  try {
    const client = createPublicClient({ transport: http(url, { timeout: 10_000 }) });
    const [chainId, blockNumber] = await Promise.all([
      client.getChainId(),
      client.getBlockNumber(),
    ]);
    const latencyMs = Math.round(performance.now() - start);
    const ok = expectedChainId === undefined || chainId === expectedChainId;
    return {
      url,
      latencyMs,
      chainId,
      blockNumber,
      status: ok ? statusFromLatency(latencyMs, true) : "Degraded",
    };
  } catch {
    return {
      url,
      latencyMs: Math.round(performance.now() - start),
      chainId: expectedChainId ?? 0,
      blockNumber: 0n,
      status: "Unreachable",
    };
  }
}
