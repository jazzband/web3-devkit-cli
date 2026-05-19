"use client";

import { type Abi, type Address, type Hash } from "viem";
import { useWriteContract } from "wagmi";
import { sendContractTransaction } from "@/lib/web3/transaction";

export function useContractWrite<TAbi extends Abi>(params: {
  address: Address;
  abi: TAbi;
  functionName: string;
}) {
  const write = useWriteContract();

  async function writeAsync(args?: readonly unknown[]): Promise<Hash> {
    return sendContractTransaction({
      address: params.address,
      abi: params.abi,
      functionName: params.functionName,
      args,
    });
  }

  return { ...write, writeAsync };
}
