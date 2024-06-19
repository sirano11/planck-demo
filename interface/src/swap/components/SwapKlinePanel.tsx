import { Box, Grid, GridItem, HStack, Text } from '@chakra-ui/react';
// import { ApiV3Token } from '@raydium-io/raydium-sdk-v2';
import dayjs from 'dayjs';
import { useState } from 'react';

import Tabs from '@/raydium/components/Tabs';
import TokenAvatarPair from '@/raydium/components/TokenAvatarPair';
// import { TimeType } from '@/raydium/hooks/pool/useFetchPoolKLine';
import SwapIcon from '@/raydium/icons/misc/SwapIcon';
import { colors } from '@/raydium/theme/cssVariables';
import {
  formatCurrency,
  formatToRawLocaleStr,
} from '@/raydium/utils/numberish/formatter';
import toPercentString from '@/raydium/utils/numberish/toPercentString';

import CandleChart from './CandleChart';

export type TimeType = '15m' | '1H' | '4H' | '1D' | '1W';

export function SwapKlinePanel({
  // baseToken,
  // quoteToken,
  timeType,
  untilDate,
  onDirectionToggle,
  onTimeTypeChange,
}: {
  untilDate: number;
  // baseToken: ApiV3Token | undefined;
  // quoteToken: ApiV3Token | undefined;
  timeType: TimeType;
  onDirectionToggle?(): void;
  onTimeTypeChange?(timeType: TimeType): void;
}) {
  const [price, setPrice] = useState<
    | {
        current: number;
        change: number;
      }
    | undefined
  >();

  return (
    <>
      <Grid
        gridTemplate={`
        "name   tabs " auto
        "chartwrap chartwrap" 1fr / 1fr auto
      `}
        alignItems="center"
        height={'100%'}
      >
        <GridItem gridArea="name" marginLeft="4px" marginBottom="12px">
          <HStack spacing={2}>
            <TokenAvatarPair token1={undefined} token2={undefined} />
            <HStack>
              <Text fontSize="20px" fontWeight="500">
                {/* {baseToken?.symbol} / {quoteToken?.symbol} */}
                SOL / MEME
              </Text>
              <Box
                cursor="pointer"
                onClick={() => {
                  onDirectionToggle?.();
                }}
              >
                <SwapIcon />
              </Box>
              <Text fontSize="sm" color={colors.textTertiary}>
                {/* {dayjs().utc().format('YY/MM/DD HH:MM')} */}
              </Text>
            </HStack>
          </HStack>
        </GridItem>
        <GridItem gridArea="tabs" marginRight="8px" marginBottom="12px">
          <Tabs
            items={['15m', '1H', '4H', '1D', '1W']}
            variant="squarePanel"
            onChange={(t: TimeType) => {
              onTimeTypeChange?.(t);
            }}
            tabItemSX={{ minWidth: '3.75em' }}
            style={{ marginLeft: 'auto' }}
          />
        </GridItem>
        <GridItem area={'chartwrap'} height="100%">
          <Grid
            gridTemplate={`
            "price  price" auto
            "chart  chart" 1fr / 1fr auto
            `}
            alignItems="center"
            cursor="pointer"
            paddingLeft="16px"
            height="100%"
            bg={colors.backgroundDark}
            borderRadius="8px"
          >
            <GridItem gridArea="price" paddingTop="8px">
              <HStack spacing={2} alignItems="baseline">
                <Text
                  fontSize="28px"
                  fontWeight={700}
                  color={colors.textPrimary}
                >
                  {price
                    ? formatCurrency(price.current, {
                        maximumDecimalTrailingZeroes: 5,
                      })
                    : price}
                </Text>
                {price?.change && (
                  <Text
                    fontSize="sm"
                    color={
                      price?.change > 0
                        ? colors.priceFloatingUp
                        : price?.change < 0
                          ? colors.priceFloatingDown
                          : colors.priceFloatingFlat
                    }
                  >
                    {formatToRawLocaleStr(
                      toPercentString(price?.change, { alwaysSigned: true }),
                    )}
                  </Text>
                )}
              </HStack>
            </GridItem>
            <CandleChart
              onPriceChange={setPrice}
              // baseMint={baseToken}
              // quoteMint={quoteToken}
              timeType={timeType}
              untilDate={untilDate}
            />
          </Grid>
        </GridItem>
      </Grid>
    </>
  );
}
