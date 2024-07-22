import { Box, Grid, GridItem, HStack } from '@chakra-ui/react';
import { useCallback, useRef, useState } from 'react';

import { SPL_TOKENS, TOKENS } from '@/constants';
import PanelCard from '@/raydium/components/PanelCard';
import { SlippageAdjuster } from '@/raydium/components/SlippageAdjuster';
import SwapChatEmptyIcon from '@/raydium/icons/misc/SwapChatEmptyIcon';
import SwapChatIcon from '@/raydium/icons/misc/SwapChatIcon';
import SwapExchangeIcon from '@/raydium/icons/misc/SwapExchangeIcon';
import { colors } from '@/raydium/theme/cssVariables';

import { SwapKlinePanel, TimeType } from './components/SwapKlinePanel';
import { SwapPanel } from './components/SwapPanel';

// FIXME: Initialized with Raydium UI -- Unused logic and code to be removed
const SolanaDemoPage = () => {
  const [isPCChartShown, setIsPCChartShown] = useState<boolean>(true);
  const [isMobileChartShown, setIsMobileChartShown] = useState<boolean>(false);
  const [isChartLeft, setIsChartLeft] = useState<boolean>(true);

  const isMobile = true;
  const [selectedTimeType, setSelectedTimeType] = useState<TimeType>('15m');
  const untilDate = useRef(Math.floor(Date.now() / 1000));
  const swapPanelRef = useRef<HTMLDivElement>(null);
  const klineRef = useRef<HTMLDivElement>(null);

  const [inputMint, setInputMint] = useState<string>(
    SPL_TOKENS.wSOL.toString(),
  );
  const [outputMint, setOutputMint] = useState<string>(
    SPL_TOKENS.wMEME.toString(),
  );

  const [tokenInput, tokenOutput] = [
    TOKENS.find((t) => t.mint === inputMint)!,
    TOKENS.find((t) => t.mint === outputMint)!,
  ];

  const handleChangeSide = useCallback(() => {
    setInputMint(outputMint);
    setOutputMint(inputMint);
  }, [inputMint, outputMint]);

  return (
    <div className="px-4 pt-[96px] container mx-auto">
      <HStack alignSelf="flex-end" my={[1, 0]}>
        <SlippageAdjuster />
        {!isMobile && isPCChartShown && (
          <Box
            cursor="pointer"
            onClick={() => {
              setIsChartLeft((b) => !b);
            }}
          >
            <SwapExchangeIcon />
          </Box>
        )}
        <Box
          cursor="pointer"
          onClick={() => {
            if (!isMobile) {
              setIsPCChartShown((b) => !b);
            } else {
              setIsMobileChartShown(true);
            }
          }}
        >
          {isMobile || isPCChartShown ? (
            <SwapChatIcon />
          ) : (
            <Box color={colors.textSecondary}>
              <SwapChatEmptyIcon />
            </Box>
          )}
        </Box>
      </HStack>
      <Grid
        width="full"
        gridTemplate={[
          `
            "panel" auto
            "kline" auto / auto
          `,
          isPCChartShown
            ? isChartLeft
              ? `"kline  panel" auto / 1.5fr 1fr`
              : `"panel kline" auto / 1fr 1.5fr`
            : `"panel" auto / auto`,
        ]}
        gap={[3, isPCChartShown ? 4 : 0]}
      >
        <GridItem ref={swapPanelRef} gridArea="panel">
          <PanelCard p={[3, 6]} flexGrow={['1', 'unset']}>
            <SwapPanel
              tokenInput={tokenInput}
              tokenOutput={tokenOutput}
              handleChangeSide={handleChangeSide}
            />
          </PanelCard>
        </GridItem>

        <GridItem gridArea="kline" {...(isMobile ? { mb: 3 } : {})}>
          <PanelCard
            ref={klineRef}
            p={[3, 3]}
            gap={4}
            height="100%"
            // {...(isMobile || !isPCChartShown ? { display: 'none' } : {})}
          >
            <SwapKlinePanel
              untilDate={untilDate.current}
              baseToken={tokenInput}
              quoteToken={tokenOutput}
              timeType={selectedTimeType}
              onDirectionToggle={handleChangeSide}
              onTimeTypeChange={setSelectedTimeType}
            />
          </PanelCard>
        </GridItem>
      </Grid>
    </div>
  );
};

export default SolanaDemoPage;
