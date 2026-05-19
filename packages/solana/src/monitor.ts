import { PublicKey } from "@solana/web3.js";
import type { SolanaNetworkConfig } from "./networks.js";
import { createSolanaConnection } from "./wallet.js";

export interface SolanaMonitorOptions {
  network: SolanaNetworkConfig;
  rpcUrl?: string;
  pollIntervalMs?: number;
  signal?: AbortSignal;
}

export interface SolanaWalletMonitorOptions extends SolanaMonitorOptions {
  address: string;
}

export interface SolanaTokenMonitorOptions extends SolanaMonitorOptions {
  mint: string;
  wallet?: string;
}

export interface SolanaLogEvent {
  signature: string;
  slot: number;
  logs: string[];
  label: string;
}

export type SolanaLogHandler = (event: SolanaLogEvent) => void;

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

/** Poll recent transactions for an address (lightweight wallet activity monitor). */
export async function monitorSolanaWallet(
  options: SolanaWalletMonitorOptions,
  onEvent: SolanaLogHandler,
): Promise<void> {
  const connection = createSolanaConnection(options.network, options.rpcUrl);
  const pubkey = new PublicKey(options.address);
  let lastSignature: string | undefined;
  const pollMs = options.pollIntervalMs ?? 4_000;

  while (!options.signal?.aborted) {
    try {
      const sigs = await connection.getSignaturesForAddress(pubkey, { limit: 5 });
      if (sigs.length > 0) {
        const newest = sigs[0].signature;
        if (lastSignature && newest !== lastSignature) {
          for (const sig of sigs) {
            if (sig.signature === lastSignature) break;
            const tx = await connection.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            });
            onEvent({
              signature: sig.signature,
              slot: sig.slot,
              logs: tx?.meta?.logMessages ?? [],
              label: "Wallet activity",
            });
          }
        }
        lastSignature = newest;
      }
      await sleep(pollMs, options.signal);
    } catch (err) {
      if (options.signal?.aborted || (err instanceof Error && err.message === "aborted")) {
        break;
      }
      throw err;
    }
  }
}

/** Subscribe to logs mentioning a mint or program via polling signatures. */
export async function monitorSolanaToken(
  options: SolanaTokenMonitorOptions,
  onEvent: SolanaLogHandler,
): Promise<void> {
  const connection = createSolanaConnection(options.network, options.rpcUrl);
  const mint = new PublicKey(options.mint);
  let lastSignature: string | undefined;
  const pollMs = options.pollIntervalMs ?? 4_000;

  while (!options.signal?.aborted) {
    try {
      const sigs = await connection.getSignaturesForAddress(mint, { limit: 5 });
      if (sigs.length > 0) {
        const newest = sigs[0].signature;
        if (lastSignature && newest !== lastSignature) {
          for (const sig of sigs) {
            if (sig.signature === lastSignature) break;
            const tx = await connection.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            });
            const logs = tx?.meta?.logMessages ?? [];
            if (options.wallet && !logs.some((l) => l.includes(options.wallet!))) {
              continue;
            }
            onEvent({
              signature: sig.signature,
              slot: sig.slot,
              logs,
              label: "Token activity",
            });
          }
        }
        lastSignature = newest;
      }
      await sleep(pollMs, options.signal);
    } catch (err) {
      if (options.signal?.aborted || (err instanceof Error && err.message === "aborted")) {
        break;
      }
      throw err;
    }
  }
}
