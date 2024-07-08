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
// import { ApiV3Token, SOL_INFO, TokenInfo } from '@raydium-io/raydium-sdk-v2';
import Decimal from 'decimal.js';
import React, { ReactNode, useEffect, useState } from 'react';

// import { toastSubject } from '@/raydium/hooks/toast/useGlobalToast';
// import useTokenPrice from '@/raydium/hooks/token/useTokenPrice';
import { useEvent } from '@/raydium/hooks/useEvent';
import BalanceWalletIcon from '@/raydium/icons/misc/BalanceWalletIcon';
import ChevronDownIcon from '@/raydium/icons/misc/ChevronDownIcon';
import { colors } from '@/raydium/theme/cssVariables';
// import { useAppStore, useTokenAccountStore, useTokenStore } from '@/store';
import {
  formatCurrency,
  formatToRawLocaleStr,
  isIntlNumberFormatSupported,
  trimTrailZero,
} from '@/raydium/utils/numberish/formatter';

// import Button from './Button';
import TokenAvatar from './TokenAvatar';

// import TokenSelectDialog, { TokenSelectDialogProps } from './TokenSelectDialog';
// import TokenFreezeDialog from './TokenSelectDialog/components/TokenFreezeDialog';
// import TokenUnknownAddDialog from './TokenSelectDialog/components/TokenUnknownAddDialog';

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
  // FIXME:
  token?: { decimals: number; address: string };
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
  // onTokenChange?: (token: TokenInfo | ApiV3Token) => void;
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
    token: inputToken,
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
    // onTokenChange,
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
  // const isMobile = useAppStore((s) => s.isMobile);
  // const setExtraTokenListAct = useTokenStore((s) => s.setExtraTokenListAct);
  // const whiteListMap = useTokenStore((s) => s.whiteListMap);
  const { colorMode } = useColorMode();
  const isLight = colorMode === 'light';
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenUnknownTokenConfirm,
    onOpen: onOpenUnknownTokenConfirm,
    onClose: onCloseUnknownTokenConfirm,
  } = useDisclosure();
  const {
    isOpen: isOpenFreezeTokenConfirm,
    onOpen: onOpenFreezeTokenConfirm,
    onClose: onCloseFreezeTokenConfirm,
  } = useDisclosure();

  const decimalSeparator = isIntlNumberFormatSupported
    ? new Intl.NumberFormat('en')
        .formatToParts(0.1)
        .find((part) => part.type === 'decimal')?.value || '.'
    : '.';

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

  const shakeValueDecimal = (
    value: number | string | undefined,
    decimals?: number,
  ) =>
    value &&
    !String(value).endsWith('.') &&
    decimals != null &&
    new Decimal(value).decimalPlaces() > decimals
      ? new Decimal(value)
          .toDecimalPlaces(decimals, Decimal.ROUND_DOWN)
          .toString()
      : value;

  // price
  // const tokenMap = useTokenStore((s) => s.tokenMap);
  // const token =
  // typeof inputToken === 'string' ? tokenMap.get(inputToken) : inputToken;
  const token = inputToken;
  // const { data: tokenPrice } = useTokenPrice({
  //   mintList: [token?.address],
  // });
  const value = shakeValueDecimal(inputValue, token?.decimals);
  // const price = tokenPrice[token?.address || '']?.value;
  const price = 0;
  const totalPrice =
    price && value ? new Decimal(price ?? 0).mul(value).toString() : '';

  // balance
  // const getTokenBalanceUiAmount = useTokenAccountStore(
  //   (s) => s.getTokenBalanceUiAmount,
  // );
  // const balanceInfo = getTokenBalanceUiAmount({
  //   mint: token?.address || '',
  //   decimals: token?.decimals,
  // });
  // const balanceAmount = balanceInfo.amount;
  // const balanceMaxString = hideBalance
  //   ? null
  //   : trimTrailZero(
  //       balanceAmount
  //         .mul(maxMultiplier || 1)
  //         .toFixed(token?.decimals ?? 6, Decimal.ROUND_FLOOR),
  //     );
  // const maxString = forceBalanceAmount
  //   ? trimTrailZero(String(forceBalanceAmount))
  //   : balanceMaxString;
  // const maxDecimal = forceBalanceAmount
  //   ? new Decimal(forceBalanceAmount)
  //   : balanceAmount;

  // const displayTokenSettings = useAppStore((s) => s.displayTokenSettings);

  // const [unknownToken, setUnknownToken] = useState<TokenInfo | ApiV3Token>();
  // const [freezeToken, setFreezeToken] = useState<TokenInfo | ApiV3Token>();

  // const handleValidate = useEvent((value: string) => {
  //   return numberRegExp.test(value)
  // })

  const handleFocus = useEvent(() => {
    if (value === '0') {
      onChange?.('');
    }
    onFocus?.();
  });

  // const getBalanceString = useEvent((amount: string) => {
  //   if (token?.address !== SOL_INFO.address || !balanceMaxString) return amount;
  //   if (new Decimal(balanceMaxString).sub(amount).gte(solReserveAmount))
  //     return amount;
  //   let decimal = new Decimal(amount).sub(solReserveAmount);
  //   if (decimal.lessThan(0)) decimal = new Decimal(0);
  //   return trimTrailZero(decimal.toFixed(token.decimals))!;
  // });

  // const handleClickMax = useEvent(() => {
  //   if (disableClickBalance) return;
  //   if (!maxString) return;
  //   handleFocus();
  //   onChange?.(getBalanceString(maxString));
  // });

  // const handleClickHalf = useEvent(() => {
  //   if (!maxString) return;
  //   handleFocus();
  //   onChange?.(getBalanceString(maxDecimal.div(2).toString()));
  // });

  // const isUnknownToken = useEvent((token: TokenInfo) => {
  //   const isUnknown =
  //     !token.type || token.type === 'unknown' || token.tags.includes('unknown');
  //   const isTrusted = isUnknown && !!tokenMap.get(token.address)?.userAdded;
  //   const isUserAddedTokenEnable = displayTokenSettings.userAdded;
  //   return isUnknown && (!isTrusted || !isUserAddedTokenEnable);
  // });

  // const isFreezeToken = useEvent((token: TokenInfo | ApiV3Token) => {
  //   return (
  //     token?.tags.includes('hasFreeze') && !whiteListMap.has(token.address)
  //   );
  // });

  // const handleSelectToken = useEvent((token: TokenInfo) => {
  //   const isFreeze = isFreezeToken(token);
  //   if (isFreeze) {
  //     setFreezeToken(token);
  //   }
  //   const shouldShowUnknownTokenConfirm = isUnknownToken(token);
  //   if (shouldShowUnknownTokenConfirm) {
  //     setUnknownToken(token);
  //     onOpenUnknownTokenConfirm();
  //     return;
  //   }
  //   if (isFreeze) {
  //     if (name === 'swap') {
  //       onOpenFreezeTokenConfirm();
  //     } else {
  //       toastSubject.next({
  //         title: t('token_selector.token_freeze_warning'),
  //         description: t('token_selector.token_has_freeze_disable'),
  //         status: 'warning',
  //       });
  //     }
  //     return;
  //   }
  //   onTokenChange?.(token);
  //   onClose();
  // });

  // const handleUnknownTokenConfirm = useEvent(
  //   (token: TokenInfo | ApiV3Token) => {
  //     setExtraTokenListAct({
  //       token: { ...token, userAdded: true } as TokenInfo,
  //       addToStorage: true,
  //       update: true,
  //     });
  //     onCloseUnknownTokenConfirm();
  //     const isFreeze = isFreezeToken(token);
  //     if (isFreeze) {
  //       if (name === 'swap') {
  //         onOpenFreezeTokenConfirm();
  //       } else {
  //         toastSubject.next({
  //           title: t('token_selector.token_freeze_warning'),
  //           description: t('token_selector.token_has_freeze_disable'),
  //           status: 'warning',
  //         });
  //       }
  //       return;
  //     }
  //     onTokenChange?.(token);
  //     setTimeout(() => {
  //       onTokenChange?.(token);
  //     }, 0);
  //     onClose();
  //   },
  // );

  // const handleFreezeTokenConfirm = useEvent((token: TokenInfo | ApiV3Token) => {
  //   onTokenChange?.(token);
  //   onCloseFreezeTokenConfirm();
  //   onClose();
  // });

  // const handleParseVal = useEvent((propVal: string) => {
  //   const val =
  //     propVal.match(new RegExp(`[0-9${decimalSeparator}]`, 'gi'))?.join('') ||
  //     '';
  //   if (!val) return '';
  //   const splitArr = val.split(decimalSeparator);
  //   if (splitArr.length > 2) return [splitArr[0], splitArr[1]].join('.');
  //   if (token && splitArr[1] && splitArr[1].length > token.decimals) {
  //     return [splitArr[0], splitArr[1].substring(0, token.decimals)].join('.');
  //   }
  //   return val === decimalSeparator ? '0.' : val.replace(decimalSeparator, '.');
  //   // const val = propVal.match(/[0-9.]/gi)?.join('') || ''
  //   // if (!val) return ''
  //   // const splitArr = val.split('.')
  //   // if (splitArr.length > 2) return [splitArr[0], splitArr[1]].join('.')
  //   // if (token && splitArr[1] && splitArr[1].length > token.decimals) {
  //   //   //.replace(/([1-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1')
  //   //   return [splitArr[0], splitArr[1].substring(0, token.decimals)].join('.')
  //   // }
  //   // return val === '.' ? '0.' : val
  // });

  // useEffect(() => {
  //   if (!defaultUnknownToken) return;
  //   handleSelectToken(defaultUnknownToken);
  // }, [defaultUnknownToken?.address]);

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
        {/* {!hideBalance && maxString && (
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
              {formatCurrency(maxString, { decimalPlaces: token?.decimals })}
            </Text>
          </HStack>
        )} */}

        {/* buttons */}
        {/* {hideControlButton ? null : (
          <HStack>
            <Button
              disabled={disableClickBalance}
              onClick={handleClickMax}
              variant="rect-rounded-radio"
              size="xs"
            >
              {t('input.max_button')}
            </Button>
            <Button
              disabled={disableClickBalance}
              onClick={handleClickHalf}
              variant="rect-rounded-radio"
              size="xs"
            >
              50%
            </Button>
          </HStack>
        )} */}
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
                token={token as undefined}
                size={
                  disableSelectToken
                    ? sizes.disableSelectTokenIconSize
                    : sizes.tokenIcon
                }
              />
            )}
            <Text color={isLight ? colors.secondary : colors.textPrimary}>
              {/* {token?.symbol || ' '} */}
              SOL
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
              sx={{ '& input[inputmode=decimal]': { opacity: 1 } }}
              onChange={(e) => {
                // onChange?.(handleParseVal(e?.currentTarget?.value || ''));
              }}
              onFocus={handleFocus}
              isDisabled={readonly || loading}
              value={formatToRawLocaleStr(value)}
              min={0}
              width={width || '100%'}
              opacity={loading ? 0.2 : 1}
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
            ~
            {formatCurrency(totalPrice, {
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
