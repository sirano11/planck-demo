import { Box, Grid, GridItem, HStack, VStack } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';

import PanelCard from '@/raydium/components/PanelCard';
import { SlippageAdjuster } from '@/raydium/components/SlippageAdjuster';
import { useIsomorphicLayoutEffect } from '@/raydium/hooks/useIsomorphicLayoutEffect';
import SwapChatEmptyIcon from '@/raydium/icons/misc/SwapChatEmptyIcon';
import SwapChatIcon from '@/raydium/icons/misc/SwapChatIcon';
import SwapExchangeIcon from '@/raydium/icons/misc/SwapExchangeIcon';
import { getVHExpression } from '@/raydium/theme/cssValue/getViewportExpression';
import { colors } from '@/raydium/theme/cssVariables';

import { SwapKlinePanel, TimeType } from './components/SwapKlinePanel';
import { SwapPanel } from './components/SwapPanel';

const DynamicProviders = dynamic(() =>
  import('@/raydium/provider').then((mod) => mod.Providers),
);
const DynamicContent = dynamic(() => import('@/raydium/components/Content'));

// FIXME: Initialized with Raydium UI -- Unused logic and code to be removed
const SolanaDemoPage = () => {
  const [isPCChartShown, setIsPCChartShown] = useState<boolean>(true);
  const [isMobileChartShown, setIsMobileChartShown] = useState<boolean>(false);
  const [isChartLeft, setIsChartLeft] = useState<boolean>(true);

  const isMobile = true;
  const [directionReverse, setDirectionReverse] = useState<boolean>(false);
  const [selectedTimeType, setSelectedTimeType] = useState<TimeType>('15m');
  const untilDate = useRef(Math.floor(Date.now() / 1000));
  const swapPanelRef = useRef<HTMLDivElement>(null);
  const klineRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    if (klineRef.current) {
      const height = `${swapPanelRef.current?.getBoundingClientRect().height}px`;
      klineRef.current.style.height = height;
    }
  }, []);

  return (
    <DynamicProviders>
      <DynamicContent>
        <VStack
          pt={16}
          mx={['unset', 'auto']}
          mt={[0, getVHExpression([0, 800], [32, 1300])]}
          width={!isMobile && isPCChartShown ? 'min(100%, 1300px)' : undefined}
        >
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
                // onInputMintChange={setInputMint}
                // onOutputMintChange={setOutputMint}
                // onDirectionNeedReverse={() =>
                //   setIsDirectionNeedReverse((b) => !b)
                // }
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
                  // baseToken={baseToken}
                  // quoteToken={quoteToken}
                  timeType={selectedTimeType}
                  onDirectionToggle={() => setDirectionReverse((b) => !b)}
                  onTimeTypeChange={setSelectedTimeType}
                />
              </PanelCard>
            </GridItem>
          </Grid>
        </VStack>
      </DynamicContent>
    </DynamicProviders>
  );
};

export default SolanaDemoPage;
