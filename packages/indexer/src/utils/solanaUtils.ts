import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import { HDKey } from 'micro-ed25519-hdkey';

export const getKeypairFromMnemonic = (
  mnemonic: string,
  password: string = '',
): Keypair => {
  const seed = bip39.mnemonicToSeedSync(mnemonic, password);
  const hd = HDKey.fromMasterSeed(seed.toString('hex'));
  const path = `m/44'/501'/0'/0'`;
  return Keypair.fromSeed(hd.derive(path).privateKey);
};

export const fromHexString = (hexString: string) =>
  Uint8Array.from(
    hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  );
