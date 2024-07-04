import { KeypairSigner } from '@metaplex-foundation/umi';
import {
  DEVNET_PROGRAM_ID,
  Raydium,
  WSOLMint,
} from '@raydium-io/raydium-sdk-v2';
import { Keypair, VersionedTransaction } from '@solana/web3.js';

import { txVersion } from './sdk';

export type MarketInfo = {
  marketId: string;
  requestQueue: string;
  eventQueue: string;
  bids: string;
  asks: string;
  baseVault: string;
  quoteVault: string;
  baseMint: string;
  quoteMin: string;
};

export type CreateMarketParams = {
  raydium: Raydium;
  mintSigner: KeypairSigner;
};

export type CreateMarketResult = {
  txIds: string[];
  signedTxs: VersionedTransaction[];
  marketInfo: MarketInfo;
};

export const createMarket = async ({
  raydium,
  mintSigner,
}: CreateMarketParams): Promise<CreateMarketResult> => {
  const { execute, extInfo, transactions } = await raydium.marketV2.create({
    baseInfo: {
      mint: Keypair.fromSecretKey(mintSigner.secretKey).publicKey,
      decimals: 9,
    },
    quoteInfo: {
      mint: WSOLMint,
      decimals: 9,
    },
    lotSize: 1,
    tickSize: 0.01,
    // dexProgramId: OPEN_BOOK_PROGRAM,
    dexProgramId: DEVNET_PROGRAM_ID.OPENBOOK_MARKET, // devnet
    txVersion,
    // optional: set up priority fee here
    // computeBudgetConfig: {
    //   units: 600000,
    //   microLamports: 100000000,
    // },
  });

  const marketInfo = Object.keys(extInfo.address).reduce(
    (acc, cur) => ({
      ...acc,
      [cur]: extInfo.address[cur as keyof typeof extInfo.address].toBase58(),
    }),
    {},
  ) as MarketInfo;

  const { txIds, signedTxs } = await execute({
    // set sequentially to true means tx will be sent when previous one confirmed
    sequentially: true,
  });

  return {
    txIds,
    signedTxs,
    marketInfo,
  };
};
