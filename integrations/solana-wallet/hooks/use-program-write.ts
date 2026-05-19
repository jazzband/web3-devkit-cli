"use client";

import { useSolanaTransaction } from "@/lib/solana/transaction";
import { type Transaction } from "@solana/web3.js";
import { useCallback, useState } from "react";

export function useProgramWrite() {
  const { sendTransaction, publicKey } = useSolanaTransaction();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const write = useCallback(
    async (buildTx: () => Promise<Transaction>) => {
      if (!publicKey) throw new Error("Wallet not connected");
      setLoading(true);
      setError(null);
      try {
        const tx = await buildTx();
        const sig = await sendTransaction(tx);
        setSignature(sig);
        return sig;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, sendTransaction],
  );

  return { write, loading, error, signature };
}
