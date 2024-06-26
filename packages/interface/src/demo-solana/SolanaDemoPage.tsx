import { Box, Grid, GridItem, HStack, VStack } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
// import { RAYMint, SOLMint, USDCMint, USDTMint } from '@raydium-io/raydium-sdk-v2'
// import { PublicKey } from '@solana/web3.js'
import { useEffect, useMemo, useRef, useState } from 'react';

import PanelCard from '@/raydium/components/PanelCard';
import { SlippageAdjuster } from '@/raydium/components/SlippageAdjuster';
// import { TimeType } from '@/raydium/hooks/pool/useFetchPoolKLine';
import { useIsomorphicLayoutEffect } from '@/raydium/hooks/useIsomorphicLayoutEffect';
import SwapChatEmptyIcon from '@/raydium/icons/misc/SwapChatEmptyIcon';
import SwapChatIcon from '@/raydium/icons/misc/SwapChatIcon';
import SwapExchangeIcon from '@/raydium/icons/misc/SwapExchangeIcon';
import { getVHExpression } from '@/raydium/theme/cssValue/getViewportExpression';
// import { useAppStore, useTokenStore } from '@/raydium/store'
import { colors } from '@/raydium/theme/cssVariables';

import { SwapKlinePanel, TimeType } from './components/SwapKlinePanel';
// import { SwapKlinePanelMobileDrawer } from './components/SwapKlinePanelMobileDrawer';
// import { SwapKlinePanelMobileThumbnail } from './components/SwapKlinePanelMobileThumbnail';
import { SwapPanel } from './components/SwapPanel';

// import { getSwapPairCache, setSwapPairCache } from './util';

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
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const untilDate = useRef(Math.floor(Date.now() / 1000));
  const swapPanelRef = useRef<HTMLDivElement>(null);
  const klineRef = useRef<HTMLDivElement>(null);

  // const baseMint = directionReverse ? outputMint : inputMint;
  // const quoteMint = directionReverse ? inputMint : outputMint;
  // const tokenMap = useTokenStore((s) => s.tokenMap);
  // const baseToken = useMemo(() => tokenMap.get(baseMint), [tokenMap, baseMint]);
  // const quoteToken = useMemo(
  //   () => tokenMap.get(quoteMint),
  //   [tokenMap, quoteMint],
  // );
  // const [isDirectionNeedReverse, setIsDirectionNeedReverse] =
  //   useState<boolean>(false);

  useEffect(() => {
    // const { inputMint: cacheInput, outputMint: cacheOutput } =
    //   getSwapPairCache();
    // if (cacheInput) setInputMint(cacheInput);
    // if (cacheOutput && cacheOutput !== cacheInput) setOutputMint(cacheOutput);
    setCacheLoaded(true);
  }, []);
  useEffect(() => {
    // preserve swap chart default direction on page refresh for SOL, USDC, and USDT basein
    const defaultMints = new Set<string>([
      // SOLMint.toBase58(),
      // USDCMint.toBase58(),
      // USDTMint.toBase58(),
    ]);
    if (cacheLoaded) {
      // defaultMints.has(baseMint) &&
      //   !defaultMints.has(quoteMint) &&
      //   setDirectionReverse(true);
    }
  }, [cacheLoaded]);
  // reset directionReverse when inputMint or outputMint changed
  useIsomorphicLayoutEffect(() => {
    if (!cacheLoaded) return;
    // if (isDirectionNeedReverse) {
    //   setDirectionReverse(true);
    //   setIsDirectionNeedReverse(false);
    // } else {
    //   setDirectionReverse(false);
    // }

    // setSwapPairCache({
    //   inputMint,
    //   outputMint,
    // });
  }, [
    // inputMint, outputMint,
    cacheLoaded,
  ]);

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
              {isMobile &&
                // <PanelCard
                //   p={[3, 6]}
                //   gap={0}
                //   onClick={() => {
                //     setIsMobileChartShown(true);
                //   }}
                //   height="100%"
                // >
                //   <SwapKlinePanelMobileThumbnail
                //     untilDate={untilDate.current}
                //     baseToken={baseToken}
                //     quoteToken={quoteToken}
                //     onDirectionToggle={() => setDirectionReverse((b) => !b)}
                //     onTimeTypeChange={setSelectedTimeType}
                //   />
                //   <SwapKlinePanelMobileDrawer
                //     untilDate={untilDate.current}
                //     isOpen={isMobileChartShown}
                //     onClose={() => setIsMobileChartShown(false)}
                //     baseToken={baseToken}
                //     quoteToken={quoteToken}
                //     timeType={selectedTimeType}
                //     onDirectionToggle={() => setDirectionReverse((b) => !b)}
                //     onTimeTypeChange={setSelectedTimeType}
                //   />
                // </PanelCard>
                null}
            </GridItem>
          </Grid>
        </VStack>
      </DynamicContent>
    </DynamicProviders>
  );
};

export default SolanaDemoPage;
