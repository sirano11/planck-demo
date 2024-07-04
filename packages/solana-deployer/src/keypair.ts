import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';

export const getSolanaKeypair = (mnemonic: string) => {
  // Convert mnemonic to seed
  const seed = bip39.mnemonicToSeedSync(mnemonic, 'mint');

  const derivationPath = "m/44'/501'/0'/0'";
  const { key } = derivePath(derivationPath, seed.toString('hex'));

  return Keypair.fromSeed(key);
};
