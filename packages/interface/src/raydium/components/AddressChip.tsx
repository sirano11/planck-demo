import {
  Box,
  Flex,
  FlexProps,
  Text,
  TextProps,
  useClipboard,
} from '@chakra-ui/react';
import { ReactNode } from 'react';

import CircleCheck from '@/raydium/icons/misc/CircleCheck';
import CopyIcon from '@/raydium/icons/misc/CopyIcon';
import ExternalLink from '@/raydium/icons/misc/ExternalLink';
import { SvgIcon } from '@/raydium/icons/type';

// import { supportedExplorers, useAppStore } from '@/raydium/store/useAppStore';

type RawAddressChipProps = {
  address?: string;

  renderLabel?: ReactNode;
  /** ability */
  canCopy?: boolean;
  showCopyIcon?: boolean;
  /** ability */
  canExternalLink?: boolean;

  showDigitCount?: number | 'all';
  addressType?: 'token' | 'account';
  iconRowClassName?: string;
  onCopied?(text: string): void; // TODO: imply it

  textProps?: TextProps;
  iconProps?: SvgIcon;
};

/** default size is 'sm' */
type TokenAddressChipProps = RawAddressChipProps &
  Omit<FlexProps, keyof RawAddressChipProps>;

/**
 * component a token address chip shortcut
 */
export default function AddressChip({
  iconProps,
  textProps,

  renderLabel,

  address,
  canCopy = true,
  showCopyIcon = canCopy,
  canExternalLink = false,

  showDigitCount = 6,
  onCopied,

  ...restProps
}: TokenAddressChipProps) {
  // const explorerUrl = useAppStore((s) => s.explorerUrl);
  const copyContent = address ?? '';
  const { onCopy: copy, hasCopied } = useClipboard(copyContent);
  return (
    <Flex alignItems="center" gap={2} {...restProps}>
      {renderLabel}

      <Text {...textProps}>
        {showDigitCount === 'all'
          ? address
          : `${address?.slice(0, showDigitCount)}...${address?.slice(-1 * showDigitCount)}`}
      </Text>

      <Flex alignItems="center">
        {showCopyIcon && (
          <Box
            cursor={hasCopied ? 'default' : 'pointer'}
            onClick={
              hasCopied
                ? undefined
                : () => {
                    copy();
                    onCopied?.(copyContent);
                  }
            }
          >
            {hasCopied ? (
              <CircleCheck color={'currentColor'} {...iconProps} />
            ) : (
              <CopyIcon color={'currentColor'} {...iconProps} />
            )}
          </Box>
        )}
        {canExternalLink && address && (
          <a
            href={
              // explorerUrl === supportedExplorers[0]?.host
              //   ? `${explorerUrl}/token/${address}`
              //   : `${explorerUrl}/address/${address}`
              '#'
            }
            rel="noreferrer"
            target="_blank"
          >
            <Box cursor="pointer">
              <ExternalLink color={'currentColor'} {...iconProps} />
            </Box>
          </a>
        )}
      </Flex>
    </Flex>
  );
}
