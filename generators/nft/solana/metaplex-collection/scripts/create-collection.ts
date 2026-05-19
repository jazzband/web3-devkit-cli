/**
 * {{contractName}} — Metaplex collection setup skeleton
 * Extend with Umi / mpl-core or token-metadata SDK for your Metaplex version.
 */
import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";

async function main() {
  const rpc = process.env.SOLANA_RPC_URL ?? clusterApiUrl("devnet");
  const connection = new Connection(rpc, "confirmed");
  const payer = Keypair.generate(); // replace with wallet loader

  console.log("{{contractName}} collection setup");
  console.log("RPC:", connection.rpcEndpoint);
  console.log("Payer (demo):", payer.publicKey.toBase58());
  console.log("Implement collection + candy machine using @metaplex-foundation/* packages.");
}

main().catch(console.error);
