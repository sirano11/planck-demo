import styled from '@emotion/styled';
import {
  SuiClient,
  SuiHTTPTransportError,
  getFullnodeUrl,
} from '@mysten/sui/client';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { waitForTransactionReceipt } from '@wagmi/core';
import { ArrowLeftRightIcon, ArrowUpDownIcon, Loader2Icon } from 'lucide-react';
import { NextPage } from 'next';
import { BridgeToken__factory } from 'planck-demo-contracts/typechain/factories/BridgeToken__factory';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Address, formatUnits, parseUnits } from 'viem';
import { useAccount, useWriteContract } from 'wagmi';

import { FeatureHeader } from '@/components/FeatureHeader';
import { useJobStatus } from '@/components/JobStatusContext';
import { TokenSelector } from '@/components/TokenSelector';
import { Button } from '@/components/ui/button';
import { TOKENS } from '@/constants/tokens';
import { config } from '@/constants/wagmi';
import {
  ChainIdentifier,
  HUB_CONTRACT_ADDRESS,
  TOKEN_ADDRESS,
} from '@/helper/eth/config';
import { commit } from '@/helper/eth/hub-builder';
import { CUSTODY, PROTOCOL } from '@/helper/sui/config';
import {
  btc_to_cash,
  btc_to_lmint,
  cash_to_btc,
  lmint_to_btc,
  simulate_btc_to_lmint,
  simulate_lmint_to_btc,
  simulate_swap,
  swap,
} from '@/helper/sui/tx-builder';
import { getCoinObject } from '@/helper/sui/utils';
import { useActorAddress } from '@/hooks/useActorAddress';
import { useTokenAllowances } from '@/hooks/useTokenAllowances';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { toastTransaction } from '@/utils/toast';

const SUI_TOKENS = TOKENS.filter((v) => v.chain === ChainIdentifier.Sui);

const max = (a: bigint, b: bigint) => (a > b ? a : b);

