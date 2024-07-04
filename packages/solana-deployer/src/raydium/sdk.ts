import { Raydium, TxVersion } from '@raydium-io/raydium-sdk-v2';
import { Keypair } from '@solana/web3.js';

import { connection } from '../constants';

export const txVersion = TxVersion.V0;

type InitRaydiumSDKParams = {
  keypair: Keypair;
  loadToken?: boolean;
};

// https://github.com/raydium-io/raydium-sdk-V2-demo/blob/master/src/config.ts.template
export const initSDK = async ({ keypair, loadToken }: InitRaydiumSDKParams) => {
  const raydium = await Raydium.load({
    owner: keypair,
    connection,
    cluster: 'devnet', // 'mainnet' | 'devnet'
    disableFeatureCheck: true,
    disableLoadToken: !loadToken,
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
