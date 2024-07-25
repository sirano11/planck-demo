import { KeypairSigner } from '@metaplex-foundation/umi';
import {
  DEVNET_PROGRAM_ID,
  Raydium,
  WSOLMint,
} from '@raydium-io/raydium-sdk-v2';
import { Keypair, VersionedTransaction } from '@solana/web3.js';
import { SPL_TOKENS } from 'planck-demo-interface/src/constants/solanaConfigs';

import { TOKENS } from '../constants';
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
      mint: SPL_TOKENS.wSOL,
      decimals: TOKENS.find((t) => t.symbol == 'wSOL')?.decimals!,
    },
    quoteInfo: {
      mint: SPL_TOKENS.wMEME,
      decimals: TOKENS.find((t) => t.symbol == 'wMEME')?.decimals!,
    },
    lotSize: 1,
    tickSize: 0.01,
    // dexProgramId: OPEN_BOOK_PROGRAM,
    dexProgramId: DEVNET_PROGRAM_ID.OPENBOOK_MARKET, // devnet
    txVersion,
    // optional: set up priority fee here
    computeBudgetConfig: {
      units: 600_000,
      microLamports: 1_000_000, // 100_000_000?
    },
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
