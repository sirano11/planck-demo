import {
  Button,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import Decimal from 'decimal.js';
import React, { KeyboardEvent, useCallback, useEffect, useState } from 'react';

import DecimalInput from '@/raydium/components/DecimalInput';
import { useEvent } from '@/raydium/hooks/useEvent';
import WarningIcon from '@/raydium/icons/misc/WarningIcon';
// import { SLIPPAGE_KEY, useAppStore } from '@/raydium/store/useAppStore';
import { colors } from '@/raydium/theme/cssVariables';
import { setStorageItem } from '@/raydium/utils/localStorage';
import { formatToRawLocaleStr } from '@/raydium/utils/numberish/formatter';
import toPercentString from '@/raydium/utils/numberish/toPercentString';

export function SlippageSettingModal(props: {
  isOpen: boolean;
  onClose: () => void;
}) {
  // const slippage = useAppStore((s) => s.slippage);
  const [currentSlippage, setCurrentSlippage] = useState<string>(
    // String(slippage * 100),
    '100',
  );
  const [isFirstFocused, setIsFirstFocused] = useState(false);
  const handleChange = useEvent((val: string | number) => {
    setIsFirstFocused(false);
    setCurrentSlippage(String(val));
  });
  const handleUpdateSlippage = useEvent((val: string | number) => {
    const setVal = Number(val ?? 0) / 100;
    // setStorageItem(SLIPPAGE_KEY, setVal);
    // useAppStore.setState({ slippage: setVal }, false, {
    //   type: 'SlippageToleranceSettingField',
    // });
  });
  const handleBlur = useEvent(() => {
    setIsFirstFocused(false);
    if (!currentSlippage) handleChange(0);
  });
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
      }
    },
    [],
  );
  const handleFocus = useEvent(() => {
    setIsFirstFocused(true);
  });

  const handleSaveFee = useEvent(() => {
    handleUpdateSlippage(currentSlippage || 0);
    props.onClose();
  });

  // useEffect(() => {
  //   setCurrentSlippage(String(slippage * 100));
  // }, [slippage, props.isOpen]);

  const slippageDecimal = new Decimal(currentSlippage || 0);
  const isForerun = slippageDecimal.gt('0.5');
  const isFailrun = slippageDecimal.lt('0.1');
  const isWarn = isForerun || isFailrun;
  const warnText = isForerun
    ? 'Your transaction may be frontrun and result in an unfavorable trade'
    : isFailrun
      ? 'Your transaction may fail'
      : '';

  return (
    <Modal size={'md'} isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay />
      <ModalContent
        borderRadius="20px"
        border={`1px solid ${colors.backgroundDark}`}
        boxShadow="0px 8px 48px 0px #4F53F31A"
        paddingInline="2rem"
        py="2rem"
      >
        <ModalHeader marginTop={0} marginBottom={'48px'}>
          <HStack spacing="6px">
            <Text>Slippage Tolerance</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack gap={4} alignItems="flex-start">
            <Flex
              rowGap={2}
              flexWrap={['wrap', 'unset']}
              justifyContent="space-between"
              w="full"
            >
              <Flex gap="2">
                {[0.1, 0.5, 1].map((v) => (
                  <Button
                    key={v}
                    size={'sm'}
                    isActive={Number(currentSlippage) == v}
                    variant="capsule-radio"
                    onClick={() => {
                      handleChange(v);
                    }}
                  >
                    {formatToRawLocaleStr(toPercentString(v))}
                  </Button>
                ))}
              </Flex>
              <Flex alignItems="center" rounded="full">
                <Text
                  fontSize="xs"
                  whiteSpace={'nowrap'}
                  color={colors.textSecondary}
                >
                  Custom
                </Text>
                <DecimalInput
                  variant="filledDark"
                  value={isFirstFocused ? '' : currentSlippage}
                  placeholder={currentSlippage}
                  max={50}
                  decimals={2}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onFocus={handleFocus}
                  inputSx={{
                    textAlign: 'right',
                    rounded: '40px',
                    h: '36px',
                    w: '70px',
                    py: 0,
                    px: '3',
                  }}
                />
                <Text fontSize="xs" color={colors.textSecondary}>
                  %
                </Text>
              </Flex>
            </Flex>
            {isWarn ? (
              <Flex
                px={4}
                py={2}
                bg={colors.warnButtonLightBg}
                color={colors.semanticWarning}
                fontSize="sm"
                fontWeight="medium"
                borderRadius="8px"
                w="full"
              >
                <Text pt={0.5}>
                  <WarningIcon />
                </Text>
                <Text pl={2}>{warnText}</Text>
              </Flex>
            ) : null}
            <Button
              w="full"
              rounded="lg"
              background={colors.solidButtonBg}
              isDisabled={Number(currentSlippage) <= 0}
              onClick={handleSaveFee}
            >
              <Text
                fontSize="md"
                fontWeight="medium"
                bgClip="text"
                color={colors.buttonSolidText}
              >
                Save
              </Text>
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
