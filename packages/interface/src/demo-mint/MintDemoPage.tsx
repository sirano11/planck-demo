import styled from '@emotion/styled';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { NextPage } from 'next';
import { useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'viem';

import { TokenSelector } from '@/components/TokenSelector';
import { Button } from '@/components/ui/button';
import { CONTRACTS, TOKENS } from '@/constants';
import { PROTOCOL } from '@/helper/sui/config';
import {
  simulate_btc_to_lmint,
  simulate_lmint_to_btc,
  simulate_swap,
} from '@/helper/sui/tx-builder';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { atomicsFromFloat, formatRawAmount } from '@/utils/format';

const MintDemoPage: NextPage = () => {
  const [offerCoinAddress, setOfferCoinAddress] = useState<`0x${string}`>(
    CONTRACTS.wBTC,
  );
  const [askCoinAddress, setAskCoinAddress] = useState<`0x${string}`>(
    CONTRACTS.lMINT,
  );
  const [inputDraft, setInputDraft] = useState<string>('1');
  const [estimation, setEstimation] = useState<string>('0');

  const { tokenBalances } = useTokenBalances();

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

  useEffect(() => {
    const parsedInput = parseFloat(inputDraft);
    if (isNaN(parsedInput)) {
      setEstimation('0');
      return;
    }
    if (parsedInput <= 0) {
      setEstimation('0');
      return;
    }

    if (offerCoin.address === askCoin.address) return;

    // TODO: Add error handling on simulation failure
    (async () => {
      const inputAtomics = atomicsFromFloat(parsedInput);

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
        return;
      }

      setEstimation(formatRawAmount(est.toString()));
    })();
  }, [inputDraft, offerCoin, askCoin]);

  return (
    <div
      className={`w-full min-h-screen bg-background flex justify-center items-center`}
    >
      <div className="w-full max-w-[525px] mx-auto gap-[10px] flex flex-col">
        <TokenInputContainer>
          <div className="flex items-center gap-4">
            <div className="flex flex-col w-full">
              <Field htmlFor="from-token">
                {offerCoinAddress === CONTRACTS.wBTC
                  ? 'You deposit'
                  : 'You burn'}
              </Field>
              <Input
                id="from-token"
                value={inputDraft}
                onChange={(e) => setInputDraft(e.target.value)}
              />
            </div>
            <TokenSelector
              id="offer"
              selectedToken={offerCoin}
              tokens={TOKENS}
              onChange={setOfferCoinAddress}
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
                {askCoinAddress === CONTRACTS.wBTC ? 'You receive' : 'You mint'}
              </Field>
              <Input id="to-token" value={estimation} disabled />
            </div>
            <TokenSelector
              id="ask"
              selectedToken={askCoin}
              tokens={TOKENS}
              onChange={setAskCoinAddress}
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

        <Button className="w-full py-8 text-[22px] font-bold bg-emerald-300 hover:bg-emerald-400 text-slate-800    rounded-[12px] transition-colors duration-200">
          {offerCoinAddress === askCoinAddress
            ? 'Invalid Route'
            : offerCoinAddress === CONTRACTS.wBTC
              ? 'Deposit'
              : askCoinAddress === CONTRACTS.wBTC
                ? 'Withdraw'
                : 'Swap'}
        </Button>
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
