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

import { POOL_IDS } from '@/constants';

type ComputeSwapOutput = {
  inputAmount: BN;
  outputAmount: BN;
  minimumAmount: BN;
  inputMint: string;
  poolInfo: ComputeAmountOutParam['poolInfo'];
  poolKeys: AmmV4Keys | AmmV5Keys;
};

export const useComputeSwap = (
  raydium: Raydium,
  inputMint: any,
  amountInDraft: string,
) => {
  const [response, setResponse] = useState<ComputeSwapOutput | null>(null);
  const [count, setCount] = useState<number>(0);
  let flag = 0;
  useEffect(() => {
    if (!raydium) {
      return;
    }
    if (count > 3) {
      if (flag === 0) {
        flag = 1;
        setTimeout(async () => {
          setCount(0);
          flag = 0;
          console.log('Too much request');
        }, 2000);
      }
    } else {
      setCount(count + 1);

      (async () => {
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

        // TODO: Replace hardcoded decimals
        const amountIn = new BN(
          parseUnits(parsedInput.toString(), 9).toString(),
        );

        const [baseReserve, quoteReserve, status] = [
          rpcData.baseReserve!,
          rpcData.quoteReserve!,
          rpcData.status.toNumber()!,
        ];

        if (
          poolInfo.mintA.address !== inputMint &&
          poolInfo.mintB.address !== inputMint
        )
          throw new Error('input mint does not match pool');

        const isInputMintA = inputMint === poolInfo?.mintA.address;
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
      })().catch((err) => {
        console.error(err);
      });
    }
  }, [amountInDraft, inputMint]);

  return response;
};
