import {
  AMM_STABLE,
  AMM_V4,
  AmmRpcData,
  AmmV4Keys,
  ApiV3PoolInfoStandardItem,
  DEVNET_PROGRAM_ID,
} from '@raydium-io/raydium-sdk-v2';
import { NATIVE_MINT } from '@solana/spl-token';
import * as bip39 from 'bip39';
import BN from 'bn.js';
import Decimal from 'decimal.js';
import dotenv from 'dotenv';

import { POOL_IDS, PROGRAMS } from './constants';
import { getSolanaKeypair } from './keypair';
import { RaydiumSDK } from './raydium';

dotenv.config();

// Generate a new mnemonic (or use an existing one)
let mnemonic = process.env.MNEMONIC || '';
if (!mnemonic) {
  console.log(`[!] No mnemonic found. Generating a new one.`);
  mnemonic = bip39.generateMnemonic();
  console.log({ mnemonic });
}
console.log(`SECRET!: ${mnemonic}`);

const keypair = getSolanaKeypair(mnemonic);

const VALID_PROGRAM_ID = new Set([
  AMM_V4.toBase58(),
  AMM_STABLE.toBase58(),
  DEVNET_PROGRAM_ID.AmmV4.toBase58(),
  DEVNET_PROGRAM_ID.AmmStable.toBase58(),
]);

export const isValidAmm = (id: string) => VALID_PROGRAM_ID.has(id);

export const swap = async (amountIn: number) => {
  const raydium = await RaydiumSDK.init({ keypair });
  // const inputMint = NATIVE_MINT.toBase58();
  const inputMint = PROGRAMS.wSOL.toBase58();
  // const poolId = process.env.SOL_WSOL_POOL_ID || ''; // SOL/WSOL ammId
  const poolId = POOL_IDS.wSOL_wMEME_POOL_ID;

  let poolInfo: ApiV3PoolInfoStandardItem | undefined;
  let poolKeys: AmmV4Keys | undefined;
  let rpcData: AmmRpcData;

  if (raydium.cluster === 'mainnet') {
    // note: api doesn't support get devnet pool info, so in devnet else we go rpc method
    // if you wish to get pool info from rpc, also can modify logic to go rpc method directly
    const data = await raydium.api.fetchPoolById({ ids: poolId });
    poolInfo = data[0] as ApiV3PoolInfoStandardItem;
    if (!isValidAmm(poolInfo.programId))
      throw new Error('target pool is not AMM pool');
    poolKeys = await raydium.liquidity.getAmmPoolKeys(poolId);
    rpcData = await raydium.liquidity.getRpcPoolInfo(poolId);
  } else {
    // note: getPoolInfoFromRpc method only return required pool data for computing not all detail pool info
    const data = await raydium.liquidity.getPoolInfoFromRpc({ poolId });

    poolInfo = data.poolInfo;
    poolKeys = data.poolKeys;
    rpcData = data.poolRpcData;
  }
  const [baseReserve, quoteReserve, status] = [
    rpcData.baseReserve,
    rpcData.quoteReserve,
    rpcData.status.toNumber(),
  ];

  if (
    poolInfo.mintA.address !== inputMint &&
    poolInfo.mintB.address !== inputMint
  )
    throw new Error('input mint does not match pool');

  const baseIn = inputMint === poolInfo.mintA.address;
  const [mintIn, mintOut] = baseIn
    ? [poolInfo.mintA, poolInfo.mintB]
    : [poolInfo.mintB, poolInfo.mintA];

  const out = raydium.liquidity.computeAmountOut({
    poolInfo: {
      ...poolInfo,
      baseReserve,
      quoteReserve,
      status,
      version: 4,
    },
    amountIn: new BN(amountIn),
    mintIn: mintIn.address,
    mintOut: mintOut.address,
    slippage: 0.01, // range: 1 ~ 0.0001, means 100% ~ 0.01%
  });

  const amountInStr = new Decimal(amountIn)
    .div(10 ** mintIn.decimals)
    .toDecimalPlaces(mintIn.decimals)
    .toString();
  const mintInStr = mintIn.symbol || mintIn.address;
  const amountOutStr = new Decimal(out.amountOut.toString())
    .div(10 ** mintOut.decimals)
    .toDecimalPlaces(mintOut.decimals)
    .toString();
  const mintOutStr = mintOut.symbol || mintOut.address;
  const minAmountOutStr = new Decimal(out.minAmountOut.toString())
    .div(10 ** mintOut.decimals)
    .toDecimalPlaces(mintOut.decimals);

  console.log(
    `computed swap ${amountInStr} ${mintInStr} to ${amountOutStr} ${mintOutStr}, minimum amount out ${minAmountOutStr} ${mintOutStr}`,
  );

  return raydium.liquidity.swap({
    poolInfo,
    poolKeys,
    amountIn: new BN(amountIn),
    amountOut: out.minAmountOut, // out.amountOut means amount 'without' slippage
    inputMint: mintIn.address,
    fixedSide: 'in',
    txVersion: RaydiumSDK.txVersion,

    // optional: set up token account
    // config: {
    //   inputUseSolBalance: true, // default: true, if you want to use existed wsol token account to pay token in, pass false
    //   outputUseSolBalance: true, // default: true, if you want to use existed wsol token account to receive token out, pass false
    //   associatedOnly: true, // default: true, if you want to use ata only, pass true
    // },

    // optional: set up priority fee here
    // computeBudgetConfig: {
    //   units: 600000,
    //   microLamports: 100000000,
    // },
  });
};

swap(10) // here is printSimulate
  .then(async (data) => {
    console.log('✨ Swap Ready');
    console.log('data:');
    console.log(data);

    /** uncomment code below to execute */
    // don't want to wait confirm, set sendAndConfirm to false or don't pass any params to execute
    const res = await data.execute({ sendAndConfirm: true });
    console.log(`res:`);
    console.log(res);

    // const { txId } = await execute({ sendAndConfirm: true });
    // console.log(`swap successfully in amm pool:`, { txId });

    process.exit(0);
  })
  .catch(console.error);

// const { execute } = await swap(500);
