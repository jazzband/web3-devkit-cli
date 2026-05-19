import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import type { SolanaNetworkConfig } from "./networks.js";
import { getSolanaRpcUrl } from "./networks.js";

export interface CreatedSolanaWallet {
  publicKey: string;
  secretKey: Uint8Array;
}

export function createSolanaWallet(): CreatedSolanaWallet {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: keypair.secretKey,
  };
}

export function createSolanaConnection(
  network: SolanaNetworkConfig,
  rpcUrl?: string,
): Connection {
  return new Connection(getSolanaRpcUrl(network, rpcUrl), "confirmed");
}

export async function getSolanaNativeBalance(
  connection: Connection,
  address: string,
): Promise<string> {
  const lamports = await connection.getBalance(new PublicKey(address));
  return (lamports / LAMPORTS_PER_SOL).toFixed(9).replace(/\.?0+$/, "") || "0";
}

export interface SolanaTokenBalance {
  symbol: string;
  balance: string;
  mint?: string;
}

export async function getSolanaTokenBalances(
  connection: Connection,
  address: string,
  network: SolanaNetworkConfig,
): Promise<SolanaTokenBalance[]> {
  const tokens: SolanaTokenBalance[] = [];
  const owner = new PublicKey(address);

  if (network.usdcMint) {
    try {
      const mint = new PublicKey(network.usdcMint);
      const ata = await getAssociatedTokenAddress(mint, owner);
      const account = await getAccount(connection, ata);
      const balance = (Number(account.amount) / 1e6).toFixed(2);
      tokens.push({ symbol: "USDC", balance, mint: network.usdcMint });
    } catch {
      tokens.push({ symbol: "USDC", balance: "0.00", mint: network.usdcMint });
    }
  }

  return tokens;
}
