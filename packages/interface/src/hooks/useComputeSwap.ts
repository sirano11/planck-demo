import {
  AmmV4Keys,
  AmmV5Keys,
  ComputeAmountOutParam,
  Raydium,
} from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js';
import Decimal from 'decimal.js';
import { useEffect, useState } from 'react';
import { parseUnits } from 'viem';

import { POOL_IDS, Token } from '@/constants';

// global variable
let debounce_: NodeJS.Timeout;

export type ComputeSwapResult = {
  poolInfo: ComputeAmountOutParam['poolInfo'];
  poolKeys: AmmV4Keys | AmmV5Keys;

  amountIn: BN;
  amountOut: BN;
  minAmountOut: BN;
  currentPrice: Decimal;
  executionPrice: Decimal;
  priceImpact: Decimal;
  fee: BN;
};

const computeSwap = async (
  raydium: Raydium,
  inputToken: Token,
  amountInDraft: string,
): Promise<ComputeSwapResult | undefined> => {
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
    return;
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

  return {
    ...out,
    poolInfo,
    poolKeys,
    amountIn: new BN(amountIn),
  };
};

export const useComputeSwap = (
  raydium: Raydium | null,
  inputToken: Token,
  amountInDraft: string,
) => {
  const [computeSwapResult, setComputeSwapResult] = useState<
    ComputeSwapResult | undefined
  >(undefined);
  const [isComputing, setComputing] = useState<boolean>(false);

  useEffect(() => {
    if (!raydium) {
      return;
    }

    clearTimeout(debounce_);
    debounce_ = setTimeout(() => {
      setComputing(true);
      computeSwap(raydium, inputToken, amountInDraft)
        .then((res) => setComputeSwapResult(res))
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          setComputing(false);
        });
    }, 500);
  }, [raydium, amountInDraft, inputToken]);

  return { isComputing, computeSwapResult };
};
