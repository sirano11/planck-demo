import styled from '@emotion/styled';
import { NextPage } from 'next';
import { useState } from 'react';

import { Token } from '@/components/TokenSelectionItem';
import { TokenSelector } from '@/components/TokenSelector';
import { Button } from '@/components/ui/button';
import { ArchivoFont } from '@/styles/fonts';

const tokens: Token[] = [
  {
    type: 'wbtc',
    symbol: 'wBTC',
    logo: '/assets/bitcoin.png',
  },
  {
    type: 'lmint',
    symbol: 'MINT',
    logo: '/assets/mint.png',
  },
  {
    type: 'sdr',
    symbol: 'cashSDR',
    logo: '/assets/cash-sdr.png',
  },
  {
    type: 'livre',
    symbol: 'cashLIVRE',
    logo: '/assets/cash-livre.png',
  },
  {
    type: 'krw',
    symbol: 'cashKRW',
    logo: '/assets/cash-krw.png',
  },
  {
    type: 'jpy',
    symbol: 'cashJPY',
    logo: '/assets/cash-jpy.png',
  },
];

const MintDemoPage: NextPage = () => {
  const [offerCoinType, setOfferCoinType] = useState<string>('wbtc');
  const [askCoinType, setAskCoinType] = useState<string>('lmint');
  const [inputDraft, setInputDraft] = useState<string>('1');
  const [estimation, setEstimation] = useState<string>('0');
  const [balances, setBalances] = useState<Record<string, string>>({});

  return (
    <div
      className={`w-full min-h-screen bg-background ${ArchivoFont.className} flex justify-center items-center`}
    >
      <div className="w-full max-w-[525px] mx-auto gap-[10px] flex flex-col">
        <div className="flex items-center w-full gap-4 px-3.5 py-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <div className="flex flex-col w-full">
            <span className="text-sm text-slate-400 dark:text-slate-500">
              {offerCoinType === 'wbtc' ? 'You deposit' : 'You burn'}
            </span>
            <Input
              value={inputDraft}
              onChange={(e) => setInputDraft(e.target.value)}
              className="text-slate-900 dark:text-slate-100"
            />
          </div>
          <TokenSelector
            id="offer"
            selectedToken={tokens.find((v) => v.type === offerCoinType)!}
            tokens={tokens}
            onChange={setOfferCoinType}
          />
        </div>

        <div className="flex items-center w-full gap-4 px-3.5 py-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <div className="flex flex-col w-full">
            <span className="text-sm text-slate-400 dark:text-slate-500">
              {askCoinType === 'wbtc' ? 'You receive' : 'You mint'}
            </span>
            <Input
              value={estimation}
              disabled
              className="text-slate-900 dark:text-slate-100"
            />
          </div>
          <TokenSelector
            id="ask"
            selectedToken={tokens.find((v) => v.type === askCoinType)!}
            tokens={tokens}
            onChange={setAskCoinType}
          />
        </div>

        <Button className="w-full py-7 text-[18px] font-bold bg-emerald-300 hover:bg-emerald-400 text-slate-800 dark:bg-emerald-400 dark:hover:bg-emerald-500 dark:text-slate-900 rounded-[12px] transition-colors duration-200">
          {offerCoinType === askCoinType
            ? 'Invalid Route'
            : offerCoinType === 'wbtc'
              ? 'Deposit'
              : askCoinType === 'wbtc'
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
