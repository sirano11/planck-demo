import {
  AmmV4Keys,
  AmmV5Keys,
  ComputeAmountOutParam,
  Raydium,
} from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js';
import Decimal from 'decimal.js';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { parseUnits } from 'viem';

import { POOL_IDS, Token } from '@/constants';

// global variable
let debounce_: NodeJS.Timeout;

type ComputeSwapOutput = {
  inputAmount: BN;
  outputAmount: BN;
  minimumAmount: BN;
  inputMint: string;
  poolInfo: ComputeAmountOutParam['poolInfo'];
  poolKeys: AmmV4Keys | AmmV5Keys;
};

const computeSwap = async (
  raydium: Raydium,
  inputToken: Token,
  amountInDraft: string,
  setResponse: Dispatch<SetStateAction<ComputeSwapOutput | null>>,
) => {
  const {
    poolInfo,
    poolKeys,
    poolRpcData: rpcData,
  } = await raydium.liquidity.getPoolInfoFromRpc({
    poolId: POOL_IDS.wSOL_wMEME_POOL_ID,
  });

  // parsedInput
  const parsedInput = parseFloat(amountInDraft);
  if (isNaN(parsedInput) || parsedInput <= 0) {
    return null;
  }

  const amountIn = new BN(
    parseUnits(
      parsedInput.toFixed(inputToken.decimals).toString(),
      inputToken.decimals,
    ).toString(),
  );

  const [baseReserve, quoteReserve, status] = [
    rpcData.baseReserve!,
    rpcData.quoteReserve!,
    rpcData.status.toNumber()!,
  ];

  if (
    poolInfo.mintA.address !== inputToken.mint &&
    poolInfo.mintB.address !== inputToken.mint
  )
    throw new Error('input mint does not match pool');

  const isInputMintA = inputToken.mint === poolInfo?.mintA.address;
  const [mintIn, mintOut] = isInputMintA
    ? [poolInfo.mintA, poolInfo.mintB]
    : [poolInfo.mintB, poolInfo.mintA];

  const out = raydium.liquidity.computeAmountOut({
    poolInfo: {
      ...poolInfo!,
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

  const mintInStr = mintIn.symbol || mintIn.address;
  const amountOutStr = new Decimal(out.amountOut.toString()!)
    .div(10 ** mintOut.decimals)
    .toDecimalPlaces(mintOut.decimals)
    .toString();
  const mintOutStr = mintOut.symbol || mintOut.address;
  const minAmountOutStr = new Decimal(out.minAmountOut.toString()!)
    .div(10 ** mintOut.decimals)
    .toDecimalPlaces(mintOut.decimals);

  const res: ComputeSwapOutput = {
    inputAmount: new BN(amountIn),
    outputAmount: out.amountOut,
    minimumAmount: out.minAmountOut,
    poolInfo,
    poolKeys,
    inputMint: mintIn.address,
  };
  setResponse(res);

  console.log(
    `computed swap ${amountInDraft} ${mintInStr} to ${amountOutStr} ${mintOutStr}, minimum amount out ${minAmountOutStr} ${mintOutStr}`,
  );
};

export const useComputeSwap = (
  raydium: Raydium,
  inputToken: Token,
  amountInDraft: string,
) => {
  const [response, setResponse] = useState<ComputeSwapOutput | null>(null);

  useEffect(() => {
    if (!raydium) {
      return;
    }

    clearTimeout(debounce_);
    debounce_ = setTimeout(async () => {
      await computeSwap(raydium, inputToken, amountInDraft, setResponse).catch(
        (err) => {
          console.error(err);
        },
      );
    }, 500);
  }, [amountInDraft, inputToken]);

  return response;
};
