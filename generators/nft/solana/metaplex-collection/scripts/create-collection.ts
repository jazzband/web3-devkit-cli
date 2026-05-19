/**
 * {{contractName}} — Metaplex collection setup skeleton
 * Extend with Umi / mpl-core or token-metadata SDK for your Metaplex version.
 */
import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import { scriptLog } from "./logger.js";

async function main() {
  const rpc = process.env.SOLANA_RPC_URL ?? clusterApiUrl("devnet");
  const connection = new Connection(rpc, "confirmed");
  const payer = Keypair.generate(); // replace with wallet loader

  scriptLog.info("{{contractName}} collection setup");
  scriptLog.info("RPC:", connection.rpcEndpoint);
  scriptLog.info("Payer (demo):", payer.publicKey.toBase58());
  scriptLog.info("Implement collection + candy machine using @metaplex-foundation/* packages.");
}

main().catch((err: unknown) => {
  scriptLog.error(err instanceof Error ? err : String(err));
  process.exitCode = 1;
});
