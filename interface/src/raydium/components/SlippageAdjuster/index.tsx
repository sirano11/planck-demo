import { Button, Flex } from '@chakra-ui/react';
import Decimal from 'decimal.js';
import React, { useEffect, useState } from 'react';

import { useDisclosure } from '@/raydium/hooks/useDelayDisclosure';
import MoreListControllers from '@/raydium/icons/misc/MoreListControllers';
// import { useAppStore } from '@/raydium/store/useAppStore';
import { colors } from '@/raydium/theme/cssVariables';

import { SlippageSettingModal } from './SlippageSettingModal';

export function SlippageAdjuster({ onClick }: { onClick?: () => void }) {
  const { isOpen, onClose, onToggle } = useDisclosure();
  // const slippage = useAppStore((s) => s.slippage);
  const [currentSlippage, setCurrentSlippage] = useState<string | undefined>();
  const [isWarn, setIsWarn] = useState(false);

  // useEffect(() => {
  //   const newSlippage = String(slippage * 100);
  //   setCurrentSlippage(newSlippage);
  //   const slippageDecimal = new Decimal(newSlippage);
  //   const warn = slippageDecimal.gt('0.5') || slippageDecimal.lt('0.1');
  //   setIsWarn(warn);
  // }, [slippage]);
  const handleOnClick = () => {
    onToggle();
  };
  return (
    <>
      <Flex align="center" onClick={onClick || handleOnClick}>
        <Button
          size="xs"
          height="fit-content"
          py={1}
          px={2}
          borderRadius="full"
          bg={isWarn ? colors.warnButtonBg : colors.buttonBg01}
          color={isWarn ? colors.semanticWarning : colors.textSecondary}
          fontSize={'sm'}
          fontWeight="normal"
          border={
            isWarn
              ? `1px solid ${colors.semanticWarning}`
              : '1px solid transparent'
          }
          _hover={{
            borderColor: colors.secondary,
            color: colors.secondary,
            bg: colors.buttonBg01,
            '.chakra-icon-hover': {
              fill: colors.secondary,
            },
          }}
          _focus={{ boxShadow: 'outline' }}
          iconSpacing={1}
          leftIcon={
            <MoreListControllers
              width="14"
              height="14"
              className="chakra-icon chakra-icon-hover"
              color={isWarn ? colors.semanticWarning : colors.textSecondary}
            />
          }
          variant={'ghost'}
        >
          {currentSlippage}%
        </Button>
      </Flex>
      <SlippageSettingModal isOpen={isOpen} onClose={onClose} />
    </>
  );
}