const MintDemoPage: NextPage = () => {
  const [isTxInFlight, setTxInFlight] = useState<boolean>(false);
  const [offerCoinAddress, setOfferCoinAddress] = useState<Address>(
    TOKEN_ADDRESS.wBTC,
  );
  const [askCoinAddress, setAskCoinAddress] = useState<Address>(
    TOKEN_ADDRESS.lMINT,
  );
  const [inputDraft, setInputDraft] = useState<string>('1');
  const [estimation, setEstimation] = useState<string>('0');
  const [tokenBalances, setTokenBalances] = useState<Record<Address, bigint>>(
    {},
  );

  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const { tokenBalances: senderTokenBalances, refresh: refreshTokenBalances } =
    useTokenBalances();
  const { tokenAllowances, refresh: refreshAllowances } = useTokenAllowances();

  const jobStatus = useJobStatus();

  const rpcUrl = getFullnodeUrl('testnet');
  const client = new SuiClient({ url: rpcUrl });

  const offerCoin = useMemo(
    () => TOKENS.find((v) => v.address === offerCoinAddress)!,
    [offerCoinAddress],
  );
  const askCoin = useMemo(
    () => TOKENS.find((v) => v.address === askCoinAddress)!,
    [askCoinAddress],
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAskCoinChange = useCallback(
    (newAskCoin: Address) => {
      if (offerCoinAddress === newAskCoin) {
        setOfferCoinAddress(askCoinAddress);
        setAskCoinAddress(offerCoinAddress);
      } else {
        setAskCoinAddress(newAskCoin);
      }
    },
    [offerCoinAddress, askCoinAddress],
  );

  const handleOfferCoinChange = useCallback(
    (newOfferCoin: Address) => {
      if (askCoinAddress === newOfferCoin) {
        setAskCoinAddress(offerCoinAddress);
        setOfferCoinAddress(askCoinAddress);
      } else {
        setOfferCoinAddress(newOfferCoin);
      }
    },
    [askCoinAddress, offerCoinAddress],
  );

  const { actorAddress, hasError: hasActorFetchError } = useActorAddress({
    address,
    chain: ChainIdentifier.Sui,
  });
  useEffect(() => {
    (async () => {
      if (hasActorFetchError) {
        setTokenBalances(senderTokenBalances);
        return;
      }
      if (!actorAddress) {
        return;
      }

      try {
        const { coinTotal: btcCoinTotal } = await getCoinObject({
          client,
          coinType: CUSTODY.TYPE_ARGUMENT.BTC,
          actorAddress,
        });
        setTokenBalances({
          ...senderTokenBalances,
          [TOKEN_ADDRESS.wBTC]:
            senderTokenBalances[TOKEN_ADDRESS.wBTC] || 0n + btcCoinTotal,
        });
      } catch (e) {
        console.error(e);
        setTokenBalances(senderTokenBalances);
      }
    })();
  }, [actorAddress, hasActorFetchError, senderTokenBalances]);

  useEffect(() => {
    if (jobStatus.state.jobStatus) {
      setTimeout(() => {
        refreshTokenBalances();
      }, 500);
    }
  }, [jobStatus.state.jobStatus]);

  useEffect(() => {
    if (offerCoin.address === askCoin.address) return;
    const inputAtomics = parseUnits(inputDraft, offerCoin.decimals);

    (async () => {
      let est: bigint | null = null;
      if (offerCoin.category === 'wbtc' && askCoin.category === 'lmint') {
        est = await simulate_btc_to_lmint(client, inputAtomics);
      } else if (
        offerCoin.category === 'lmint' &&
        askCoin.category === 'wbtc'
      ) {
        est = await simulate_lmint_to_btc(client, inputAtomics);
      } else if (offerCoin.category === 'wbtc' && askCoin.category === 'cash') {
        est = await simulate_swap(
          client,
          await simulate_btc_to_lmint(client, inputAtomics),
          PROTOCOL.TYPE_ARGUMENT.LIQUID_MINT,
          askCoin.typeArgument!,
        );
      } else if (offerCoin.category === 'cash' && askCoin.category === 'wbtc') {
        est = await simulate_lmint_to_btc(
          client,
          await simulate_swap(
            client,
            inputAtomics,
            offerCoin.typeArgument!,
            PROTOCOL.TYPE_ARGUMENT.LIQUID_MINT,
          ),
        );
      } else {
        est = await simulate_swap(
          client,
          inputAtomics,
          offerCoin.typeArgument!,
          askCoin.typeArgument!,
        );
      }

      if (est === null) {
        setEstimation('0');
        setErrorMessage(null);
        return;
      }

      setEstimation(formatUnits(est, askCoin.decimals));
      setErrorMessage(null);
    })().catch((err) => {
      const error = err as SuiHTTPTransportError;

      // Reset estimation
      setEstimation('0');

      // other reasons
      if (!error.message.startsWith('response error:')) {
        setErrorMessage(error.message);
        return;
      }

      // contract error
      const errorCode = error.message.match(/Some\((\d+)\)/)?.[1];
      const knownErrorsByModule = {
        market: [
          'NotSupportedCoinType', // ENotSupportedCoinType
          'InvalidCoinType', // EInvalidCoinType
          'InvalidMath', // EInvalidMath
        ],
        oracle: [
          '', // ErrorPrevoteNotFound
          '', // ErrorVoteHashInvalid
          '', // ErrorVoteDataInvalid
          '', // ErrorVotesNotFound
          'InvalidExchangeRate', // ErrorInvalidExchangeRate
        ],
        pilgrim: [
          'Too small input amount (RoundIn <= 0)', // ERoundInShouldBePositive
          'BaseIn <= 0', // EBaseInShouldBePositive
          'RoundOut <= 0', // ERoundOutShouldBePositive
          'BaseOut <= 0', // EBaseOutShouldBePositive
          'BaseIn > Max', // EBaseInIsGreaterThanMax
          'BaseOut < Min', // EBaseOutIsLessThanMin
          'RoundIn > Max', // ERoundInIsGreaterThanMax
          'RoundOut < Min', // ERoundOutIsLessThanMin
          'N < 0', // ENShouldBeNonnegative
          'BaseOut > Reserve', // EBaseOutIsGreaterThanReserve
        ],
      };
      const knownErrors = error.message.includes('market::')
        ? knownErrorsByModule.market
        : error.message.includes('oracle::')
          ? knownErrorsByModule.oracle
          : error.message.includes('pilgrim::')
            ? knownErrorsByModule.pilgrim
            : [];
      const knownError =
        (errorCode && knownErrors[parseInt(errorCode, 10)]) || null;

      if (knownError) {
        setErrorMessage(`Contract Error: ${knownError}`);
      } else {
        setErrorMessage('Unknown Contract Error');
      }
    });
  }, [inputDraft, offerCoin, askCoin]);

  const hasEnoughAllowance = useMemo(() => {
    try {
      return (
        (tokenAllowances[offerCoin.address] &&
          tokenAllowances[offerCoin.address] >=
            parseUnits(inputDraft, offerCoin.decimals)) ||
        false
      );
    } catch (e) {
      return false;
    }
  }, [tokenAllowances, inputDraft, offerCoin]);

  const hasEnoughBalance = useMemo(() => {
    try {
      return (
        (tokenBalances[offerCoin.address] &&
          tokenBalances[offerCoin.address] >=
            parseUnits(inputDraft, offerCoin.decimals)) ||
        false
      );
    } catch (e) {
      return false;
    }
  }, [tokenBalances, inputDraft, offerCoin]);

  const { writeContractAsync } = useWriteContract();
  const onClickApprove = useCallback(() => {
    if (hasEnoughAllowance) {
      return;
    }

    setTxInFlight(true);

    const promise = (async () => {
      const amount = parseUnits(inputDraft, offerCoin.decimals);

      const hash = await writeContractAsync({
        address: offerCoin.address,
        abi: BridgeToken__factory.abi,
        functionName: 'approve',
        args: [HUB_CONTRACT_ADDRESS, amount],
      });

      return waitForTransactionReceipt(config, { hash });
    })();

    toastTransaction(promise).finally(() => {
      setTxInFlight(false);
      refreshAllowances();
    });
  }, [
    hasEnoughAllowance,
    inputDraft,
    offerCoin,
    writeContractAsync,
    refreshAllowances,
  ]);

  const onClickSwap = useCallback(async () => {
    if (!actorAddress) {
      console.error('No actor address found');
      return;
    }

    setTxInFlight(true);

    try {
      const offer = TOKENS.find((v) => v.address === offerCoinAddress)!;
      const ask = TOKENS.find((v) => v.address === askCoinAddress)!;
      const inputAtomics = parseUnits(inputDraft, offer.decimals);

      const { coinObjectIds: offerCoinObjectIds, coinTotal: offerCoinTotal } =
        await getCoinObject({
          client,
          coinType: offer.typeArgument!,
          actorAddress,
        });

      if (offer.category !== 'wbtc' && offerCoinObjectIds.length === 0) {
        console.error('No coin found in actor wallet');
        toast.error('Error: no coin found in actor wallet');
        setTxInFlight(false);
        return;
      }

      let rawTx: Uint8Array | undefined;
      let assetAmount = inputAtomics;
      if (offer.category === 'wbtc' && ask.category === 'lmint') {
        assetAmount = max(inputAtomics - offerCoinTotal, 0n);
        rawTx = await btc_to_lmint(
          client,
          offerCoinObjectIds,
          inputAtomics,
          assetAmount,
          0n,
          actorAddress,
        );
      } else if (offer.category === 'lmint' && ask.category === 'wbtc') {
        rawTx = await lmint_to_btc(
          client,
          offerCoinObjectIds,
          inputAtomics,
          0n,
          actorAddress,
        );
      } else if (offer.category === 'wbtc' && ask.category === 'cash') {
        assetAmount = max(inputAtomics - offerCoinTotal, 0n);
        rawTx = await btc_to_cash(
          client,
          offerCoinObjectIds,
          inputAtomics,
          assetAmount,
          ask.supplyId!,
          ask.typeArgument!,
          actorAddress,
        );
      } else if (offer.category === 'cash' && ask.category === 'wbtc') {
        rawTx = await cash_to_btc(
          client,
          offerCoinObjectIds,
          inputAtomics,
          offer.supplyId!,
          offer.typeArgument!,
          actorAddress,
        );
      } else {
        rawTx = await swap(
          client,
          offer.supplyId!,
          ask.supplyId!,
          offerCoinObjectIds,
          inputAtomics,
          offer.typeArgument!,
          ask.typeArgument!,
          actorAddress,
        );
      }

      const promise = (async () => {
        const hash = await commit(
          HUB_CONTRACT_ADDRESS,
          offerCoinAddress,
          assetAmount,
          ChainIdentifier.Sui,
          rawTx,
        );

        jobStatus.dispatch({ type: 'SET_JOB_HASH', payload: hash });

        return waitForTransactionReceipt(config, { hash });
      })();

      toastTransaction(promise);
    } catch (e) {
      // error while constructing tx
      console.error(e);
      toast.error('Error while constructing transaction');
    } finally {
      setTxInFlight(false);
    }
  }, [actorAddress, inputDraft, offerCoinAddress, askCoinAddress]);

  const [isCTADisabled, ctaTitle] = useMemo(() => {
    let disabled: boolean = false;
    let title: React.ReactNode = 'Swap';

    if (isTxInFlight) {
      disabled = true;
      title = (
        <Loader2Icon size={32} className="animate-spin" strokeWidth={2.2} />
      );
    } else if (offerCoinAddress === askCoinAddress) {
      disabled = true;
      title = 'Invalid Route';
    } else if (!hasEnoughBalance) {
      disabled = true;
      title = 'Insufficient Balance';
    } else if (!!errorMessage) {
      disabled = true;
      title = 'Estimation Failed';
    } else if (!hasEnoughAllowance) {
      title = `Approve ${offerCoin.symbol}`;
    } else if (offerCoinAddress === TOKEN_ADDRESS.wBTC) {
      title = 'Deposit';
    } else if (askCoinAddress === TOKEN_ADDRESS.wBTC) {
      title = 'Withdraw';
    }

    if (!isConnected) {
      disabled = false;
      title = 'Connect Wallet';
    }

    return [disabled, title];
  }, [
    isConnected,
    isTxInFlight,
    offerCoinAddress,
    askCoinAddress,
    hasEnoughBalance,
    hasEnoughAllowance,
    errorMessage,
  ]);

  const onClickCTA = useMemo(() => {
    if (!isConnected) {
      return openConnectModal;
    }
    if (isCTADisabled) {
      return undefined;
    }
    if (!hasEnoughAllowance) {
      return onClickApprove;
    }
    return onClickSwap;
  }, [
    isConnected,
    isCTADisabled,
    hasEnoughAllowance,
    openConnectModal,
    onClickApprove,
    onClickSwap,
  ]);

  return (
    <div className="my-[80px] w-full max-w-[600px] mx-auto gap-[10px] flex flex-col">
      <FeatureHeader icon={<ArrowLeftRightIcon size={20} />}>
        {/* */}
        Swap
      </FeatureHeader>

      <div className="mt-8 w-full max-w-[525px] flex flex-col gap-[10px] mx-auto">
        <TokenInputContainer>
          <div className="flex items-center gap-4">
            <div className="flex flex-col w-full">
              <Field htmlFor="from-token">
                {offerCoinAddress === TOKEN_ADDRESS.wBTC
                  ? 'You deposit'
                  : 'You burn'}
              </Field>
              <Input
                id="from-token"
                value={inputDraft}
                onChange={(e) => {
                  let value = e.target.value

                    // Only allow numbers and dot
                    .replace(/[^0-9.]/g, '')

                    // Ensure only one dot
                    .replace(/(\.[\d]*?)\..*/g, '$1')

                    .trim();

                  setInputDraft(value);
                }}
              />
            </div>
            <TokenSelector
              id="offer"
              selectedToken={offerCoin}
              tokens={SUI_TOKENS}
              onChange={handleOfferCoinChange}
              tokenBalances={tokenBalances}
            />

            <ChangeDirectionButton
              onClick={() => {
                // change (swap) between offer and ask
                setOfferCoinAddress(askCoinAddress);
                setAskCoinAddress(offerCoinAddress);

                setInputDraft(estimation);
              }}
            >
              <ArrowUpDownIcon size={24} />
            </ChangeDirectionButton>
          </div>
          <div className="w-full flex items-center justify-between">
            {/* TODO: Show token valuation */}
            <span />

            <TokenBalance>
              Balance:{' '}
              <button
                className="underline"
                onClick={() => {
                  setInputDraft(
                    formatUnits(
                      tokenBalances[offerCoinAddress] ?? 0n,
                      offerCoin.decimals,
                    ),
                  );
                }}
              >
                {typeof tokenBalances[offerCoinAddress] === 'undefined'
                  ? '-'
                  : formatUnits(
                      tokenBalances[offerCoinAddress],
                      offerCoin.decimals,
                    )}
              </button>
            </TokenBalance>
          </div>
        </TokenInputContainer>

        <TokenInputContainer>
          <div className="flex items-center gap-4">
            <div className="flex flex-col w-full">
              <Field htmlFor="to-token">
                {askCoinAddress === TOKEN_ADDRESS.wBTC
                  ? 'You receive'
                  : 'You mint'}
              </Field>
              <Input id="to-token" value={estimation} disabled />
            </div>
            <TokenSelector
              id="ask"
              selectedToken={askCoin}
              tokens={SUI_TOKENS}
              onChange={handleAskCoinChange}
              tokenBalances={tokenBalances}
            />
          </div>
          <div className="w-full flex items-center justify-between">
            {/* TODO: Show token valuation */}
            <span />

            <TokenBalance>
              Balance:{' '}
              <button
                className="underline"
                onClick={() => {
                  // change (swap) between offer and ask
                  setOfferCoinAddress(askCoinAddress);
                  setAskCoinAddress(offerCoinAddress);

                  setInputDraft(
                    formatUnits(
                      tokenBalances[askCoinAddress] ?? 0n,
                      askCoin.decimals,
                    ),
                  );
                }}
              >
                {typeof tokenBalances[askCoinAddress] === 'undefined'
                  ? '-'
                  : formatUnits(
                      tokenBalances[askCoinAddress],
                      askCoin.decimals,
                    )}
              </button>
            </TokenBalance>
          </div>
        </TokenInputContainer>

        <Button
          disabled={isCTADisabled}
          onClick={onClickCTA}
          className="w-full h-[64px] py-0 text-[22px] font-bold bg-emerald-300 hover:bg-emerald-400 text-slate-800 rounded-[12px] transition-colors duration-200"
        >
          {ctaTitle}
        </Button>

        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </div>
    </div>
  );
};

export default MintDemoPage;

const TokenInputContainer = styled.div`
  width: 100%;
  padding: 14px;
  background-color: #f1f5f9;

  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;

  border-radius: 16px;

  .dark & {
    background-color: #334155;
  }
`;

const CHANGE_DIRECTION_BUTTON_SIZE = 52;
const ChangeDirectionButton = styled.button`
  width: ${CHANGE_DIRECTION_BUTTON_SIZE}px;
  height: ${CHANGE_DIRECTION_BUTTON_SIZE}px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: ${CHANGE_DIRECTION_BUTTON_SIZE / -2}px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #fff;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
  color: #8a8f9d;
  box-shadow: 0px 6px 18px 0px rgba(222, 225, 240, 0.6);
  &:hover {
    transform: translateX(-50%) rotate(180deg);
  }
  .dark & {
    background-color: #1e2a3b;
    color: #94a3b8;
    box-shadow: 0px 6px 18px 0px rgba(30, 41, 59, 0.6);
  }
`;

const Field = styled.label`
  font-size: 19px;
  font-weight: 500;
  letter-spacing: -0.5px;
  color: #8a8f9d;

  .dark & {
    color: #d3dce9;
  }
`;

const Input = styled.input`
  width: 100%;
  flex: 1;
  border: 0;
  background-color: transparent;

  font-size: 28px;
  font-weight: 700;
  letter-spacing: -1.5px;

  color: #2b3b38;

  .dark & {
    color: #fff;
  }
`;

const TokenBalance = styled.span`
  color: #8a8f9d;
  text-align: right;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.593px;

  .dark & {
    color: #94a3b8;
  }
`;

const ErrorMessage = styled.span`
  margin-top: 10px;
  padding: 18px 16px;

  border-radius: 12px;
  background-color: #f05366;

  font-weight: 500;
  font-size: 18px;
  line-height: 100%;
  color: white;
`;
