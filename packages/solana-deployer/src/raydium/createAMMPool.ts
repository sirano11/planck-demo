import { KeypairSigner } from '@metaplex-foundation/umi';
import {
  DEVNET_PROGRAM_ID,
  Raydium,
  WSOLMint,
} from '@raydium-io/raydium-sdk-v2';
import { Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js';
import BN from 'bn.js';

import { PROGRAMS } from '../constants';
import { MarketInfo } from './createMarket';
import { txVersion } from './sdk';

export type AMMPoolInfo = {
  programId: string;
  ammId: string;
  ammAuthority: string;
  ammOpenOrders: string;
  lpMint: string;
  coinMint: string;
  pcMint: string;
  coinVault: string;
  pcVault: string;
  withdrawQueue: string;
  ammTargetOrders: string;
  poolTempLp: string;
  marketProgramId: string;
  marketId: string;
  ammConfigId: string;
  feeDestinationId: string;
};

export type CreateAMMPoolParams = {
  raydium: Raydium;
  marketInfo: MarketInfo;
  mintSigner: KeypairSigner;
};

export type CreateAMMPoolResult = {
  txId: string;
  signedTx: VersionedTransaction;
  ammPoolInfo: AMMPoolInfo;
};

export const createAMMPool = async ({
  raydium,
  marketInfo,
  mintSigner,
}: CreateAMMPoolParams): Promise<CreateAMMPoolResult> => {
  const { execute, extInfo } = await raydium.liquidity.createPoolV4({
    programId: DEVNET_PROGRAM_ID.AmmV4,
    marketInfo: {
      marketId: new PublicKey(marketInfo.marketId),
      // programId: OPEN_BOOK_PROGRAM,
      programId: DEVNET_PROGRAM_ID.OPENBOOK_MARKET, // devnet
    },
    baseMintInfo: {
      mint: PROGRAMS.wSOL,
      decimals: 9,
    },
    quoteMintInfo: {
      mint: PROGRAMS.wMEME,
      decimals: 9,
    },
    baseAmount: new BN(1 * 10 ** 9),
    quoteAmount: new BN(1 * 10 ** 9),

    // sol devnet faucet: https://faucet.solana.com/
    // baseAmount: new BN(4 * 10 ** 9), // if devent pool with sol/wsol, better use amount >= 4*10**9
    // quoteAmount: new BN(4 * 10 ** 9), // if devent pool with sol/wsol, better use amount >= 4*10**9

    startTime: new BN(0), // unit in seconds
    ownerInfo: {
      useSOLBalance: true,
    },
    associatedOnly: false,
    txVersion,
    // feeDestinationId: FEE_DESTINATION_ID,
    feeDestinationId: DEVNET_PROGRAM_ID.FEE_DESTINATION_ID, // devnet
    // optional: set up priority fee here
    // computeBudgetConfig: {
    //   units: 600000,
    //   microLamports: 10000000,
    // },
  });

  const ammPoolInfo = Object.keys(extInfo.address).reduce(
    (acc, cur) => ({
      ...acc,
      [cur]: extInfo.address[cur as keyof typeof extInfo.address].toBase58(),
    }),
    {},
  ) as AMMPoolInfo;

  const { txId, signedTx } = await execute();

  return {
    txId,
    signedTx,
    ammPoolInfo,
  };
};
