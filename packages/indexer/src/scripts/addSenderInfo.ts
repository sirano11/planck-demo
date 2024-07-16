import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Keypair as SolKeypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import * as ethers from 'ethers';
import { HDKey } from 'micro-ed25519-hdkey';
import * as redis from 'redis';

export type RedisClient = ReturnType<typeof redis.createClient>;

// Put the Mnemonics
const mnemonics: string[] = [
  'penalty frog guide equal virus grant airport boost inside way pond wisdom catalog poet question',
  'unable thought novel giraffe heavy grass hurt bunker multiply early lucky ride wide drive fade',
];

function getEthAddress(mnemonic: string): string {
  const walletMnemonic = ethers.Wallet.fromMnemonic(mnemonic);

  return walletMnemonic.address;
}

function getSuiAddress(mnemonic: string): string {
  const keyPair = Ed25519Keypair.deriveKeypair(mnemonic);

  return keyPair.toSuiAddress();
}

function getSolanaAddress(mnemonic: string): string {
  const seed = bip39.mnemonicToSeedSync(mnemonic, '');
  const hd = HDKey.fromMasterSeed(seed.toString('hex'));
  const path = `m/44'/501'/0'/0'`;
  const keypair = SolKeypair.fromSeed(hd.derive(path).privateKey);

  return keypair.publicKey.toBase58();
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
  const solAddr = getSolanaAddress(mnemonic);

  const result = await redisClient.hSet(`eth:${ethAddr}`, {
    sui: suiAddr,
    solana: solAddr,
    eth: ethAddr,
    mnemonic: mnemonic,
  });
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
