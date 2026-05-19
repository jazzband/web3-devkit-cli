"use client";

import {
  type Address,
  type Hash,
  type WriteContractParameters,
  waitForTransactionReceipt,
} from "viem";
import { writeContract } from "wagmi/actions";
import { wagmiConfig } from "./wagmi-config";

export async function sendContractTransaction(
  params: WriteContractParameters,
): Promise<Hash> {
  const hash = await writeContract(wagmiConfig, params);
  await waitForTransactionReceipt(wagmiConfig, { hash });
  return hash;
}

export async function sendNativeTransfer(
  to: Address,
  value: bigint,
  account?: Address,
): Promise<Hash> {
  const { sendTransaction } = await import("wagmi/actions");
  return sendTransaction(wagmiConfig, { to, value, account });
}
