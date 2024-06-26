import styled from '@emotion/styled';
import { NextPage } from 'next';
import { useState } from 'react';

import { Token } from '@/components/TokenSelectionItem';
import { TokenSelector } from '@/components/TokenSelector';
import { Button } from '@/components/ui/button';
import { ArchivoFont } from '@/styles/fonts';

const tokens: Token[] = [
  {
    // FIXME: replace with actual type name with packageId
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
  // FIXME: replace with actual type name with packageId
  const [offerCoinType, setOfferCoinType] = useState<string>('wbtc');
  const [askCoinType, setAskCoinType] = useState<string>('lmint');
  const [inputDraft, setInputDraft] = useState<string>('1');
  const [estimation, setEstimation] = useState<string>('0');

  const [balances, setBalances] = useState<Record<string, string>>({});

  return (
    <div
      className={`w-full h-full pt-[64px] min-h-screen bg-slate-50 ${ArchivoFont.className}!`}
    >
      <div className="w-full max-w-[420px] mx-auto gap-[10px] flex flex-col">
        <div className="flex items-center w-full gap-4 px-3.5 py-3.5 bg-slate-100 rounded-2xl">
          <div className="flex flex-col w-full">
            <span className="text-sm text-slate-400">
              {offerCoinType === 'wbtc' ? 'You deposit' : 'You burn'}
            </span>
            <Input
              value={inputDraft}
              onChange={(e) => setInputDraft(e.target.value)}
            />
          </div>
          <TokenSelector
            id="offer"
            selectedToken={tokens.find((v) => v.type === offerCoinType)!}
            tokens={tokens}
            onChange={setOfferCoinType}
          />
        </div>

        <div className="flex items-center w-full gap-4 px-3.5 py-3.5 bg-slate-100 rounded-2xl">
          <div className="flex flex-col w-full">
            <span className="text-sm text-slate-400">
              {askCoinType === 'wbtc' ? 'You receive' : 'You mint'}
            </span>
            <Input value={estimation} disabled />
          </div>
          <TokenSelector
            id="ask"
            selectedToken={tokens.find((v) => v.type === askCoinType)!}
            tokens={tokens}
            onChange={setAskCoinType}
          />
        </div>

        <Button className="w-full py-7 text-[18px] font-bold bg-slate-900 rounded-[12px]">
          {offerCoinType === askCoinType
            ? 'Invalid Route'
            : offerCoinType === 'wbtc'
              ? 'Deposit'
              : askCoinType === 'wbtc'
                ? 'Withdraw'
                : 'Swap'}
        </Button>
      </div>

      <br />

      {JSON.stringify(balances, null, 2)}
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
  color: #2b3b38;
  letter-spacing: -1.6px;
`;
