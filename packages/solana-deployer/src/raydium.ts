import { Raydium, TxVersion } from '@raydium-io/raydium-sdk-v2';
import { Connection, Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import dotenv from 'dotenv';
import { derivePath } from 'ed25519-hd-key';

dotenv.config();

// Use an existing mnemonic
const mnemonic = process.env.MNEMONIC || '';

// Convert mnemonic to seed
const seed = bip39.mnemonicToSeedSync(mnemonic, 'mint');

// Derive the EdDSA private key
const derivationPath = "m/44'/501'/0'/0'";
const { key } = derivePath(derivationPath, seed.toString('hex'));

const keypair = Keypair.fromSeed(key);
export const owner: Keypair = Keypair.fromSecretKey(keypair.secretKey);

export const connection = new Connection('https://api.devnet.solana.com', {
  commitment: 'confirmed',
});
export const txVersion = TxVersion.V0;

// https://github.com/raydium-io/raydium-sdk-V2-demo/blob/master/src/config.ts.template
export const initSdk = async (params?: { loadToken?: boolean }) => {
  const raydium = await Raydium.load({
    owner,
    connection,
    cluster: 'devnet', // 'mainnet' | 'devnet'
    disableFeatureCheck: true,
    disableLoadToken: !params?.loadToken,
    blockhashCommitment: 'finalized',
    // urlConfigs: {
    //   BASE_HOST: '<API_HOST>', // api url configs, currently api doesn't support devnet
    // },
  });

  /**
   * By default: sdk will automatically fetch token account data when need it or any sol balace changed.
   * if you want to handle token account by yourself, set token account data after init sdk
   * code below shows how to do it.
   * note: after call raydium.account.updateTokenAccount, raydium will not automatically fetch token account
   */

  /*
  raydium.account.updateTokenAccount(await fetchTokenAccountData())
  connection.onAccountChange(owner.publicKey, async () => {
    raydium!.account.updateTokenAccount(await fetchTokenAccountData())
  })
  */

  return raydium;
};
