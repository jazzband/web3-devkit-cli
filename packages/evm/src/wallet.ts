import {
  createPublicClient,
  erc20Abi,
  formatEther,
  formatUnits,
  http,
  type Address,
  type PublicClient,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { EvmNetworkConfig } from "./networks.js";
import { getRpcUrl } from "./networks.js";

export interface CreatedEvmWallet {
  address: Address;
  privateKey: `0x${string}`;
}

export function createEvmWallet(): CreatedEvmWallet {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return { address: account.address, privateKey };
}

export function createEvmPublicClient(
  network: EvmNetworkConfig,
  rpcUrl?: string,
): PublicClient {
  return createPublicClient({
    chain: network.chain,
    transport: http(getRpcUrl(network, rpcUrl), { timeout: 15_000 }),
  });
}

export async function getEvmNativeBalance(
  client: PublicClient,
  address: Address,
): Promise<string> {
  const wei = await client.getBalance({ address });
  return formatEther(wei);
}

export interface TokenBalance {
  symbol: string;
  balance: string;
  contractAddress?: Address;
}

export async function getEvmTokenBalances(
  client: PublicClient,
  address: Address,
  network: EvmNetworkConfig,
): Promise<TokenBalance[]> {
  const tokens: TokenBalance[] = [];

  if (network.usdcAddress) {
    try {
      const [raw, decimals, symbol] = await Promise.all([
        client.readContract({
          address: network.usdcAddress,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        }),
        client.readContract({
          address: network.usdcAddress,
          abi: erc20Abi,
          functionName: "decimals",
        }),
        client.readContract({
          address: network.usdcAddress,
          abi: erc20Abi,
          functionName: "symbol",
        }),
      ]);
      tokens.push({
        symbol,
        balance: formatUnits(raw, decimals),
        contractAddress: network.usdcAddress,
      });
    } catch {
      tokens.push({ symbol: "USDC", balance: "0", contractAddress: network.usdcAddress });
    }
  }

  return tokens;
}
