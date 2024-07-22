import { Box, Collapse, Flex, HStack, Skeleton, Text } from '@chakra-ui/react';
import Decimal from 'decimal.js';
import { Fragment, RefObject, useRef, useState } from 'react';
import { ChevronDown } from 'react-feather';

import { TOKENS, Token } from '@/constants/tokens';
import { ComputeSwapResult } from '@/hooks/useComputeSwap';
import AddressChip from '@/raydium/components/AddressChip';
import IntervalCircle, {
  IntervalCircleHandler,
} from '@/raydium/components/IntervalCircle';
import { QuestionToolTip } from '@/raydium/components/QuestionToolTip';
import TokenAvatar from '@/raydium/components/TokenAvatar';
import Tooltip from '@/raydium/components/Tooltip';
import { useEvent } from '@/raydium/hooks/useEvent';
import CircleCheckBreaker from '@/raydium/icons/misc/CircleCheckBreaker';
import HorizontalSwitchIcon from '@/raydium/icons/misc/HorizontalSwitchIcon';
import WarningIcon from '@/raydium/icons/misc/WarningIcon';
import { colors } from '@/raydium/theme/cssVariables';
import {
  formatCurrency,
  formatToRawLocaleStr,
  trimTrailZero,
} from '@/raydium/utils/numberish/formatter';
import toPercentString from '@/raydium/utils/numberish/toPercentString';

import { ApiSwapV1OutSuccess } from '../type';

type SwapInfoBoardProps = {
  tokenInput?: Token;
  tokenOutput?: Token;
  isComputing: boolean;
  computeSwapResult?: ComputeSwapResult;
};
export const SwapInfoBoard: React.FC<SwapInfoBoardProps> = ({
  tokenInput,
  tokenOutput,
  isComputing,
  computeSwapResult,
}) => {
  const [showMoreSwapInfo, setShowMoreSwapInfo] = useState(false);
  const refreshCircleRef = useRef<IntervalCircleHandler>(null);

  const priceImpact = computeSwapResult?.priceImpact.toNumber() || 0;
  const isHighRiskPrice = priceImpact > 5;

  const routePlan = !computeSwapResult
    ? []
    : [
        {
          poolId: computeSwapResult.poolInfo.id,
          tokenInput,
          tokenOutput,
          feeMint: tokenInput?.address!,
          feeRate: computeSwapResult.poolInfo.feeRate,
          feeAmount: computeSwapResult.fee.toString(),
        },
      ];

  return (
    <Box
      position="relative"
      boxShadow={
        isHighRiskPrice ? `0px 0px 12px 6px rgba(255, 78, 163, 0.15)` : 'none'
      }
      bg={
        isHighRiskPrice
          ? 'rgba(255, 78, 163,0.1)'
          : colors.backgroundTransparent07
      }
      borderWidth="1px"
      borderStyle="solid"
      borderColor={
        isHighRiskPrice ? colors.semanticError : colors.backgroundTransparent12
      }
      rounded="md"
      px={4}
      pt={1.5}
      pb={2}
    >
      {/* Top utils */}
      <HStack gap={4} py={2} justifyContent="space-between">
        <PriceDetector
          computedSwapResult={computeSwapResult}
          isComputing={isComputing}
          tokenInput={tokenInput}
          tokenOutput={tokenOutput}
        />
        <OtherMiscUtils
          refreshCircleRef={refreshCircleRef}
          // onClick={onRefresh}
          // onEnd={onRefresh}
        />
      </HStack>

      <HStack gap={4} py={1} justifyContent="space-between">
        <ItemLabel
          name={'Minimum Received'}
          tooltip="The minimum number of tokens you will receive. This is determined by your slippage tolerance."
        />
        <MinimumReceiveValue
          tokenOutput={tokenOutput}
          amount={computeSwapResult?.minAmountOut.toString() || ''}
        />
      </HStack>

      <HStack gap={4} py={1} justifyContent="space-between">
        <ItemLabel
          name="Price Impact"
          tooltip="The difference between the current market price and estimated price due to trade size"
        />
        <Text
          fontSize="xs"
          color={
            isHighRiskPrice
              ? colors.semanticError
              : priceImpact > 1
                ? colors.semanticWarning
                : colors.textSecondary
          }
          fontWeight={500}
        >
          {computeSwapResult
            ? `${formatToRawLocaleStr(toPercentString(priceImpact.toString(), { notShowZero: true }))}`
            : '-'}
        </Text>
      </HStack>

      <Collapse in={showMoreSwapInfo} animateOpacity>
        <HStack gap={4} py={1} justifyContent="space-between">
          <ItemLabel
            name="Order Routing"
            tooltip="This route gave the best price for your trade"
          />
          <RoutingValue routePlan={routePlan} />
        </HStack>

        <HStack gap={4} py={1} justifyContent="space-between">
          <ItemLabel
            name="Estimated Fees"
            tooltip="Swap fees go to LPs, RAY buybacks, and treasury."
          />
          <Text align="end" fontSize="xs" color={colors.textPrimary}>
            {routePlan.map((route) => (
              <FeeItem key={route.poolId} route={route} />
            ))}
          </Text>
        </HStack>
      </Collapse>

      <HStack
        color={colors.textSecondary}
        fontSize="xs"
        fontWeight={500}
        spacing={0.5}
        justify="center"
        onClick={() => setShowMoreSwapInfo((b) => !b)}
      >
        <Text align="center" cursor="pointer">
          {showMoreSwapInfo ? 'Less info' : 'More info'}
        </Text>
        {/* arrow */}
        <Box
          transform={`rotate(${showMoreSwapInfo ? `${180}deg` : 0})`}
          transition="300ms"
        >
          <ChevronDown size={12} />
        </Box>
      </HStack>
    </Box>
  );
};

