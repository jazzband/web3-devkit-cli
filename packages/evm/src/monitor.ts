import {
  createPublicClient,
  formatUnits,
  http,
  parseAbi,
  type Address,
  type Hash,
} from "viem";
import type { EvmNetworkConfig } from "./networks.js";
import { getRpcUrl } from "./networks.js";

const ERC20_ABI = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);

export interface MonitorOptions {
  network: EvmNetworkConfig;
  rpcUrl?: string;
  pollIntervalMs?: number;
  signal?: AbortSignal;
}

export interface ContractMonitorOptions extends MonitorOptions {
  address: Address;
  eventName?: string;
}

export interface WalletMonitorOptions extends MonitorOptions {
  address: Address;
}

export interface TokenMonitorOptions extends MonitorOptions {
  tokenAddress: Address;
  wallet?: Address;
  symbol?: string;
}

export interface ParsedTransferEvent {
  eventName: string;
  from: Address;
  to: Address;
  amount: string;
  amountRaw: bigint;
  symbol: string;
  txHash: Hash;
  blockNumber: bigint;
}

export type TransferHandler = (event: ParsedTransferEvent) => void;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new Error("aborted"));
      },
      { once: true },
    );
  });
}

function createMonitorClient(network: EvmNetworkConfig, rpcUrl?: string) {
  return createPublicClient({
    chain: network.chain,
    transport: http(getRpcUrl(network, rpcUrl), { timeout: 20_000 }),
  });
}

async function readTokenMeta(
  client: ReturnType<typeof createMonitorClient>,
  address: Address,
): Promise<{ symbol: string; decimals: number }> {
  try {
    const [symbol, decimals] = await Promise.all([
      client.readContract({ address, abi: ERC20_ABI, functionName: "symbol" }),
      client.readContract({ address, abi: ERC20_ABI, functionName: "decimals" }),
    ]);
    return { symbol, decimals: Number(decimals) };
  } catch {
    return { symbol: "TOKEN", decimals: 18 };
  }
}

interface TransferLogShape {
  eventName: string;
  args: { from?: Address; to?: Address; value?: bigint };
  transactionHash?: Hash | null;
  blockNumber?: bigint | null;
}

function parseTransferLog(
  log: TransferLogShape,
  symbol: string,
  decimals: number,
): ParsedTransferEvent | null {
  if (log.eventName !== "Transfer") return null;
  const { from, to, value } = log.args;
  if (!from || !to || value === undefined) return null;

  return {
    eventName: "Transfer",
    from,
    to,
    amount: formatUnits(value, decimals),
    amountRaw: value,
    symbol,
    txHash: (log.transactionHash ?? "0x") as Hash,
    blockNumber: log.blockNumber ?? 0n,
  };
}

async function pollTransferEvents(
  client: ReturnType<typeof createMonitorClient>,
  address: Address,
  symbol: string,
  decimals: number,
  fromBlock: bigint,
  onEvent: TransferHandler,
  extraFilter?: (log: TransferLogShape) => boolean,
): Promise<bigint> {
  const logs = await client.getContractEvents({
    address,
    abi: ERC20_ABI,
    eventName: "Transfer",
    fromBlock,
    toBlock: "latest",
  });

  let latest = fromBlock;
  for (const log of logs) {
    if (extraFilter && !extraFilter(log)) continue;
    const parsed = parseTransferLog(log, symbol, decimals);
    if (parsed) {
      onEvent(parsed);
      if (log.blockNumber && log.blockNumber > latest) {
        latest = log.blockNumber;
      }
    }
  }

  const block = await client.getBlockNumber();
  return block > latest ? block : latest;
}

