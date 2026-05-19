"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { type PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";

export function useProgramAccount(account: PublicKey | null, enabled = true) {
  const { connection } = useConnection();
  const [data, setData] = useState<Buffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!account || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const info = await connection.getAccountInfo(account);
      setData(info?.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [account, connection, enabled]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