type PriceDetectorProps = {
  isComputing: boolean;
  computedSwapResult?: ComputeSwapResult;
  tokenInput?: Token;
  tokenOutput?: Token;
};
const PriceDetector: React.FC<PriceDetectorProps> = ({
  isComputing,
  tokenInput,
  tokenOutput,
  computedSwapResult,
}) => {
  const [reverse, setReverse] = useState(false);

  const priceImpact = computedSwapResult
    ? computedSwapResult.priceImpact.toNumber() > 5
      ? 'high'
      : computedSwapResult.priceImpact.toNumber() > 1
        ? 'warning'
        : 'low'
    : undefined;

  let price = computedSwapResult
    ? trimTrailZero(
        new Decimal(computedSwapResult.amountOut.toString())
          .div(10 ** (tokenOutput?.decimals || 0))
          .div(
            new Decimal(computedSwapResult.amountIn.toString()).div(
              10 ** (tokenInput?.decimals || 0),
            ),
          )
          .toFixed(tokenOutput?.decimals || 0, Decimal.ROUND_FLOOR),
      )!
    : '';
  if (reverse)
    price =
      price === ''
        ? price
        : new Decimal(1)
            .div(price)
            .toDecimalPlaces(tokenInput?.decimals || 0, Decimal.ROUND_FLOOR)
            .toString();

  return (
    <HStack>
      <Text as="div" color={colors.textPrimary} fontWeight={500}>
        <Flex
          gap="1"
          alignItems="center"
          flexWrap="wrap"
          maxW={['80%', 'none']}
        >
          <Text as="div">1</Text>
          <Text as="div">
            {reverse ? tokenOutput?.symbol : tokenInput?.symbol}
          </Text>
          ≈
          {!isComputing ? (
            <Text as="div">
              {formatCurrency(price, {
                decimalPlaces: tokenInput?.decimals || 0,
              })}
            </Text>
          ) : (
            <Skeleton
              width={`${12 * ((reverse ? tokenInput?.decimals : tokenOutput?.decimals) || 1)}px`}
              height="24px"
            />
          )}
          <Text as="div">
            {reverse ? tokenInput?.symbol : tokenOutput?.symbol}
          </Text>
        </Flex>
      </Text>
      <Tooltip
        label={
          priceImpact === 'high'
            ? 'Price Impact Warning'
            : priceImpact === 'warning'
              ? 'Price Impact Warning'
              : 'Low Price Impact'
        }
      >
        {priceImpact === 'low' ? (
          <CircleCheckBreaker />
        ) : priceImpact === 'warning' ? (
          <WarningIcon />
        ) : priceImpact === 'high' ? (
          <WarningIcon stroke={colors.semanticError} />
        ) : null}
      </Tooltip>
      <Box
        onClick={() => setReverse((b) => !b)}
        color={colors.textSecondary}
        cursor="pointer"
      >
        <HorizontalSwitchIcon />
      </Box>
    </HStack>
  );
};

type ItemLabelProps = {
  name: string;
  tooltip?: string | null;
};
const ItemLabel: React.FC<ItemLabelProps> = ({ name, tooltip }) => {
  return (
    <HStack fontSize="xs" color={colors.textSecondary}>
      <Text>{name}</Text>
      {tooltip && (
        <QuestionToolTip
          label={tooltip}
          iconProps={{ color: colors.textTertiary }}
        />
      )}
    </HStack>
  );
};