export async function monitorContractTransfers(
  options: ContractMonitorOptions,
  onEvent: TransferHandler,
): Promise<void> {
  const eventName = options.eventName ?? "Transfer";
  if (eventName !== "Transfer") {
    throw new Error(
      `Event "${eventName}" is not supported yet. Use Transfer or extend with a custom ABI.`,
    );
  }

  const client = createMonitorClient(options.network, options.rpcUrl);
  const meta = await readTokenMeta(client, options.address);
  let lastBlock = await client.getBlockNumber();
  const pollMs = options.pollIntervalMs ?? 4_000;
  let primed = false;

  while (!options.signal?.aborted) {
    try {
      if (!primed) {
        primed = true;
        await sleep(pollMs, options.signal);
        lastBlock = await client.getBlockNumber();
        continue;
      }
      lastBlock = await pollTransferEvents(
        client,
        options.address,
        meta.symbol,
        meta.decimals,
        lastBlock + 1n,
        onEvent,
      );
      await sleep(pollMs, options.signal);
    } catch (err) {
      if (options.signal?.aborted || (err instanceof Error && err.message === "aborted")) {
        break;
      }
      throw err;
    }
  }
}

async function pollWalletTokenTransfers(
  client: ReturnType<typeof createMonitorClient>,
  tokenAddress: Address,
  wallet: Address,
  fromBlock: bigint,
  onEvent: TransferHandler,
): Promise<bigint> {
  const meta = await readTokenMeta(client, tokenAddress);
  const currentBlock = await client.getBlockNumber();
  if (currentBlock <= fromBlock) return fromBlock;

  const [incoming, outgoing] = await Promise.all([
    client.getContractEvents({
      address: tokenAddress,
      abi: ERC20_ABI,
      eventName: "Transfer",
      args: { to: wallet },
      fromBlock: fromBlock + 1n,
      toBlock: currentBlock,
    }),
    client.getContractEvents({
      address: tokenAddress,
      abi: ERC20_ABI,
      eventName: "Transfer",
      args: { from: wallet },
      fromBlock: fromBlock + 1n,
      toBlock: currentBlock,
    }),
  ]);

  for (const log of [...incoming, ...outgoing]) {
    const parsed = parseTransferLog(log, meta.symbol, meta.decimals);
    if (parsed) onEvent(parsed);
  }

  return currentBlock;
}

export async function monitorWalletTransfers(
  options: WalletMonitorOptions,
  onEvent: TransferHandler,
): Promise<void> {
  const tokenAddress = options.network.usdcAddress;
  if (!tokenAddress) {
    throw new Error(
      `Wallet monitor on ${options.network.name} requires a configured USDC address. Use "web3 monitor token" for a specific token.`,
    );
  }

  const client = createMonitorClient(options.network, options.rpcUrl);
  let lastBlock = await client.getBlockNumber();
  const pollMs = options.pollIntervalMs ?? 4_000;
  let primed = false;

  while (!options.signal?.aborted) {
    try {
      if (!primed) {
        primed = true;
        await sleep(pollMs, options.signal);
        lastBlock = await client.getBlockNumber();
        continue;
      }
      lastBlock = await pollWalletTokenTransfers(
        client,
        tokenAddress,
        options.address,
        lastBlock,
        onEvent,
      );
      await sleep(pollMs, options.signal);
    } catch (err) {
      if (options.signal?.aborted || (err instanceof Error && err.message === "aborted")) {
        break;
      }
      throw err;
    }
  }
}

export async function monitorTokenTransfers(
  options: TokenMonitorOptions,
  onEvent: TransferHandler,
): Promise<void> {
  const client = createMonitorClient(options.network, options.rpcUrl);
  const meta = options.symbol
    ? { symbol: options.symbol, decimals: 18 }
    : await readTokenMeta(client, options.tokenAddress);

  const wallet = options.wallet?.toLowerCase();
  let lastBlock = await client.getBlockNumber();
  const pollMs = options.pollIntervalMs ?? 4_000;
  let primed = false;

  while (!options.signal?.aborted) {
    try {
      if (!primed) {
        primed = true;
        await sleep(pollMs, options.signal);
        lastBlock = await client.getBlockNumber();
        continue;
      }
      lastBlock = await pollTransferEvents(
        client,
        options.tokenAddress,
        meta.symbol,
        meta.decimals,
        lastBlock + 1n,
        onEvent,
        wallet
          ? (log) => {
              const { from, to } = log.args;
              if (!from || !to) return false;
              return from.toLowerCase() === wallet || to.toLowerCase() === wallet;
            }
          : undefined,
      );
      await sleep(pollMs, options.signal);
    } catch (err) {
      if (options.signal?.aborted || (err instanceof Error && err.message === "aborted")) {
        break;
      }
      throw err;
    }
  }
}
