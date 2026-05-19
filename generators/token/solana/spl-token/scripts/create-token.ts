/**
 * {{contractName}} — create SPL token mint and fund initial supply
 */
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import fs from "node:fs";
import { scriptLog } from "./logger.js";

const DECIMALS = 9;
const INITIAL_SUPPLY = 1_000_000n * 10n ** BigInt(DECIMALS);

async function main() {
  const rpc = process.env.SOLANA_RPC_URL ?? clusterApiUrl("devnet");
  const connection = new Connection(rpc, "confirmed");

  const keypairPath = process.env.ANCHOR_WALLET ?? `${process.env.HOME}/.config/solana/id.json`;
  const secret = JSON.parse(fs.readFileSync(keypairPath, "utf8")) as number[];
  const payer = Keypair.fromSecretKey(Uint8Array.from(secret));

  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    payer.publicKey,
    DECIMALS,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID,
  );

  const ata = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
  await mintTo(connection, payer, mint, ata.address, payer, INITIAL_SUPPLY);

  scriptLog.info("Mint:", mint.toBase58());
  scriptLog.info("Token account:", ata.address.toBase58());
}

main().catch((err: unknown) => {
  scriptLog.error(err instanceof Error ? err : String(err));
  process.exitCode = 1;
});
