import {
  Box,
  Button,
  Flex,
  SimpleGrid,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { TxVersion } from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js';
import { useCallback, useRef, useState } from 'react';
import { formatUnits } from 'viem';

import { Token } from '@/constants';
import { useComputeSwap, useRaydium } from '@/hooks';
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

  const [amountIn, setAmountIn] = useState<string>('');
  const swapDisabled = false;

  const raydium = useRaydium();
  const computeResult = useComputeSwap(raydium!, tokenInput.mint, amountIn);

  const outputAmount =
    (computeResult && tokenOutput && computeResult.outputAmount) || null;

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
      console.log(commitData);
      console.log(commitData.transaction);
      console.log(commitData.transaction.serialize());
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
          value={amountIn}
          readonly={swapDisabled}
          onChange={setAmountIn}
        />

        <SwapIcon onClick={handleChangeSide} />

        <TokenInput
          name="swap"
          topLeftLabel="To"
          token={tokenOutput}
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

      <Button onClick={handleClickSwap}>
        <Text>Swap</Text>
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
