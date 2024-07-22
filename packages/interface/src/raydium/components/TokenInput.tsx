import {
  Box,
  BoxProps,
  Grid,
  GridItem,
  HStack,
  Input,
  InputGroup,
  Spacer,
  StackProps,
  SystemStyleObject,
  Text,
  useColorMode,
  useDisclosure,
} from '@chakra-ui/react';
import { ApiV3Token, TokenInfo } from '@raydium-io/raydium-sdk-v2';
import React, { ReactNode } from 'react';
import { formatUnits } from 'viem';

import { Token } from '@/constants/tokens';
import { useEvent } from '@/raydium/hooks/useEvent';
import BalanceWalletIcon from '@/raydium/icons/misc/BalanceWalletIcon';
import ChevronDownIcon from '@/raydium/icons/misc/ChevronDownIcon';
import { colors } from '@/raydium/theme/cssVariables';
import { formatCurrency } from '@/raydium/utils/numberish/formatter';

import TokenAvatar from './TokenAvatar';

const DEFAULT_SOL_RESERVER = 0.01;
interface TokenInputProps {
  id?: string;
  name?: string;
  /**
   * @default auto-detect if it's on pc, use md; if it's on mobile, use sm
   * md:
   * - input text size : 28px
   * - token symbol text size: 2xl
   * - token icon size: md
   * - opacity volume text size: sm
   * - downer & upper grid px: 18px
   * - downer darker grid py: 16px
   * - upper grid py: 12px
   *
   * sm:
   * - input text size : lg
   * - token symbol text size: lg
   * - token icon size: sm
   * - opacity volume text size: xs
   * - downer & upper grid px: 12px
   * - downer darker grid py: 14px
   * - upper grid py: 10px
   */
  size?: 'md' | 'sm';
  token: Token;
  tokenBalance: bigint;

  /** <NumberInput> is disabled */
  readonly?: boolean;
  loading?: boolean;

  /** default is empty string */
  value?: string;

  topLeftLabel?: ReactNode;

  hideBalance?: boolean;
  hideTokenIcon?: boolean;
  hideControlButton?: boolean;

  disableTotalInputByMask?: boolean;
  renderMaskContent?: ReactNode;
  renderMaskProps?: BoxProps;

  disableSelectToken?: boolean;
  disableClickBalance?: boolean;
  forceBalanceAmount?: string | number;
  maxMultiplier?: number | string;
  solReserveAmount?: number | string;
  renderTopRightPrefixLabel?: () => ReactNode;

  width?: string;
  height?: string;
  sx?: SystemStyleObject;
  ctrSx?: SystemStyleObject;
  topBlockSx?: StackProps;
  onChange?: (val: string) => void;
  /** for library:fomik  */
  onTokenChange?: (token: TokenInfo | ApiV3Token) => void;
  onFocus?: () => void;

  // defaultUnknownToken?: TokenInfo;
}

/**
 * dirty component, inner has tokenPrice store state and balance store state and tokenMap store state(in `<TokenSelectDialog />`)
 */
