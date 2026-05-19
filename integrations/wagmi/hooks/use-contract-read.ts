"use client";

import { type Abi, type Address } from "viem";
import { useReadContract } from "wagmi";

export function useContractRead<TAbi extends Abi>(params: {
  address: Address;
  abi: TAbi;
  functionName: string;
  args?: readonly unknown[];
  enabled?: boolean;
}) {
  return useReadContract({
    address: params.address,
    abi: params.abi,
    functionName: params.functionName,
    args: params.args,
    query: { enabled: params.enabled ?? true },
  });
}
