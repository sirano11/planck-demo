import styled from '@emotion/styled';
import { CoinStruct, SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { NextPage } from 'next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Address, formatUnits } from 'viem';

import { TokenSelector } from '@/components/TokenSelector';
import { Button } from '@/components/ui/button';
import { TOKENS } from '@/constants/tokens';
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
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { atomicsFromFloat, formatRawAmount } from '@/utils/format';

const MintDemoPage: NextPage = () => {
  const [offerCoinAddress, setOfferCoinAddress] = useState<Address>(
    TOKEN_ADDRESS.wBTC,
  );
  const [askCoinAddress, setAskCoinAddress] = useState<Address>(
    TOKEN_ADDRESS.lMINT,
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

  const onClickSwap = useCallback(async () => {
    const parsedInput = parseFloat(inputDraft);
    if (isNaN(parsedInput)) {
      return;
    }
    const inputAtomics = atomicsFromFloat(parsedInput);

    const offer = TOKENS.find((v) => v.address === offerCoinAddress)!;
    const ask = TOKENS.find((v) => v.address === askCoinAddress)!;

    const actorAddress = '0xadf'; // FIXME: get actor address by querying

    let nextCursor: string | null | undefined;
    let offerCoins: CoinStruct[] = [];
    let offerCoinTotal = 0n;
    do {
      const coins = await client.getCoins({
        owner: actorAddress,
        cursor: nextCursor,
        coinType: offer.typeArgument,
      });

      offerCoins = [...offerCoins, ...coins.data];
      offerCoinTotal += coins.data.reduce(
        (acc, v) => acc + BigInt(v.balance),
        0n,
      );

      nextCursor = coins.hasNextPage ? coins.nextCursor : undefined;
    } while (nextCursor);

    if (offerCoins.length === 0) {
      console.log('No coin found in actor wallet');
      return;
    }

    const offerCoinObjectIds = offerCoins.map((v) => v.coinObjectId);

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

    await commit(
      HUB_CONTRACT_ADDRESS,
      offerCoinAddress,
      inputAtomics,
      ChainIdentifier.Ethereum,
      rawTx,
    );
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
                {askCoinAddress === TOKEN_ADDRESS.wBTC
                  ? 'You receive'
                  : 'You mint'}
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

        <Button
          onClick={onClickSwap}
          className="w-full py-8 text-[22px] font-bold bg-emerald-300 hover:bg-emerald-400 text-slate-800 rounded-[12px] transition-colors duration-200"
        >
          {offerCoinAddress === askCoinAddress
            ? 'Invalid Route'
            : offerCoinAddress === TOKEN_ADDRESS.wBTC
              ? 'Deposit'
              : askCoinAddress === TOKEN_ADDRESS.wBTC
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
