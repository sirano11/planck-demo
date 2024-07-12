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

  // const { marketInfo, ...createMarketTxInfo } = await RaydiumSDK.createMarket({
  //   raydium,
  //   mintSigner: publisherSigner,
  // });
  // console.log('createMarket', { ...createMarketTxInfo, marketInfo });

  // Due to the Raydium SDK version issue, I make tx one by one each,
  // deployed market first, and deployed ammpool second using the previous market information.
  const marketInfo = {
    marketId: '6ZMBmRw5tdcgwS8YH3gwnsk1FdGZmXeJW3f1krcgXRdZ',
    requestQueue: '4amC3ZdjKXTs7WtbCbDN9mf4xaWV5Yi3wN9Y5vvB6MpJ',
    eventQueue: 'wadYH7CWbMicvnkZ1iHipg4RjLB9xVVDvavBa9zwnwQ',
    bids: '93vWkT4eD4rHdmKVYMcbGFbHV2Ced3b3f2vSqMaQBRBU',
    asks: 'FqtPe4wbVJyGXEpU3ZbhMoEnyBNZAHG3p67R7s5MBJnH',
    baseVault: 'ESYmLJof2GnLCpwJRw2H2BiCwvCsHsDnMi6z137WyS3A',
    quoteVault: '9Wu3hAB973TQgUh7HsddSg9zRdwCgfsmRfLYfnaSLLGv',
    baseMint: '5L9yR1bF4gdzZBfGxxLkidgUmjFa7CGBppKZPBYaPL3F',
    quoteMin: 'iAo1RFXsYotAEf3vVj4tmxAPGrX8QmZnbFxumqRZ7xb',
  };
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
