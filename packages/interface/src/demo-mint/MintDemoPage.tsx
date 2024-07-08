import styled from '@emotion/styled';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { NextPage } from 'next';
import { useEffect, useState } from 'react';

import { TokenSelector } from '@/components/TokenSelector';
import { Button } from '@/components/ui/button';
import { CONTRACTS, TOKENS } from '@/constants/tokens';
import { PROTOCOL } from '@/helper/sui/config';
import {
  simulate_btc_to_lmint,
  simulate_lmint_to_btc,
  simulate_swap,
} from '@/helper/sui/tx-builder';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { atomicsFromFloat, formatRawAmount } from '@/utils/format';

const MintDemoPage: NextPage = () => {
  const [offerCoinAddress, setOfferCoinAddress] = useState<string>(
    CONTRACTS.wBTC,
  );
  const [askCoinAddress, setAskCoinAddress] = useState<string>(CONTRACTS.lMINT);
  const [inputDraft, setInputDraft] = useState<string>('1');
  const [estimation, setEstimation] = useState<string>('0');

  const { tokenBalances } = useTokenBalances();

  const rpcUrl = getFullnodeUrl('testnet');
  const client = new SuiClient({ url: rpcUrl });

  useEffect(() => {
    const parsedInput = parseFloat(inputDraft);
    if (isNaN(parsedInput)) {
      setEstimation('0');
      return;
    }

    if (offerCoinAddress === askCoinAddress) return;

    (async () => {
      const inputAtomics = atomicsFromFloat(parsedInput);

      const offer = TOKENS.find((v) => v.address === offerCoinAddress)!;
      const ask = TOKENS.find((v) => v.address === askCoinAddress)!;

      let est: bigint | null = null;
      if (offer.category === 'wbtc' && ask.category === 'lmint') {
        est = await simulate_btc_to_lmint(client, inputAtomics);
      } else if (offer.category === 'lmint' && ask.category === 'wbtc') {
        est = await simulate_lmint_to_btc(client, inputAtomics);
      } else if (offer.category === 'wbtc' && ask.category === 'cash') {
        est = await simulate_swap(
          client,
          await simulate_btc_to_lmint(client, inputAtomics),
          PROTOCOL.TYPE_ARGUMENT.LIQUID_MINT,
          ask.typeArgument!,
        );
      } else if (offer.category === 'cash' && ask.category === 'wbtc') {
        est = await simulate_lmint_to_btc(
          client,
          await simulate_swap(
            client,
            inputAtomics,
            offer.typeArgument!,
            PROTOCOL.TYPE_ARGUMENT.LIQUID_MINT,
          ),
        );
      } else {
        est = await simulate_swap(
          client,
          inputAtomics,
          offer.typeArgument!,
          ask.typeArgument!,
        );
      }

      if (est === null) {
        setEstimation('0');
        return;
      }

      setEstimation(formatRawAmount(est.toString()));
    })();
  }, [inputDraft, offerCoinAddress, askCoinAddress]);

  return (
    <div
      className={`w-full min-h-screen bg-background flex justify-center items-center`}
    >
      <div className="w-full max-w-[525px] mx-auto gap-[10px] flex flex-col">
        <div className="flex items-center w-full gap-4 px-3.5 py-3.5 bg-slate-100 dark:bg-slate-700 rounded-2xl">
          <div className="flex flex-col w-full">
            <Field htmlFor="from-token">
              {offerCoinAddress === 'wbtc' ? 'You deposit' : 'You burn'}
            </Field>
            <Input
              id="from-token"
              value={inputDraft}
              onChange={(e) => setInputDraft(e.target.value)}
            />
          </div>
          <TokenSelector
            id="offer"
            selectedToken={TOKENS.find((v) => v.address === offerCoinAddress)!}
            tokens={TOKENS}
            onChange={setOfferCoinAddress}
            tokenBalances={tokenBalances}
          />
        </div>

        <div className="flex items-center w-full gap-4 px-3.5 py-3.5 bg-slate-100 dark:bg-slate-700 rounded-2xl">
          <div className="flex flex-col w-full">
            <Field htmlFor="to-token">
              {askCoinAddress === 'wbtc' ? 'You receive' : 'You mint'}
            </Field>
            <Input id="to-token" value={estimation} disabled />
          </div>
          <TokenSelector
            id="ask"
            selectedToken={TOKENS.find((v) => v.address === askCoinAddress)!}
            tokens={TOKENS}
            onChange={setAskCoinAddress}
            tokenBalances={tokenBalances}
          />
        </div>

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
