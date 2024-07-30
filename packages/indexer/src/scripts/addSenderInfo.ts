import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import * as ethers from 'ethers';
import { SPL_TOKENS } from 'planck-demo-interface/src/constants/solanaConfigs';
import * as redis from 'redis';

import { Config, connection } from '@/config';
import { getKeypairFromMnemonic } from '@/utils/solanaUtils';

export type RedisClient = ReturnType<typeof redis.createClient>;

// Put the Mnemonics
const mnemonics: string[] = [
  'penalty frog guide equal virus grant airport boost inside way pond wisdom catalog poet question',
  'unable thought novel giraffe heavy grass hurt bunker multiply early lucky ride wide drive fade',
];

function getEthAddress(mnemonic: string): string {
  const wallet = ethers.Wallet.fromMnemonic(mnemonic);

  return wallet.address;
}

function getSuiAddress(mnemonic: string): string {
  const keyPair = Ed25519Keypair.deriveKeypair(mnemonic);

  return keyPair.toSuiAddress();
}

const putSenderPair = async (
  redisClient: RedisClient,
  mnemonic: string,
): Promise<void> => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  const ethAddr = getEthAddress(mnemonic);
  const suiAddr = getSuiAddress(mnemonic);
  const solActorKeypair = getKeypairFromMnemonic(mnemonic);
  const solAddr = solActorKeypair.publicKey.toBase58();

  const solMintKeypair = getKeypairFromMnemonic(Config.SOLANA_MINT_MNEMONIC);

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
): Promise<void> => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  for (const mnemonic of mnemonics) {
    await putSenderPair(redisClient, mnemonic);
  }
};

const main = async (): Promise<void> => {
  const redisClient = redis.createClient();
  await redisClient.connect();

  await putSenderPairs(redisClient, mnemonics);
  await redisClient.disconnect();
};

main();
