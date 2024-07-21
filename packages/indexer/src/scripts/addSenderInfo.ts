import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Keypair, Keypair as SolKeypair } from '@solana/web3.js';
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
    eth: ethAddr,
    sui: suiAddr,
    solana: solAddr,
    mnemonic: mnemonic,
  });

  console.log({ ethAddr, suiAddr, solAddr, result });
};

const putRandomSenderPairWithPrivateKey = async (
  redisClient: RedisClient,
  privateKey: string,
): Promise<void> => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  const ethAddr = new ethers.Wallet(privateKey).address;
  const suiAddr = Ed25519Keypair.generate().getSecretKey();
  const solAddr = Keypair.generate().secretKey;
  const solHex = `0x${solAddr.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')}`;

  const result = await redisClient.hSet(`eth:${ethAddr}`, {
    eth: privateKey,
    sui: suiAddr,
    sol: solHex,
  });

  console.log({ ethAddr, privateKey, suiAddr, solHex, result });
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
  await putRandomSenderPairWithPrivateKey(
    redisClient,
    '6fd6fd72124f84a73dc8cb332483bfac3f1964020907370539d07f3e990c9ab8',
  );
  await redisClient.disconnect();
};

main();
