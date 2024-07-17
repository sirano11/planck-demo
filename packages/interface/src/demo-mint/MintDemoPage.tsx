import styled from '@emotion/styled';
import {
  SuiClient,
  SuiHTTPTransportError,
  getFullnodeUrl,
} from '@mysten/sui/client';
import { waitForTransactionReceipt } from '@wagmi/core';
import axios from 'axios';
import { NextPage } from 'next';
import { BridgeToken__factory } from 'planck-demo-contracts/typechain/factories/BridgeToken__factory';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Address, formatUnits, parseUnits } from 'viem';
import { useAccount, useWriteContract } from 'wagmi';

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
import { PROTOCOL } from '@/helper/sui/config';
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
import { useTokenAllowances } from '@/hooks/useTokenAllowances';
import { useTokenBalances } from '@/hooks/useTokenBalances';

const SUI_TOKENS = TOKENS.filter((v) => v.chain === ChainIdentifier.Sui);

const MintDemoPage: NextPage = () => {
  const [offerCoinAddress, setOfferCoinAddress] = useState<Address>(
    TOKEN_ADDRESS.wBTC,
  );
  const [askCoinAddress, setAskCoinAddress] = useState<Address>(
    TOKEN_ADDRESS.lMINT,
  );
  const [inputDraft, setInputDraft] = useState<string>('1');
  const [estimation, setEstimation] = useState<string>('0');

  const { address } = useAccount();
  const { tokenBalances } = useTokenBalances();
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

  useEffect(() => {
    const parsedInput = parseFloat(inputDraft);
    if (isNaN(parsedInput) || parsedInput <= 0) {
      setEstimation('0');
      setErrorMessage(null);
      return;
    }

    if (offerCoin.address === askCoin.address) return;

    (async () => {
      const inputAtomics = parseUnits(
        parsedInput.toString(),
        offerCoin.decimals,
      );

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

      // other reasons
      if (!error.message.startsWith('response error:')) {
        setErrorMessage(error.message);
        return;
      }

      // contract error
      const errorCode = error.message.match(/Some\((\d+)\)/)?.[1];
      const knownErrorsByModule = {
        market: ['NotSupportedCoinType', 'InvalidCoinType', 'InvalidMath'],
        oracle: [
          '_', // ErrorWrongEpoch
          'InvalidExchangeRate', // ErrorInvalidExchangeRate
        ],
      };
      const knownErrors = error.message.includes('market::')
        ? knownErrorsByModule.market
        : error.message.includes('oracle::')
          ? knownErrorsByModule.oracle
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
        tokenAllowances[offerCoin.address] &&
        tokenAllowances[offerCoin.address] >=
          parseUnits(inputDraft, offerCoin.decimals)
      );
    } catch (e) {
      return false;
    }
  }, [tokenAllowances, inputDraft, offerCoin]);

  const { writeContractAsync } = useWriteContract();
  const onClickApprove = useCallback(() => {
    if (hasEnoughAllowance) {
      return;
    }
    (async () => {
      const amount = parseUnits(inputDraft, offerCoin.decimals);

      const hash = await writeContractAsync({
        address: offerCoin.address,
        abi: BridgeToken__factory.abi,
        functionName: 'approve',
        args: [HUB_CONTRACT_ADDRESS, amount],
      });

      const receipt = await waitForTransactionReceipt(config, { hash });

      // TODO: Toast Result
      console.log({ receipt });
    })()
      .catch((err) => {
        // TODO: Toast Failure
        console.error(err);
      })
      .finally(() => refreshAllowances());
  }, [
    hasEnoughAllowance,
    inputDraft,
    offerCoin,
    writeContractAsync,
    refreshAllowances,
  ]);

  const onClickSwap = useCallback(async () => {
    const parsedInput = parseFloat(inputDraft);
    if (isNaN(parsedInput)) {
      return;
    }

    const offer = TOKENS.find((v) => v.address === offerCoinAddress)!;
    const ask = TOKENS.find((v) => v.address === askCoinAddress)!;
    const inputAtomics = parseUnits(parsedInput.toString(), offer.decimals);

    const { actorAddress } = (
      await axios.get<{ actorAddress: string }>('/api/actor', {
        params: { address, chain: 'sui' },
      })
    ).data;

    const { coinObjectIds: offerCoinObjectIds, coinTotal: offerCoinTotal } =
      await getCoinObject({
        client,
        coinType: offer.typeArgument!,
        actorAddress,
      });

    if (offer.category !== 'wbtc' && offerCoinObjectIds.length === 0) {
      console.error('No coin found in actor wallet');
      return;
    }

    let rawTx: Uint8Array | undefined;
    if (offer.category === 'wbtc' && ask.category === 'lmint') {
      rawTx = await btc_to_lmint(
        client,
        offerCoinObjectIds,
        offerCoinTotal,
        inputAtomics,
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
      rawTx = await btc_to_cash(
        client,
        offerCoinObjectIds,
        offerCoinTotal,
        inputAtomics,
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

    try {
      const hash = await commit(
        HUB_CONTRACT_ADDRESS,
        offerCoinAddress,
        inputAtomics,
        ChainIdentifier.Sui,
        rawTx,
      );

      jobStatus.dispatch({ type: 'SET_JOB_HASH', payload: hash });

      await waitForTransactionReceipt(config, { hash });
    } catch (e) {
      console.error(e);
    }
  }, [inputDraft, offerCoinAddress, askCoinAddress]);

  return (
    <div
      className={`w-full min-h-screen bg-background flex justify-center items-center`}
    >
      <div className="w-full max-w-[525px] mx-auto gap-[10px] flex flex-col">
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
          disabled={offerCoinAddress === askCoinAddress}
          onClick={
            offerCoinAddress === askCoinAddress
              ? undefined
              : !hasEnoughAllowance
                ? onClickApprove
                : onClickSwap
          }
          className="w-full py-8 text-[22px] font-bold bg-emerald-300 hover:bg-emerald-400 text-slate-800 rounded-[12px] transition-colors duration-200"
        >
          {offerCoinAddress === askCoinAddress
            ? 'Invalid Route'
            : !hasEnoughAllowance
              ? `Approve ${offerCoin.symbol}`
              : offerCoinAddress === TOKEN_ADDRESS.wBTC
                ? 'Deposit'
                : askCoinAddress === TOKEN_ADDRESS.wBTC
                  ? 'Withdraw'
                  : 'Swap'}
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

  font-size: 36px;
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
