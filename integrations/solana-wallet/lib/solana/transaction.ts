"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  type Connection,
  type PublicKey,
  type Transaction,
  type TransactionSignature,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

export async function sendSolanaTransaction(
  connection: Connection,
  transaction: Transaction,
  signers: Parameters<typeof sendAndConfirmTransaction>[2] = [],
): Promise<TransactionSignature> {
  return sendAndConfirmTransaction(connection, transaction, signers);
}

export function useSolanaTransaction() {
  const { connection } = useConnection();
  const wallet = useWallet();

  async function sendTransaction(transaction: Transaction): Promise<TransactionSignature> {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error("Wallet not connected");
    }
    transaction.feePayer = wallet.publicKey;
    const signed = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(signature, "confirmed");
    return signature;
  }

  return { connection, publicKey: wallet.publicKey as PublicKey | null, sendTransaction };
}