function TokenInput(props: TokenInputProps) {
  const {
    id,
    name,
    size: inputSize,
    token,
    tokenBalance,
    hideBalance = false,
    hideTokenIcon = false,
    hideControlButton = false,
    disableTotalInputByMask,
    renderMaskContent,
    renderMaskProps,
    disableSelectToken,
    disableClickBalance,
    forceBalanceAmount,
    maxMultiplier,
    solReserveAmount = DEFAULT_SOL_RESERVER,
    renderTopRightPrefixLabel = () => (
      <BalanceWalletIcon color={colors.textTertiary} />
    ),
    onChange,
    onTokenChange,
    onFocus,
    // filterFn,
    topLeftLabel,
    readonly,
    value: inputValue,
    loading,
    width,
    topBlockSx,
    ctrSx,
    sx,
    // defaultUnknownToken,
  } = props;
  const isMobile = false;

  const { colorMode } = useColorMode();
  const isLight = colorMode === 'light';
  const { onOpen } = useDisclosure();

  const size = inputSize ?? isMobile ? 'sm' : 'md';
  const sizes = {
    inputText: size === 'sm' ? 'lg' : '28px',
    tokenSymbol: size === 'sm' ? 'lg' : '2xl',
    tokenIcon: size === 'sm' ? 'sm' : 'md',
    disableSelectTokenIconSize: size === 'sm' ? 'md' : '40px',
    opacityVolume: size === 'sm' ? 'xs' : 'sm',
    downerUpperGridPx: size === 'sm' ? '12px' : '18px',
    downerGridPy: size === 'sm' ? '14px' : '16px',
    upperGridPy: size === 'sm' ? '10px' : '12px',
  };

  const handleFocus = useEvent(() => {
    if (inputValue === '0') {
      onChange?.('');
    }
    onFocus?.();
  });

  const handleClickMax = useEvent(() => {
    if (disableClickBalance) return;
    // if (!maxString) return;
    handleFocus();
    onChange?.(formatUnits(tokenBalance, token.decimals || 9));
  });

  return (
    <Box
      bg={colors.backgroundDark50}
      position={'relative'}
      rounded={12}
      sx={ctrSx}
    >
      {disableTotalInputByMask ? (
        <Box
          rounded="inherit"
          position={'absolute'}
          inset={0}
          zIndex={1}
          display={'grid'}
          placeContent={'center'}
          bg={'#0003'}
          backdropFilter={'blur(4px)'}
          {...renderMaskProps}
        >
          {renderMaskContent}
        </Box>
      ) : null}
      <HStack
        pointerEvents={disableTotalInputByMask ? 'none' : 'initial'}
        px={sizes.downerUpperGridPx}
        py={sizes.upperGridPy}
        {...(topBlockSx || {})}
      >
        {/* top left label */}
        <Box fontSize="sm" fontWeight={500}>
          {topLeftLabel}
        </Box>
        <Spacer />

        {/* balance */}
        {!hideBalance && (
          <HStack spacing={0.5} color={colors.textTertiary} fontSize="sm">
            {renderTopRightPrefixLabel()}
            <Text
              onClick={handleClickMax}
              cursor="pointer"
              textDecoration={'underline'}
              textDecorationThickness={'.5px'}
              transition={'300ms'}
              sx={{ textUnderlineOffset: '1px' }}
              _hover={{
                textDecorationThickness: '1.5px',
                textUnderlineOffset: '2px',
              }}
            >
              {typeof tokenBalance === 'undefined'
                ? '-' // 값이 없을 땐 0 과 구별해서 표시
                : formatUnits(tokenBalance, token.decimals!)}
            </Text>
          </HStack>
        )}
      </HStack>

      <Grid
        gridTemplate={`
        "token input" auto
        "token price" auto / auto 1fr
        `}
        columnGap={[2, 4]}
        alignItems="center"
        pointerEvents={disableTotalInputByMask ? 'none' : 'initial'}
        width={width}
        sx={sx}
        rounded={12}
        px={sizes.downerUpperGridPx}
        py={2}
        bg={colors.backgroundDark}
        opacity={loading ? 0.8 : 1}
      >
        <GridItem
          area="token"
          color={colors.textSecondary}
          fontWeight={500}
          fontSize={sizes.tokenSymbol}
        >
          <HStack
            bg={disableSelectToken ? undefined : colors.backgroundLight}
            rounded={disableSelectToken ? undefined : 12}
            px={disableSelectToken ? undefined : 3}
            py={disableSelectToken ? undefined : 2.5}
            cursor={disableSelectToken ? undefined : 'pointer'}
            onClick={disableSelectToken ? undefined : onOpen}
          >
            {hideTokenIcon ? null : (
              <TokenAvatar
                token={token}
                size={
                  disableSelectToken
                    ? sizes.disableSelectTokenIconSize
                    : sizes.tokenIcon
                }
              />
            )}
            <Text color={isLight ? colors.secondary : colors.textPrimary}>
              {token.symbol}
            </Text>
            {disableSelectToken ? undefined : (
              <ChevronDownIcon width={20} height={20} />
            )}
          </HStack>
        </GridItem>

        <GridItem
          area="input"
          color={colors.textPrimary}
          fontWeight={500}
          fontSize={sizes.inputText}
        >
          <InputGroup sx={{ width }}>
            <Input
              variant="number"
              sx={{ '&[disabled]': { opacity: 1 } }}
              onChange={(e) => {
                let value = e.target.value

                  // Only allow numbers and dot
                  .replace(/[^0-9.]/g, '')

                  // Ensure only one dot
                  .replace(/(\.[\d]*?)\..*/g, '$1')

                  .trim();

                onChange?.(value);
              }}
              onFocus={handleFocus}
              isDisabled={readonly || loading}
              value={inputValue}
              min={0}
              width={width || '100%'}
              opacity={loading ? 0.5 : 1}
              id={id}
              name={name}
              textAlign="end"
              fontWeight={500}
              fontSize={sizes.inputText}
              paddingX={0}
              height="unset"
              bg="transparent"
              _focus={{ bg: 'transparent' }}
              _hover={{ bg: 'transparent' }}
              _active={{ bg: 'transparent' }}
            />
          </InputGroup>
        </GridItem>

        <GridItem
          area="price"
          color={colors.textTertiary}
          fontSize={sizes.opacityVolume}
        >
          <Text textAlign="right">
            ~{/* FIXME: */}
            {formatCurrency(0, {
              symbol: '$',
              maximumDecimalTrailingZeroes: 5,
            })}
          </Text>
        </GridItem>
      </Grid>
      {/* {unknownToken !== undefined && (
        <TokenUnknownAddDialog
          isOpen={isOpenUnknownTokenConfirm}
          onClose={onCloseUnknownTokenConfirm}
          token={unknownToken}
          onConfirm={handleUnknownTokenConfirm}
        />
      )}
      {freezeToken !== undefined && (
        <TokenFreezeDialog
          isOpen={isOpenFreezeTokenConfirm}
          onClose={onCloseFreezeTokenConfirm}
          token={freezeToken}
          onConfirm={handleFreezeTokenConfirm}
        />
      )} */}
    </Box>
  );
}

export default TokenInput;
