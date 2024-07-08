import styled from '@emotion/styled';
import { NextPage } from 'next';
import { useState } from 'react';

import { TokenSelector } from '@/components/TokenSelector';
import { Button } from '@/components/ui/button';
import { CONTRACTS, TOKENS } from '@/constants/tokens';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { ArchivoFont } from '@/styles/fonts';

const MintDemoPage: NextPage = () => {
  const [offerCoinAddress, setOfferCoinAddress] = useState<string>(
    CONTRACTS.wBTC,
  );
  const [askCoinAddress, setAskCoinAddress] = useState<string>(CONTRACTS.lMINT);
  const [inputDraft, setInputDraft] = useState<string>('1');
  const [estimation, setEstimation] = useState<string>('0');

  const { tokenBalances } = useTokenBalances();

  return (
    <div
      className={`w-full min-h-screen bg-background ${ArchivoFont.className} flex justify-center items-center`}
    >
      <div className="w-full max-w-[525px] mx-auto gap-[10px] flex flex-col">
        <div className="flex items-center w-full gap-4 px-3.5 py-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <div className="flex flex-col w-full">
            <span className="text-sm text-slate-400 dark:text-slate-500">
              {offerCoinAddress === 'wbtc' ? 'You deposit' : 'You burn'}
            </span>
            <Input
              value={inputDraft}
              onChange={(e) => setInputDraft(e.target.value)}
              className="text-slate-900 dark:text-slate-100"
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

        <div className="flex items-center w-full gap-4 px-3.5 py-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <div className="flex flex-col w-full">
            <span className="text-sm text-slate-400 dark:text-slate-500">
              {askCoinAddress === 'wbtc' ? 'You receive' : 'You mint'}
            </span>
            <Input
              value={estimation}
              disabled
              className="text-slate-900 dark:text-slate-100"
            />
          </div>
          <TokenSelector
            id="ask"
            selectedToken={TOKENS.find((v) => v.address === askCoinAddress)!}
            tokens={TOKENS}
            onChange={setAskCoinAddress}
            tokenBalances={tokenBalances}
          />
        </div>

        <Button className="w-full py-7 text-[18px] font-bold bg-emerald-300 hover:bg-emerald-400 text-slate-800 dark:bg-emerald-400 dark:hover:bg-emerald-500 dark:text-slate-900 rounded-[12px] transition-colors duration-200">
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

const Input = styled.input`
  width: 100%;
  flex: 1;
  font-size: 30px;
  font-weight: bold;
  background-color: transparent;
  letter-spacing: -1.6px;
`;
