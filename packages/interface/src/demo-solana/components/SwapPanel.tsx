import {
  Box,
  Button,
  Collapse,
  Flex,
  SimpleGrid,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { TxVersion } from '@raydium-io/raydium-sdk-v2';
import { waitForTransactionReceipt } from '@wagmi/core';
import BN from 'bn.js';
import { BridgeToken__factory } from 'planck-demo-contracts/typechain/factories/BridgeToken__factory';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useWriteContract } from 'wagmi';

import { useJobStatus } from '@/components/JobStatusContext';
import { Token } from '@/constants';
import { config } from '@/constants/wagmi';
import { ChainIdentifier, HUB_CONTRACT_ADDRESS } from '@/helper/eth/config';
import { commit } from '@/helper/eth/hub-builder';
import { useComputeSwap, useRaydium } from '@/hooks';
import { useTokenAllowances } from '@/hooks/useTokenAllowances';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import TokenInput from '@/raydium/components/TokenInput';
import { useHover } from '@/raydium/hooks';
import SwapButtonOneTurnIcon from '@/raydium/icons/misc/SwapButtonOneTurnIcon';
import SwapButtonTwoTurnIcon from '@/raydium/icons/misc/SwapButtonTwoTurnIcon';
import { colors } from '@/raydium/theme/cssVariables';

import { SwapInfoBoard } from './SwapInfoBoard';

// https://github.com/raydium-io/raydium-ui-v3/blob/master/src/utils/functionMethods.ts#L1
export const debounce = (func: (params?: any) => void, delay?: number) => {
  let timer: number | null = null;

  return (params?: any) => {
    timer && clearTimeout(timer);
    timer = window.setTimeout(() => {
      func(params);
    }, delay || 250);
  };
};

type SwapPanelProps = {
  tokenInput: Token;
  tokenOutput: Token;
  handleChangeSide: () => void;
};

export const SwapPanel: React.FC<SwapPanelProps> = ({
  tokenInput,
  tokenOutput,
  handleChangeSide,
}) => {
  const {
    isOpen: isSending,
    onOpen: onSending,
    onClose: offSending,
  } = useDisclosure();

  const { tokenBalances } = useTokenBalances();
  const { tokenAllowances, refresh: refreshAllowances } = useTokenAllowances();

  const [amountIn, setAmountIn] = useState<string>('');
  const swapDisabled = false;
  const [hasValidAmountOut, setHasValidAmountOut] = useState(false);

  const raydium = useRaydium();
  const { isComputing, computeSwapResult } = useComputeSwap(
    raydium!,
    tokenInput,
    amountIn,
  );
  const jobStatus = useJobStatus();

  const outputAmount = useMemo(
    () => (computeSwapResult && computeSwapResult.amountOut) || null,
    [computeSwapResult],
  );

  const debounceUpdate = useCallback(
    debounce(({ outputAmount, isComputing }) => {
      setHasValidAmountOut(Number(outputAmount) !== 0 || isComputing);
    }, 150),
    [],
  );

  useEffect(() => {
    debounceUpdate({ outputAmount, isComputing });
  }, [outputAmount, isComputing]);

  const hasEnoughAllowance = useMemo(() => {
    try {
      return (
        tokenAllowances[tokenInput.address] &&
        tokenAllowances[tokenInput.address] >=
          parseUnits(amountIn, tokenInput.decimals)
      );
    } catch (e) {
      return false;
    }
  }, [tokenAllowances, amountIn, tokenInput]);

  const { writeContractAsync } = useWriteContract();
  const handleClickApprove = useCallback(() => {
    if (hasEnoughAllowance) {
      return;
    }
    (async () => {
      const amount = parseUnits(amountIn, tokenInput.decimals);

      const hash = await writeContractAsync({
        address: tokenInput.address,
        abi: BridgeToken__factory.abi,
        functionName: 'approve',
        args: [HUB_CONTRACT_ADDRESS, amount],
      });

      const receipt = await waitForTransactionReceipt(config, { hash });

      // TODO: Toast Result
      console.log({ receipt });
    })()
      .catch((err) => {
        // TODO: Toast Failure
        console.error(err);
      })
      .finally(() => refreshAllowances());
  }, [
    hasEnoughAllowance,
    amountIn,
    tokenInput,
    writeContractAsync,
    refreshAllowances,
  ]);

  const handleClickSwap = useCallback(async () => {
    if (!computeSwapResult || !raydium) {
      return;
    }
    onSending();
    try {
      const commitData = await raydium.liquidity.swap({
        poolInfo: computeSwapResult.poolInfo,
        poolKeys: computeSwapResult.poolKeys,
        inputMint: tokenInput.mint!,
        amountIn: new BN(computeSwapResult.amountIn),
        amountOut: new BN(computeSwapResult.minAmountOut), // amountOut means amount 'without' slippage
        fixedSide: 'in',
        txVersion: TxVersion.V0,
      });
      console.log({ commitData });

      const rawTx = commitData.transaction.serialize();
      console.log({ rawTx });

      const hash = await commit(
        HUB_CONTRACT_ADDRESS,
        tokenInput.address,
        BigInt(computeSwapResult.amountIn.toString()),
        ChainIdentifier.Solana,
        rawTx,
      );

      jobStatus.dispatch({ type: 'SET_JOB_HASH', payload: hash });

      await waitForTransactionReceipt(config, { hash });
    } catch (e) {
      console.error(e);
    } finally {
      offSending();
    }
  }, [raydium, computeSwapResult, tokenInput, onSending, offSending]);

  return (
    <>
      <Flex mb={[4, 5]} direction="column">
        {/* input */}
        <TokenInput
          name="swap"
          topLeftLabel="From"
          token={tokenInput}
          tokenBalance={tokenBalances[tokenInput.address]}
          value={amountIn}
          readonly={swapDisabled}
          onChange={setAmountIn}
        />

        <SwapIcon onClick={handleChangeSide} />

        <TokenInput
          name="swap"
          topLeftLabel="To"
          token={tokenOutput}
          tokenBalance={tokenBalances[tokenOutput.address]}
          value={formatUnits(
            BigInt(outputAmount?.toString() || '0'),
            tokenOutput.decimals,
          )}
          readonly={swapDisabled}
          onChange={(value) => {
            // on max balance
            handleChangeSide();
            setAmountIn(value);
          }}
        />
      </Flex>
      {/* swap info */}
      <Collapse in={hasValidAmountOut} animateOpacity>
        <Box mb={[4, 5]}>
          <SwapInfoBoard
            tokenInput={tokenInput}
            tokenOutput={tokenOutput}
            isComputing={isComputing}
            computeSwapResult={computeSwapResult}
          />
        </Box>
      </Collapse>

      <Button
        onClick={!hasEnoughAllowance ? handleClickApprove : handleClickSwap}
      >
        <Text>
          {!hasEnoughAllowance ? `Approve ${tokenInput.symbol}` : 'Swap'}
        </Text>
      </Button>
    </>
  );
};

const SwapIcon: React.FC<{ onClick?: () => void }> = (props) => {
  const targetElement = useRef<HTMLDivElement | null>(null);
  const isHover = useHover(targetElement);
  return (
    <SimpleGrid
      ref={targetElement}
      bg={isHover ? colors.semanticFocus : undefined}
      width="42px"
      height="42px"
      placeContent="center"
      rounded="full"
      cursor="pointer"
      my={-3}
      mx="auto"
      zIndex={2}
      onClick={props.onClick}
    >
      {isHover ? <SwapButtonTwoTurnIcon /> : <SwapButtonOneTurnIcon />}
    </SimpleGrid>
  );
};
