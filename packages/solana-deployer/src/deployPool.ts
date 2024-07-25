import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import {
  createSignerFromKeypair,
  signerIdentity,
} from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import dotenv from 'dotenv';

import { getSolanaKeypair } from './keypair';
import { RaydiumSDK } from './raydium';

dotenv.config();

const deploy = async () => {
  const umi = createUmi('https://api.devnet.solana.com', 'confirmed').use(
    mplTokenMetadata(),
  );

  // Generate a new mnemonic (or use an existing one)
  let mnemonic = process.env.MNEMONIC || '';

  const keypair = getSolanaKeypair(mnemonic);

  const publisherKeypair = umi.eddsa.createKeypairFromSecretKey(
    keypair.secretKey,
  );

  // TODO: we may also need to run faucet -> add balance check?
  // https://faucet.solana.com

  const publisherSigner = createSignerFromKeypair(umi, publisherKeypair);
  console.log(publisherSigner.publicKey.toString());
  console.log(publisherSigner.secretKey.toString());

  umi.use(signerIdentity(publisherSigner));

  // check balance of publisher
  const balance = await umi.rpc.getBalance(publisherSigner.publicKey);
  console.log(`balance: ${balance.basisPoints.toString()}`);

  const raydium = await RaydiumSDK.init({ keypair });

  const { marketInfo, ...createMarketTxInfo } = await RaydiumSDK.createMarket({
    raydium,
    mintSigner: publisherSigner,
  });
  console.log('createMarket', { ...createMarketTxInfo, marketInfo });

  const { ammPoolInfo, ...createAMMPoolTxInfo } =
    await RaydiumSDK.createAMMPool({
      raydium,
      marketInfo,
      mintSigner: publisherSigner,
    });
  console.log('createAMMPool', { ...createAMMPoolTxInfo, ammPoolInfo });
};

deploy()
  .then(() => {
    console.log('✨ Done');
    process.exit(0);
  })
  .catch(console.error);
