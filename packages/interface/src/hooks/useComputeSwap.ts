import { Raydium } from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js';
import Decimal from 'decimal.js';
import { useEffect, useState } from 'react';

import { POOL_IDS } from '@/constants';

type Response = {
  inputAmount: BN;
  outputAmount: BN;
  minimumAmount: BN;
  poolInfo: any;
  poolKeys: any;
  inputMint: any;
  amountIn: any;
  amountOut: any;
};

export const useComputeSwap = (
  raydium: Raydium,
  inputMint: any,
  amountIn: any,
) => {
  const [response, setResponse] = useState<Response | null>(null);
  const [count, setCount] = useState<number>(0);
  let flag = 0;
  useEffect(() => {
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
      raydium?.liquidity
        .getPoolInfoFromRpc({
          poolId: POOL_IDS.wSOL_wMEME_POOL_ID,
        })
        .then((data) => {
          const poolInfo = data?.poolInfo;
          const poolKeys = data?.poolKeys;
          const rpcData = data?.poolRpcData;

          const [baseReserve, quoteReserve, status] = [
            rpcData?.baseReserve!,
            rpcData?.quoteReserve!,
            rpcData?.status.toNumber()!,
          ];

          if (
            poolInfo?.mintA.address !== inputMint &&
            poolInfo?.mintB.address !== inputMint
          )
            throw new Error('input mint does not match pool');

          const baseIn = inputMint === poolInfo?.mintA.address;
          const [mintIn, mintOut] = baseIn
            ? [poolInfo?.mintA, poolInfo?.mintB]
            : [poolInfo?.mintB, poolInfo?.mintA];

          const out = raydium?.liquidity.computeAmountOut({
            poolInfo: {
              ...poolInfo!,
              baseReserve,
              quoteReserve,
              status,
              version: 4,
            },
            amountIn: new BN(amountIn),
            mintIn: mintIn?.address!,
            mintOut: mintOut?.address!,
            slippage: 0.01, // range: 1 ~ 0.0001, means 100% ~ 0.01%
          });

          const amountInStr = amountIn
            ? new Decimal(amountIn)
                .div(10 ** mintIn?.decimals!)
                .toDecimalPlaces(mintIn?.decimals)
                .toString()
            : '0';
          const mintInStr = mintIn?.symbol || mintIn?.address;
          const amountOutStr = new Decimal(out?.amountOut.toString()!)
            .div(10 ** mintOut?.decimals!)
            .toDecimalPlaces(mintOut?.decimals)
            .toString();
          const mintOutStr = mintOut?.symbol || mintOut?.address;
          const minAmountOutStr = new Decimal(out?.minAmountOut.toString()!)
            .div(10 ** mintOut?.decimals!)
            .toDecimalPlaces(mintOut?.decimals);

          const res: Response = {
            inputAmount: amountIn,
            outputAmount: out?.amountOut!,
            minimumAmount: out?.minAmountOut!,
            poolInfo,
            poolKeys,
            inputMint: mintIn.address,
            amountIn: new BN(amountIn),
            amountOut: out.amountOut,
          };

          setResponse(res);

          console.log(
            `computed swap ${amountInStr} ${mintInStr} to ${amountOutStr} ${mintOutStr}, minimum amount out ${minAmountOutStr} ${mintOutStr}`,
          );
        });
    }
  }, [amountIn]);

  return response;
};
