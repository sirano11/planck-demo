import {
  Box,
  Button,
  Flex,
  SimpleGrid,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { TxVersion } from '@raydium-io/raydium-sdk-v2';
import { waitForTransactionReceipt } from '@wagmi/core';
import BN from 'bn.js';
import { BridgeToken__factory } from 'planck-demo-contracts/typechain/factories/BridgeToken__factory';
import { useCallback, useMemo, useRef, useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useWriteContract } from 'wagmi';

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

  const raydium = useRaydium();
  const computeResult = useComputeSwap(raydium!, tokenInput.mint, amountIn);

  const inputAmount = (computeResult && computeResult.inputAmount) || null;
  const outputAmount = (computeResult && computeResult.outputAmount) || null;

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
    if (!computeResult || !raydium) {
      return;
    }
    onSending();
    try {
      const commitData = await raydium.liquidity.swap({
        poolInfo: computeResult.poolInfo,
        poolKeys: computeResult.poolKeys,
        inputMint: tokenInput.mint!,
        amountIn: new BN(computeResult.inputAmount),
        amountOut: new BN(computeResult.minimumAmount), // amountOut means amount 'without' slippage
        fixedSide: 'in',
        txVersion: TxVersion.V0,
      });
      console.log({ commitData });

      const rawTx = commitData.transaction.serialize();
      console.log({ rawTx });

      // TODO: Add approval logic for (asset, amountAtomics)

      await commit(
        HUB_CONTRACT_ADDRESS,
        tokenInput.address,
        BigInt(computeResult.inputAmount.toString()),
        ChainIdentifier.Solana,
        rawTx,
      );
    } catch (e) {
      console.error(e);
    } finally {
      offSending();
    }
  }, [raydium, computeResult, tokenInput, onSending, offSending]);

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
      <Box mb={[4, 5]}>
        <SwapInfoBoard
          amountIn={amountIn}
          tokenInput={tokenInput}
          tokenOutput={tokenOutput}
        />
      </Box>

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
