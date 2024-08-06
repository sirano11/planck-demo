import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
} from '@solana/web3.js';
import * as ethers from 'ethers';
import { SPL_TOKENS } from 'planck-demo-interface/src/constants/solanaConfigs';
import { encodeRawTx } from 'planck-demo-interface/src/helper/eth/hub-builder';
import * as redis from 'redis';

import { Config, connection } from '@/config';
import { getKeypairFromMnemonic } from '@/utils/solanaUtils';

export type RedisClient = ReturnType<typeof redis.createClient>;

// Put the Mnemonics
const mnemonics: string[] = [
  'penalty frog guide equal virus grant airport boost inside way pond wisdom catalog poet question',
  'unable thought novel giraffe heavy grass hurt bunker multiply early lucky ride wide drive fade',
  'modify machine soap muffin arch tower dragon glide east polar dumb scrub stable check ramp',
];

function getEthAddress(mnemonic: string): string {
  const wallet = ethers.Wallet.fromMnemonic(mnemonic);

  // when importing to MetaMask
  console.log({ wallet_privateKey: wallet.privateKey });

  return wallet.address;
}

function getSuiAddress(mnemonic: string): string {
  const keyPair = Ed25519Keypair.deriveKeypair(mnemonic);

  return keyPair.toSuiAddress();
}

const requestSolAirdrop = async (pubkey: PublicKey): Promise<void> => {
  try {
    const airdropSignature = await connection.requestAirdrop(
      pubkey,
      5e9, // 5 SOL
    );

    const latestBlockHash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: airdropSignature,
    });
  } catch (e) {
    console.error('Error in requestSolAirdrop:', e);
    throw e; // Rethrow the error to be handled by the caller
  }
};

const putSenderPair = async (
  redisClient: RedisClient,
  mnemonic: string,
  solMintKeypair: Keypair,
): Promise<void> => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  const ethAddr = getEthAddress(mnemonic);
  const suiAddr = getSuiAddress(mnemonic);
  const solActorKeypair = getKeypairFromMnemonic(mnemonic);
  const solPubKey = solActorKeypair.publicKey;
  const solAddr = solPubKey.toBase58();

  const solanaBalance = await connection.getBalance(solPubKey);
  console.log(`${solAddr}: ${solanaBalance / LAMPORTS_PER_SOL} SOL`);

  // Create a sample transaction instruction
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: solMintKeypair.publicKey,
    toPubkey: solPubKey,
    lamports: 1000, // Amount to transfer in lamports
  });

  // Get the recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();

  // Create a MessageV0 using the TransactionMessage class
  const messageV0 = new TransactionMessage({
    payerKey: solMintKeypair.publicKey,
    recentBlockhash: blockhash,
    instructions: [transferInstruction],
  }).compileToV0Message();

  // Estimate the fee for the transaction
  const feeResponse = await connection.getFeeForMessage(messageV0);

  if (feeResponse === null || feeResponse.value === null) {
    throw new Error('Failed to estimate transaction fee');
  }

  // Fee (SOL) typically 5000 (◎0.000005)
  console.log(`Estimated transaction fee: ${feeResponse.value} lamports`);

  const bufferPercentage = 0.2; // 20% buffer
  const threshold = feeResponse.value * (1 + bufferPercentage);

  console.log(`Threshold with buffer: ${threshold} lamports`);

  try {
    if (solanaBalance < threshold) {
      await requestSolAirdrop(solPubKey);
    }
  } catch (e) {
    console.log(`Failed to request airdrop`);
    console.log(e);
  }

  // create token account for all tokens (wSOL, wMEME)
  for (const token in SPL_TOKENS) {
    await getOrCreateAssociatedTokenAccount(
      connection,
      solMintKeypair,
      SPL_TOKENS[token],
      solActorKeypair.publicKey,
    );
  }

  const result = await redisClient.hSet(`eth:${ethAddr}`, {
    eth: ethAddr,
    sui: suiAddr,
    sol: solAddr,
    mnemonic: mnemonic,
  });

  console.log({ ethAddr, suiAddr, solAddr, result });
};

const putSenderPairs = async (
  redisClient: RedisClient,
  mnemonics: string[],
  solMintKeypair: Keypair,
): Promise<void> => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  for (const mnemonic of mnemonics) {
    await putSenderPair(redisClient, mnemonic, solMintKeypair);
  }
};

const main = async (): Promise<void> => {
  const redisClient = redis.createClient();
  await redisClient.connect();

  // To generate user token account, we need mint owner keypair
  const solMintKeypair = getKeypairFromMnemonic(Config.SOLANA_MINT_MNEMONIC);
  const solMintAddr = solMintKeypair.publicKey.toBase58();
  const adminBalance = await connection.getBalance(solMintKeypair.publicKey);
  console.log({
    solMintKeypair_publicKey: solMintAddr,
  });
  console.log({
    solMintKeypair_secretKey: encodeRawTx(solMintKeypair.secretKey),
  });
  console.log(`${solMintAddr}: ${adminBalance / LAMPORTS_PER_SOL} SOL`);

  await putSenderPairs(redisClient, mnemonics, solMintKeypair);
  await redisClient.disconnect();
};

main();
