import { Raydium, TxVersion } from '@raydium-io/raydium-sdk-v2';
import { Connection, Keypair } from '@solana/web3.js';

export const owner: Keypair = Keypair.fromSecretKey(
  Uint8Array.from(
    // FIXME: Inject PK from other safer sources like .env
    '164,106,67,123,209,159,38,87,225,69,45,70,174,249,223,214,17,115,81,217,123,28,199,252,54,201,103,39,240,113,60,133,70,45,193,156,162,221,175,86,113,103,125,141,127,90,122,129,140,98,174,167,55,163,200,168,230,196,247,17,51,20,95,113'
      .split(',')
      .map((v) => parseInt(v, 10)),
  ),
);
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