type OtherMiscUtilsProps = {
  refreshCircleRef: RefObject<IntervalCircleHandler>;
  onClick?(): void;
  onEnd?(): void;
};
const OtherMiscUtils: React.FC<OtherMiscUtilsProps> = ({
  refreshCircleRef,
  onClick,
  onEnd,
}) => {
  const handleClick = useEvent(() => {
    refreshCircleRef.current?.restart();
    onClick?.();
  });

  return (
    <Flex>
      <IntervalCircle
        componentRef={refreshCircleRef}
        duration={60 * 1000}
        svgWidth={18}
        strokeWidth={2}
        trackStrokeColor={colors.secondary}
        trackStrokeOpacity={0.5}
        filledTrackStrokeColor={colors.secondary}
        onClick={handleClick}
        onEnd={onEnd}
      />
    </Flex>
  );
};

type MinimumReceiveValueProps = {
  tokenOutput?: Token;
  amount: string;
};
const MinimumReceiveValue: React.FC<MinimumReceiveValueProps> = ({
  tokenOutput,
  amount,
}) => {
  return (
    <HStack fontSize="xs" fontWeight={500}>
      <Text color={colors.textPrimary}>
        {amount && tokenOutput
          ? formatCurrency(
              new Decimal(amount)
                .div(10 ** tokenOutput.decimals)
                .toFixed(tokenOutput.decimals, Decimal.ROUND_FLOOR),
              {
                decimalPlaces: tokenOutput?.decimals,
              },
            )
          : formatCurrency(amount)}
      </Text>
      {/* <Text color={colors.textSecondary}>{tokenOutput?.symbol}</Text> */}
    </HStack>
  );
};

type Route = {
  poolId: string;
  tokenInput?: Token;
  tokenOutput?: Token;

  feeMint: string;
  feeRate: number;
  feeAmount: string;
};
type RoutingValue = {
  routePlan: Route[];
};
const RoutingValue: React.FC<RoutingValue> = ({ routePlan }) => {
  return (
    <HStack spacing={0.5} minH="32px">
      {routePlan.map(({ tokenInput, tokenOutput, feeRate, poolId }, idx) => (
        <Fragment key={tokenInput?.mint}>
          <Tooltip
            label={
              <AddressChip
                address={tokenInput?.mint}
                textProps={{ fontSize: 'xs' }}
                canExternalLink
              />
            }
          >
            <TokenAvatar
              token={tokenInput}
              tokenMint={tokenInput?.mint}
              size="sm"
            />
          </Tooltip>
          <Tooltip
            label={
              <AddressChip
                address={poolId}
                renderLabel={'AMM ID:'}
                textProps={{ fontSize: 'xs' }}
                canExternalLink
              />
            }
          >
            <Text fontSize={'2xs'} color={colors.textSecondary}>
              {formatToRawLocaleStr(toPercentString(feeRate / 100))}
            </Text>
          </Tooltip>

          {idx !== routePlan.length - 1 && (
            <Text color={colors.textTertiary}>▸</Text>
          )}
          {idx === routePlan.length - 1 && (
            <>
              <Text color={colors.textTertiary}>▸</Text>
              <Tooltip
                label={
                  <AddressChip
                    address={tokenOutput?.mint}
                    textProps={{ fontSize: 'xs' }}
                    canExternalLink
                  />
                }
              >
                <TokenAvatar
                  token={tokenOutput}
                  tokenMint={tokenOutput?.mint}
                  size="sm"
                />
              </Tooltip>
            </>
          )}
        </Fragment>
      ))}
    </HStack>
  );
};

type FeeItemProps = {
  route: Route;
};
const FeeItem: React.FC<FeeItemProps> = ({ route }) => {
  const feeToken = TOKENS.find((v) => v.mint === route.feeMint);
  if (!feeToken) {
    return null;
  }
  return (
    <Flex alignItems="center" justifyContent="space-between" gap="1">
      {formatCurrency(
        new Decimal(route.feeAmount)
          .div(10 ** feeToken.decimals)
          .toDecimalPlaces(feeToken.decimals, Decimal.ROUND_FLOOR)
          .toString(),
        { decimalPlaces: feeToken.decimals },
      )}
      <Text>{feeToken.symbol}</Text>
    </Flex>
  );
};
